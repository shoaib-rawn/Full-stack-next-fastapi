from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from redis.asyncio import Redis
from redis.exceptions import RedisError
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.redis import get_redis_client
from app.db.session import get_db_session
from app.schemas.health import HealthResponse, ReadinessResponse


router = APIRouter(
    prefix="/health",
    tags=["System"],
)


@router.get(
    "",
    response_model=HealthResponse,
    summary="Check API health",
)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="ledgerlite-api",
    )


@router.get(
    "/ready",
    response_model=ReadinessResponse,
    summary="Check database and Redis readiness",
)
async def readiness_check(
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
    redis: Annotated[
        Redis,
        Depends(get_redis_client),
    ],
) -> ReadinessResponse:
    checks: dict[str, str] = {}
    try:
        await session.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except SQLAlchemyError:
        checks["database"] = "unavailable"

    try:
        await redis.ping()
        checks["redis"] = "ok"
    except RedisError:
        checks["redis"] = "unavailable"

    if "unavailable" in checks.values():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "not-ready",
                "service": "ledgerlite-api",
                "checks": checks,
            },
        )

    return ReadinessResponse(
        status="ready",
        service="ledgerlite-api",
        checks=checks,
    )
