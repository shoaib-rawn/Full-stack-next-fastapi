from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.report import DashboardSummaryResponse
from app.services.reports import build_dashboard_summary


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    summary="Get the current organization's dashboard summary",
)
async def get_dashboard_summary(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> DashboardSummaryResponse:
    return await build_dashboard_summary(
        session=session,
        organization_id=current_user.organization_id,
    )
