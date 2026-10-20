from datetime import datetime, timezone

from fastapi import HTTPException, status
from redis.asyncio import Redis
from redis.exceptions import RedisError


def revoked_access_token_key(jti: str) -> str:
    return f"auth:revoked-access:{jti}"


async def is_access_token_revoked(
    redis: Redis,
    jti: str,
) -> bool:
    try:
        return bool(
            await redis.get(
                revoked_access_token_key(jti)
            )
        )
    except RedisError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is temporarily unavailable.",
        ) from None


async def revoke_access_token(
    redis: Redis,
    jti: str,
    expires_at_timestamp: int,
) -> None:
    now_timestamp = int(
        datetime.now(timezone.utc).timestamp()
    )
    ttl = max(
        expires_at_timestamp - now_timestamp,
        1,
    )

    try:
        await redis.set(
            revoked_access_token_key(jti),
            "1",
            ex=ttl,
        )
    except RedisError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is temporarily unavailable.",
        ) from None
