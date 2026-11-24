from datetime import datetime, timedelta, timezone
from hashlib import sha256
import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from redis.asyncio import Redis
from redis.exceptions import RedisError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.redis import get_redis_client
from app.db.session import get_db_session
from app.models.assistant_guest import AssistantGuest


router = APIRouter(prefix="/assistant", tags=["Assistant"])


class GuestRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=8, max_length=20)

    @field_validator("full_name", "phone")
    @classmethod
    def strip_whitespace(cls, value: str) -> str:
        return value.strip()

    @field_validator("full_name")
    @classmethod
    def check_name(cls, value: str) -> str:
        if len(value) < 2:
            raise ValueError("Enter your full name.")
        return value

    @field_validator("phone")
    @classmethod
    def check_phone(cls, value: str) -> str:
        compact = value.replace(" ", "").replace("-", "")
        digits = compact[1:] if compact.startswith("+") else compact
        if not digits.isdigit() or not 8 <= len(digits) <= 15:
            raise ValueError("Enter a phone number with 8 to 15 digits.")
        return compact


class GuestSessionResponse(BaseModel):
    session_token: str
    expires_in: int


async def enforce_limit(redis: Redis, key: str, maximum: int, seconds: int) -> None:
    try:
        count = await redis.incr(key)
        if count == 1:
            await redis.expire(key, seconds)
        if count > maximum:
            retry_after = max(await redis.ttl(key), 1)
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later.",
                headers={"Retry-After": str(retry_after)},
            )
    except RedisError:
        raise HTTPException(status_code=503, detail="Guest chat is temporarily unavailable.") from None


async def require_guest(
    authorization: str | None,
    session: AsyncSession,
) -> AssistantGuest:
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or len(token) < 32:
        raise HTTPException(status_code=401, detail="Guest session required.")
    guest = await session.scalar(
        select(AssistantGuest).where(
            AssistantGuest.session_hash == sha256(token.encode()).hexdigest(),
            AssistantGuest.session_expires_at > datetime.now(timezone.utc),
        )
    )
    if guest is None:
        raise HTTPException(status_code=401, detail="Guest session expired.")
    return guest


@router.post("/guests", response_model=GuestSessionResponse, status_code=status.HTTP_201_CREATED)
async def register_guest(
    payload: GuestRegister,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_db_session),
    redis: Redis = Depends(get_redis_client),
) -> GuestSessionResponse:
    ip = request.client.host if request.client else "unknown"
    ip_hash = sha256(ip.encode()).hexdigest()
    await enforce_limit(redis, f"rate-limit:assistant-register:{ip_hash}", 5, 3600)
    token = secrets.token_urlsafe(32)
    guest = AssistantGuest(
        full_name=payload.full_name,
        email=str(payload.email).lower(),
        phone=payload.phone,
        session_hash=sha256(token.encode()).hexdigest(),
        session_expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    session.add(guest)
    await session.commit()
    response.headers["Cache-Control"] = "no-store"
    return GuestSessionResponse(session_token=token, expires_in=24 * 3600)


@router.get("/guest-session")
async def validate_guest(
    authorization: str | None = Header(default=None),
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, bool]:
    await require_guest(authorization, session)
    return {"valid": True}


@router.post("/guest-session/consume")
async def consume_guest_question(
    authorization: str | None = Header(default=None),
    session: AsyncSession = Depends(get_db_session),
    redis: Redis = Depends(get_redis_client),
) -> dict[str, bool]:
    guest = await require_guest(authorization, session)
    await enforce_limit(redis, f"rate-limit:assistant-chat:{guest.id}", 20, 3600)
    return {"allowed": True}


@router.delete("/guest-session", status_code=status.HTTP_204_NO_CONTENT)
async def end_guest_session(
    authorization: str | None = Header(default=None),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    guest = await require_guest(authorization, session)
    guest.session_expires_at = datetime.now(timezone.utc)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
