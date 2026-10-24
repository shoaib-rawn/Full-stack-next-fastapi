from datetime import datetime, timezone
from decimal import Decimal
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.dependencies.auth import get_current_owner, get_current_user
from app.api.dependencies.ids import DbId
from app.api.dependencies.pagination import PaginationParams
from app.core.limits import DB_ID_MAX
from app.db.session import get_db_session
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.invoice_line_item import InvoiceLineItem
from app.models.organization import Organization
from app.models.user import User
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceLineItemCreate,
    InvoiceResponse,
    InvoiceUpdate,
    InvoiceVoidRequest,
)
from app.schemas.pagination import Page
from app.services.accounting import AccountingError, calculate_invoice


router = APIRouter(
    prefix="/invoices",
    tags=["Invoices"],
)


async def get_invoice_or_404(
    invoice_id: int,
    organization_id: int,
    session: AsyncSession,
    *,
    lock: bool = False,
) -> Invoice:
    statement = (
        select(Invoice)
        .where(
            Invoice.id == invoice_id,
            Invoice.organization_id == organization_id,
        )
        .options(selectinload(Invoice.line_items))
    )
    if lock:
        # Same row lock that recording and reversing a payment take, so a
        # payment can never land between our checks and our write.
        statement = statement.with_for_update(of=Invoice)
    invoice = await session.scalar(statement)

    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )

    return invoice



def calculate_or_422(
    line_items: list[InvoiceLineItemCreate],
    tax_rate: Decimal,
):
    try:
        return calculate_invoice(line_items=line_items, tax_rate=tax_rate)
    except AccountingError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from None

@router.post(
    "",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an invoice with calculated totals",
)
async def create_invoice(
    payload: InvoiceCreate,
    current_user: Annotated[
        User,
        Depends(get_current_user),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> Invoice:
    customer_id = await session.scalar(
        select(Customer.id).where(
            Customer.id == payload.customer_id,
            Customer.organization_id
            == current_user.organization_id,
        )
    )

    if customer_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    organization = await session.scalar(
        select(Organization)
        .where(Organization.id == current_user.organization_id)
        .with_for_update()
    )
    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )

    year = datetime.now(timezone.utc).year
    sequence = organization.next_invoice_sequence

    # Existing organizations may already contain manually numbered invoices.
    # Skip any matching generated number while the organization row is locked.
    while True:
        invoice_number = f"INV-{year}-{sequence:04d}"
        number_exists = await session.scalar(
            select(Invoice.id).where(
                Invoice.organization_id == current_user.organization_id,
                Invoice.invoice_number == invoice_number,
            )
        )
        if number_exists is None:
            break
        sequence += 1

    organization.next_invoice_sequence = sequence + 1

    calculation = calculate_or_422(
        line_items=payload.line_items,
        tax_rate=payload.tax_rate,
    )

    invoice = Invoice(
        organization_id=current_user.organization_id,
        customer_id=customer_id,
        invoice_number=invoice_number,
        status="issued",
        currency=payload.currency,
        subtotal=calculation.subtotal,
        tax_rate=payload.tax_rate,
        tax_amount=calculation.tax_amount,
        total=calculation.total,
        amount_paid=0,
        balance_due=calculation.total,
        due_date=payload.due_date,
        notes=payload.notes,
        line_items=[
            InvoiceLineItem(
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=item.line_total,
            )
            for item in calculation.line_items
        ],
    )

    session.add(invoice)

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This organization already has an invoice "
                "with this invoice number."
            ),
        ) from None

    await session.refresh(
        invoice,
        attribute_names=["line_items"],
    )
    return invoice


@router.get(
    "",
    response_model=Page[InvoiceResponse],
    summary="List invoices for the current organization",
)
async def list_invoices(
    current_user: Annotated[
        User,
        Depends(get_current_user),
    ],
    pagination: Annotated[
        PaginationParams,
        Depends(),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
    invoice_status: Annotated[
        Literal["issued", "partially_paid", "paid", "void"] | None,
        Query(alias="status"),
    ] = None,
    customer_id: Annotated[int | None, Query(gt=0, le=DB_ID_MAX)] = None,
) -> Page[InvoiceResponse]:
    filters = [
        Invoice.organization_id == current_user.organization_id,
    ]
    if invoice_status is not None:
        filters.append(Invoice.status == invoice_status)
    if customer_id is not None:
        filters.append(Invoice.customer_id == customer_id)

    total = await session.scalar(
        select(func.count())
        .select_from(Invoice)
        .where(*filters)
    )
    result = await session.execute(
        select(Invoice)
        .where(*filters)
        .options(selectinload(Invoice.line_items))
        .order_by(Invoice.id.desc())
        .offset(pagination.offset)
        .limit(pagination.size)
    )

    return Page[InvoiceResponse].create(
        items=list(result.scalars().all()),
        page=pagination.page,
        size=pagination.size,
        total=total or 0,
    )


@router.get(
    "/{invoice_id}",
    response_model=InvoiceResponse,
    summary="Get one invoice",
)
async def get_invoice(
    invoice_id: DbId,
    current_user: Annotated[
        User,
        Depends(get_current_user),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> Invoice:
    return await get_invoice_or_404(
        invoice_id=invoice_id,
        organization_id=current_user.organization_id,
        session=session,
    )


@router.patch(
    "/{invoice_id}",
    response_model=InvoiceResponse,
    summary="Update an unpaid invoice",
    description=(
        "Updates an issued invoice only while it has no payments. "
        "All totals are recalculated on the server."
    ),
)
async def update_invoice(
    invoice_id: DbId,
    payload: InvoiceUpdate,
    current_user: Annotated[
        User,
        Depends(get_current_user),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> Invoice:
    invoice = await get_invoice_or_404(
        invoice_id=invoice_id,
        organization_id=current_user.organization_id,
        session=session,
        lock=True,
    )

    if invoice.status != "issued" or invoice.amount_paid != 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only an unpaid issued invoice can be updated.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    if "customer_id" in update_data:
        customer_id = await session.scalar(
            select(Customer.id).where(
                Customer.id == update_data["customer_id"],
                Customer.organization_id
                == current_user.organization_id,
            )
        )
        if customer_id is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found.",
            )
        invoice.customer_id = customer_id

    tax_rate = payload.tax_rate if "tax_rate" in update_data else invoice.tax_rate
    line_items = (
        payload.line_items
        if "line_items" in update_data
        else [
            InvoiceLineItemCreate(
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
            )
            for item in invoice.line_items
        ]
    )
    calculation = calculate_or_422(
        line_items=line_items,
        tax_rate=tax_rate,
    )

    if "currency" in update_data:
        invoice.currency = payload.currency
    if "due_date" in update_data:
        invoice.due_date = payload.due_date
    if "notes" in update_data:
        invoice.notes = payload.notes

    invoice.tax_rate = tax_rate
    invoice.subtotal = calculation.subtotal
    invoice.tax_amount = calculation.tax_amount
    invoice.total = calculation.total
    invoice.balance_due = calculation.total

    if "line_items" in update_data:
        invoice.line_items = [
            InvoiceLineItem(
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=item.line_total,
            )
            for item in calculation.line_items
        ]

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This organization already has an invoice "
                "with this invoice number."
            ),
        ) from None

    await session.refresh(invoice)
    await session.refresh(invoice, attribute_names=["line_items"])
    return invoice


@router.post(
    "/{invoice_id}/void",
    response_model=InvoiceResponse,
    summary="Void an unpaid invoice",
    description=(
        "Keeps the accounting record but closes its outstanding balance, "
        "and records who voided it, when and why. "
        "Invoices with payments must have those payments reversed first."
    ),
)
async def void_invoice(
    invoice_id: DbId,
    payload: InvoiceVoidRequest,
    current_user: Annotated[
        User,
        Depends(get_current_owner),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> Invoice:
    invoice = await get_invoice_or_404(
        invoice_id=invoice_id,
        organization_id=current_user.organization_id,
        session=session,
        lock=True,
    )

    if invoice.status == "void":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This invoice is already void.",
        )
    if invoice.amount_paid != 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Reverse all invoice payments before voiding it.",
        )

    invoice.status = "void"
    invoice.balance_due = 0
    invoice.voided_at = datetime.now(timezone.utc)
    invoice.voided_by_user_id = current_user.id
    invoice.void_reason = payload.reason
    await session.commit()
    await session.refresh(invoice)
    await session.refresh(invoice, attribute_names=["line_items"])
    return invoice
