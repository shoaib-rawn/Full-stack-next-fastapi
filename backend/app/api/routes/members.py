from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_owner
from app.api.dependencies.ids import DbId
from app.api.dependencies.pagination import PaginationParams
from app.core.security import hash_password
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.auth import CurrentUserResponse
from app.schemas.member import MemberCreate, MemberPage, MemberUpdate


router = APIRouter(
    prefix="/members",
    tags=["Members"],
)


async def get_member_or_404(
    member_id: int,
    organization_id: int,
    session: AsyncSession,
) -> User:
    member = await session.scalar(
        select(User).where(
            User.id == member_id,
            User.organization_id == organization_id,
        )
    )
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found.",
        )
    return member


@router.post(
    "",
    response_model=CurrentUserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an organization member",
    description="Owner-only endpoint. New users start with the member role.",
)
async def create_member(
    payload: MemberCreate,
    current_owner: Annotated[
        User,
        Depends(get_current_owner),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> User:
    member = User(
        organization_id=current_owner.organization_id,
        full_name=payload.full_name,
        email=str(payload.email).lower(),
        hashed_password=hash_password(
            payload.password.get_secret_value()
        ),
        role="member",
        is_active=True,
    )
    session.add(member)

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        ) from None

    await session.refresh(member)
    return member


@router.get(
    "",
    response_model=MemberPage,
    summary="List organization members",
    description="Owner-only paginated member list.",
)
async def list_members(
    current_owner: Annotated[
        User,
        Depends(get_current_owner),
    ],
    pagination: Annotated[
        PaginationParams,
        Depends(),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> MemberPage:
    tenant_filter = (
        User.organization_id
        == current_owner.organization_id
    )
    total = await session.scalar(
        select(func.count())
        .select_from(User)
        .where(tenant_filter)
    )
    result = await session.execute(
        select(User)
        .where(tenant_filter)
        .order_by(User.id)
        .offset(pagination.offset)
        .limit(pagination.size)
    )
    members = [
        CurrentUserResponse.model_validate(member)
        for member in result.scalars().all()
    ]
    return MemberPage.create(
        items=members,
        page=pagination.page,
        size=pagination.size,
        total=total or 0,
    )


@router.patch(
    "/{member_id}",
    response_model=CurrentUserResponse,
    summary="Update a member",
    description=(
        "Owner-only endpoint for profile, role and active-state changes. "
        "An owner cannot demote or deactivate their own account."
    ),
)
async def update_member(
    member_id: DbId,
    payload: MemberUpdate,
    current_owner: Annotated[
        User,
        Depends(get_current_owner),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> User:
    member = await get_member_or_404(
        member_id=member_id,
        organization_id=current_owner.organization_id,
        session=session,
    )
    update_data = payload.model_dump(exclude_unset=True)

    if member.id == current_owner.id and (
        update_data.get("role") == "member"
        or update_data.get("is_active") is False
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You cannot demote or deactivate your own owner account.",
        )

    for field, value in update_data.items():
        setattr(member, field, value)

    await session.commit()
    await session.refresh(member)
    return member
