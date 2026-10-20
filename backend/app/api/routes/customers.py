from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_owner, get_current_user
from app.api.dependencies.pagination import PaginationParams
from app.db.session import get_db_session
from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer import (
    CustomerCreate,
    CustomerResponse,
    CustomerUpdate,
)
from app.schemas.pagination import Page


router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


async def get_customer_or_404(
    customer_id: int,
    organization_id: int,
    session: AsyncSession,
) -> Customer:
    statement = select(Customer).where(
        Customer.id == customer_id,
        Customer.organization_id == organization_id,
    )

    customer = await session.scalar(statement)

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    return customer


@router.post(
    "",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a customer",
)
async def create_customer(
    payload: CustomerCreate,
    current_user: Annotated[
        User,
        Depends(get_current_user),
    ],
    session: AsyncSession = Depends(get_db_session),
) -> Customer:
    customer = Customer(
        organization_id=current_user.organization_id,
        display_name=payload.display_name,
        email=payload.email,
    )

    session.add(customer)

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This organization already has "
                "a customer with this email."
            ),
        ) from None

    await session.refresh(customer)
    return customer


@router.get(
    "",
    response_model=Page[CustomerResponse],
    summary="List customers",
)
async def list_customers(
    current_user: Annotated[
        User,
        Depends(get_current_user),
    ],
    pagination: Annotated[
        PaginationParams,
        Depends(),
    ],
    session: AsyncSession = Depends(get_db_session),
    search: Annotated[
        str | None,
        Query(min_length=1, max_length=100),
    ] = None,
) -> Page[CustomerResponse]:
    filters = [
        Customer.organization_id == current_user.organization_id,
    ]
    if search:
        term = f"%{search.strip()}%"
        filters.append(
            or_(
                Customer.display_name.ilike(term),
                Customer.email.ilike(term),
            )
        )
    total = await session.scalar(
        select(func.count())
        .select_from(Customer)
        .where(*filters)
    )
    statement = (
        select(Customer)
        .where(*filters)
        .order_by(Customer.id)
        .offset(pagination.offset)
        .limit(pagination.size)
    )

    result = await session.execute(statement)

    return Page[CustomerResponse].create(
        items=list(result.scalars().all()),
        page=pagination.page,
        size=pagination.size,
        total=total or 0,
    )


@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
    summary="Get one customer",
)
async def get_customer(
    customer_id: int,
    current_user: Annotated[
        User,
        Depends(get_current_user),
    ],
    session: AsyncSession = Depends(get_db_session),
) -> Customer:
    return await get_customer_or_404(
        customer_id=customer_id,
        organization_id=current_user.organization_id,
        session=session,
    )


@router.patch(
    "/{customer_id}",
    response_model=CustomerResponse,
    summary="Update a customer",
)
async def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    current_user: Annotated[
        User,
        Depends(get_current_user),
    ],
    session: AsyncSession = Depends(get_db_session),
) -> Customer:
    customer = await get_customer_or_404(
        customer_id=customer_id,
        organization_id=current_user.organization_id,
        session=session,
    )

    update_data = payload.model_dump(
        exclude_unset=True,
    )

    for field, value in update_data.items():
        setattr(customer, field, value)

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This organization already has "
                "a customer with this email."
            ),
        ) from None

    await session.refresh(customer)
    return customer


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a customer",
)
async def delete_customer(
    customer_id: int,
    current_user: Annotated[
        User,
        Depends(get_current_owner),
    ],
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    customer = await get_customer_or_404(
        customer_id=customer_id,
        organization_id=current_user.organization_id,
        session=session,
    )

    await session.delete(customer)

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A customer with invoices cannot be deleted."
            ),
        ) from None

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )
