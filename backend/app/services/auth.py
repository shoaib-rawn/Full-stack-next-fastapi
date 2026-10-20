from datetime import datetime, timezone

from jwt.exceptions import InvalidTokenError
from sqlalchemy import select
from sqlalchemy import update as sql_update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_token,
    token_hash_matches,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User


class RefreshTokenError(Exception):
    pass


class RefreshTokenReuseError(RefreshTokenError):
    pass


async def authenticate_user(
    email: str,
    password: str,
    session: AsyncSession,
) -> User | None:
    normalized_email = email.lower()

    user = await session.scalar(
        select(User).where(
            User.email == normalized_email
        )
    )

    if user is None:
        return None

    if not user.is_active:
        return None

    if not verify_password(
        password,
        user.hashed_password,
    ):
        return None

    return user


def issue_refresh_token(
    user: User,
    session: AsyncSession,
) -> str:
    token, jti, expires_at = create_refresh_token(
        user_id=user.id,
        organization_id=user.organization_id,
    )

    session.add(
        RefreshToken(
            user_id=user.id,
            jti=jti,
            token_hash=hash_token(token),
            expires_at=expires_at,
        )
    )

    return token


async def revoke_active_refresh_tokens(
    user_id: int,
    revoked_at: datetime,
    session: AsyncSession,
) -> None:
    await session.execute(
        sql_update(RefreshToken)
        .where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
        )
        .values(revoked_at=revoked_at)
    )


async def revoke_refresh_token(
    raw_token: str,
    user_id: int,
    session: AsyncSession,
) -> None:
    try:
        payload = decode_refresh_token(raw_token)
    except InvalidTokenError as error:
        raise RefreshTokenError from error

    subject = payload.get("sub")
    jti = payload.get("jti")

    if (
        not isinstance(subject, str)
        or not subject.isdigit()
        or int(subject) != user_id
        or not isinstance(jti, str)
    ):
        raise RefreshTokenError

    stored_token = await session.scalar(
        select(RefreshToken)
        .where(RefreshToken.jti == jti)
        .with_for_update()
    )

    if (
        stored_token is None
        or stored_token.user_id != user_id
        or not token_hash_matches(
            raw_token,
            stored_token.token_hash,
        )
    ):
        raise RefreshTokenError

    if stored_token.revoked_at is None:
        stored_token.revoked_at = datetime.now(
            timezone.utc
        )


async def rotate_refresh_token(
    raw_token: str,
    session: AsyncSession,
) -> tuple[str, str]:
    try:
        payload = decode_refresh_token(raw_token)
    except InvalidTokenError as error:
        raise RefreshTokenError from error

    subject = payload.get("sub")
    organization_id = payload.get("organization_id")
    jti = payload.get("jti")

    if (
        not isinstance(subject, str)
        or not subject.isdigit()
        or not isinstance(organization_id, int)
        or not isinstance(jti, str)
    ):
        raise RefreshTokenError

    user_id = int(subject)
    now = datetime.now(timezone.utc)

    stored_token = await session.scalar(
        select(RefreshToken)
        .where(RefreshToken.jti == jti)
        .with_for_update()
    )

    if (
        stored_token is None
        or stored_token.user_id != user_id
        or not token_hash_matches(
            raw_token,
            stored_token.token_hash,
        )
    ):
        raise RefreshTokenError

    if stored_token.revoked_at is not None:
        await revoke_active_refresh_tokens(
            user_id=user_id,
            revoked_at=now,
            session=session,
        )
        await session.commit()
        raise RefreshTokenReuseError

    if stored_token.expires_at <= now:
        stored_token.revoked_at = now
        await session.commit()
        raise RefreshTokenError

    user = await session.get(User, user_id)

    if (
        user is None
        or not user.is_active
        or user.organization_id != organization_id
    ):
        stored_token.revoked_at = now
        await session.commit()
        raise RefreshTokenError

    new_refresh_token, new_jti, new_expires_at = (
        create_refresh_token(
            user_id=user.id,
            organization_id=user.organization_id,
        )
    )

    stored_token.revoked_at = now
    stored_token.replaced_by_jti = new_jti

    session.add(
        RefreshToken(
            user_id=user.id,
            jti=new_jti,
            token_hash=hash_token(new_refresh_token),
            expires_at=new_expires_at,
        )
    )

    access_token = create_access_token(
        user_id=user.id,
        organization_id=user.organization_id,
        role=user.role,
        token_version=user.token_version,
    )

    await session.commit()

    return access_token, new_refresh_token
