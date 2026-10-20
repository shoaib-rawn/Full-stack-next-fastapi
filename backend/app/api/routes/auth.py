from typing import Annotated

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import (
    AuthContext,
    get_auth_context,
    get_current_user,
)
from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.db.redis import get_redis_client
from app.db.session import get_db_session
from app.models.organization import Organization
from app.models.user import User
from app.schemas.auth import (
    CurrentUserResponse,
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    SignupRequest,
    TokenResponse,
)
from app.services.auth import (
    RefreshTokenError,
    authenticate_user,
    issue_refresh_token,
    revoke_active_refresh_tokens,
    revoke_refresh_token,
    rotate_refresh_token,
)
from app.services.rate_limit import (
    check_login_rate_limit,
    clear_login_failures,
    login_rate_limit_key,
    record_login_failure,
)
from app.services.token_revocation import revoke_access_token


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/signup",
    response_model=CurrentUserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an owner account",
    description=(
        "Creates an organization and its first owner in one database transaction."
    ),
    response_description="The newly created organization owner.",
)
async def signup(
    payload: SignupRequest,
    session: AsyncSession = Depends(get_db_session),
) -> User:
    normalized_email = str(payload.email).lower()

    existing_organization_id = await session.scalar(
        select(Organization.id).where(
            Organization.slug == payload.organization.slug
        )
    )

    if existing_organization_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An organization with this slug already exists.",
        )

    existing_user_id = await session.scalar(
        select(User.id).where(
            User.email == normalized_email
        )
    )

    if existing_user_id is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    hashed_password = hash_password(
        payload.password.get_secret_value()
    )

    organization = Organization(
        name=payload.organization.name,
        slug=payload.organization.slug,
    )

    session.add(organization)

    try:
        await session.flush()

        user = User(
            organization_id=organization.id,
            full_name=payload.full_name,
            email=normalized_email,
            hashed_password=hashed_password,
            role="owner",
        )

        session.add(user)
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The email or organization slug already exists.",
        ) from None

    await session.refresh(user)
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in and receive an access token",
    description=(
        "Verifies the email and password, then returns "
        "a bearer access token valid for two hours."
    ),
)
async def login(
    payload: LoginRequest,
    request: Request,
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
    redis: Annotated[
        Redis,
        Depends(get_redis_client),
    ],
) -> TokenResponse:
    client_ip = (
        request.client.host
        if request.client is not None
        else "unknown"
    )
    rate_limit_key = login_rate_limit_key(
        email=str(payload.email),
        client_ip=client_ip,
    )

    await check_login_rate_limit(
        redis=redis,
        key=rate_limit_key,
    )

    user = await authenticate_user(
        email=str(payload.email),
        password=payload.password.get_secret_value(),
        session=session,
    )

    if user is None:
        await record_login_failure(
            redis=redis,
            key=rate_limit_key,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    await clear_login_failures(
        redis=redis,
        key=rate_limit_key,
    )

    access_token = create_access_token(
        user_id=user.id,
        organization_id=user.organization_id,
        role=user.role,
        token_version=user.token_version,
    )
    refresh_token = issue_refresh_token(
        user=user,
        session=session,
    )

    await session.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=(
            settings.access_token_expire_minutes * 60
        ),
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rotate a refresh token",
    description=(
        "Consumes one refresh token and returns a new access/refresh pair. "
        "The consumed token cannot be used again."
    ),
)
async def refresh_access_token(
    payload: RefreshTokenRequest,
    session: AsyncSession = Depends(get_db_session),
) -> TokenResponse:
    try:
        access_token, refresh_token = await rotate_refresh_token(
            raw_token=payload.refresh_token.get_secret_value(),
            session=session,
        )
    except RefreshTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        ) from None

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=(
            settings.access_token_expire_minutes * 60
        ),
    )


@router.get(
    "/me",
    response_model=CurrentUserResponse,
    summary="Get the current authenticated user",
    description=(
        "Validates the bearer access token and "
        "returns the latest user data from the database."
    ),
)
async def get_my_profile(
    current_user: Annotated[
        User,
        Depends(get_current_user),
    ],
) -> User:
    return current_user


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Log out the current session",
    description=(
        "Revokes the supplied refresh token and denies the current "
        "access token until its original expiry."
    ),
)
async def logout(
    payload: LogoutRequest,
    context: Annotated[
        AuthContext,
        Depends(get_auth_context),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
    redis: Annotated[
        Redis,
        Depends(get_redis_client),
    ],
) -> Response:
    try:
        await revoke_refresh_token(
            raw_token=payload.refresh_token.get_secret_value(),
            user_id=context.user.id,
            session=session,
        )
    except RefreshTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token for this session.",
        ) from None

    await session.commit()
    await revoke_access_token(
        redis=redis,
        jti=str(context.payload["jti"]),
        expires_at_timestamp=int(context.payload["exp"]),
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/logout-all",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Log out all sessions",
    description=(
        "Revokes every active refresh token for the current user and "
        "denies the access token used for this request."
    ),
)
async def logout_all(
    context: Annotated[
        AuthContext,
        Depends(get_auth_context),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
    redis: Annotated[
        Redis,
        Depends(get_redis_client),
    ],
) -> Response:
    await revoke_active_refresh_tokens(
        user_id=context.user.id,
        revoked_at=datetime.now(timezone.utc),
        session=session,
    )
    context.user.token_version += 1
    await session.commit()
    await revoke_access_token(
        redis=redis,
        jti=str(context.payload["jti"]),
        expires_at_timestamp=int(context.payload["exp"]),
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
