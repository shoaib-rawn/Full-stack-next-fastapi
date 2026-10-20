from datetime import datetime, timedelta, timezone
from hashlib import sha256
from hmac import compare_digest
from uuid import uuid4

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from app.core.config import settings


password_hasher = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return password_hasher.verify(
        plain_password,
        hashed_password,
    )


def create_access_token(
    *,
    user_id: int,
    organization_id: int,
    role: str,
    token_version: int = 0,
) -> str:
    now = datetime.now(timezone.utc)

    expires_at = now + timedelta(
        minutes=settings.access_token_expire_minutes
    )

    payload = {
        "sub": str(user_id),
        "organization_id": organization_id,
        "role": role,
        "token_version": token_version,
        "type": "access",
        "iat": now,
        "exp": expires_at,
        "jti": str(uuid4()),
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(
    token: str,
) -> dict[str, object]:
    payload = jwt.decode(
        token,
        settings.jwt_secret_key.get_secret_value(),
        algorithms=[settings.jwt_algorithm],
        options={
            "require": [
                "sub",
                "organization_id",
                "role",
                "token_version",
                "type",
                "iat",
                "exp",
                "jti",
            ],
        },
    )

    if payload.get("type") != "access":
        raise InvalidTokenError(
            "Invalid token type."
        )

    return payload


def create_refresh_token(
    *,
    user_id: int,
    organization_id: int,
) -> tuple[str, str, datetime]:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(
        days=settings.refresh_token_expire_days
    )
    jti = str(uuid4())

    payload = {
        "sub": str(user_id),
        "organization_id": organization_id,
        "type": "refresh",
        "iat": now,
        "exp": expires_at,
        "jti": jti,
    }

    token = jwt.encode(
        payload,
        settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )

    return token, jti, expires_at


def decode_refresh_token(
    token: str,
) -> dict[str, object]:
    payload = jwt.decode(
        token,
        settings.jwt_secret_key.get_secret_value(),
        algorithms=[settings.jwt_algorithm],
        options={
            "require": [
                "sub",
                "organization_id",
                "type",
                "iat",
                "exp",
                "jti",
            ],
        },
    )

    if payload.get("type") != "refresh":
        raise InvalidTokenError(
            "Invalid token type."
        )

    return payload


def hash_token(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()


def token_hash_matches(
    token: str,
    stored_hash: str,
) -> bool:
    return compare_digest(
        hash_token(token),
        stored_hash,
    )
