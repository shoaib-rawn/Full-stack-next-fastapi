from dataclasses import dataclass
from typing import Annotated, Any, Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from jwt.exceptions import InvalidTokenError
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.redis import get_redis_client
from app.db.session import get_db_session
from app.models.user import User
from app.services.token_revocation import is_access_token_revoked


bearer_scheme = HTTPBearer(
    scheme_name="Bearer authentication",
    description="Enter the access token returned by /auth/login.",
    bearerFormat="JWT",
    auto_error=False,
)


def unauthorized_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )


@dataclass(frozen=True)
class AuthContext:
    user: User
    raw_token: str
    payload: dict[str, object]


async def get_auth_context(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
    redis: Annotated[
        Redis,
        Depends(get_redis_client),
    ],
) -> AuthContext:
    if credentials is None:
        raise unauthorized_exception()

    try:
        payload = decode_access_token(
            credentials.credentials
        )

        subject = payload.get("sub")
        organization_id = payload.get(
            "organization_id"
        )
        role = payload.get("role")
        token_version = payload.get("token_version")
        jti = payload.get("jti")
        expires_at = payload.get("exp")

        if (
            not isinstance(subject, str)
            or not subject.isdigit()
            or not isinstance(organization_id, int)
            or not isinstance(role, str)
            or not isinstance(token_version, int)
            or not isinstance(jti, str)
            or not isinstance(expires_at, int)
        ):
            raise unauthorized_exception()

        user_id = int(subject)

    except InvalidTokenError:
        raise unauthorized_exception() from None

    if await is_access_token_revoked(
        redis=redis,
        jti=jti,
    ):
        raise unauthorized_exception()

    user = await session.get(
        User,
        user_id,
    )

    if user is None or not user.is_active:
        raise unauthorized_exception()

    if (
        user.organization_id != organization_id
        or user.role != role
        or user.token_version != token_version
    ):
        raise unauthorized_exception()

    return AuthContext(
        user=user,
        raw_token=credentials.credentials,
        payload=payload,
    )


async def get_current_user(
    context: Annotated[
        AuthContext,
        Depends(get_auth_context),
    ],
) -> User:
    return context.user


def require_roles(
    *allowed_roles: str,
) -> Callable[..., Any]:
    async def role_dependency(
        current_user: Annotated[
            User,
            Depends(get_current_user),
        ],
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return role_dependency


get_current_owner = require_roles("owner")
