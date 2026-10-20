from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_owner, get_current_user
from app.db.session import get_db_session
from app.models.organization import Organization
from app.models.user import User
from app.schemas.organization import OrganizationResponse, OrganizationUpdate


router = APIRouter(
    prefix="/organizations",
    tags=["Organizations"],
)


@router.get(
    "/current",
    response_model=OrganizationResponse,
    summary="Get the authenticated user's organization",
)
async def get_current_organization(
    current_user: Annotated[
        User,
        Depends(get_current_user),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> Organization:
    organization = await session.get(
        Organization,
        current_user.organization_id,
    )

    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )

    return organization


@router.patch(
    "/current",
    response_model=OrganizationResponse,
    summary="Update the authenticated user's organization",
)
async def update_current_organization(
    payload: OrganizationUpdate,
    current_user: Annotated[
        User,
        Depends(get_current_owner),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> Organization:
    organization = await session.get(
        Organization,
        current_user.organization_id,
    )

    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(organization, field, value)

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An organization with this slug already exists.",
        ) from None

    await session.refresh(organization)
    return organization
