from hashlib import sha256

from fastapi import HTTPException, status
from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.config import settings


def login_rate_limit_key(
    email: str,
    client_ip: str,
) -> str:
    email_digest = sha256(
        email.lower().encode("utf-8")
    ).hexdigest()

    return f"rate-limit:login:{client_ip}:{email_digest}"


async def check_login_rate_limit(
    redis: Redis,
    key: str,
) -> None:
    try:
        attempts_value = await redis.get(key)
        attempts = int(attempts_value or 0)

        if attempts >= settings.login_rate_limit_attempts:
            retry_after = max(await redis.ttl(key), 1)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Please try again later.",
                headers={
                    "Retry-After": str(retry_after),
                },
            )
    except RedisError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is temporarily unavailable.",
        ) from None


async def record_login_failure(
    redis: Redis,
    key: str,
) -> None:
    try:
        attempts = await redis.incr(key)

        if attempts == 1:
            await redis.expire(
                key,
                settings.login_rate_limit_window_seconds,
            )
    except RedisError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is temporarily unavailable.",
        ) from None


async def clear_login_failures(
    redis: Redis,
    key: str,
) -> None:
    try:
        await redis.delete(key)
    except RedisError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is temporarily unavailable.",
        ) from None
