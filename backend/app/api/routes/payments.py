from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_owner, get_current_user
from app.api.dependencies.ids import DbId
from app.api.dependencies.pagination import PaginationParams
from app.db.session import get_db_session
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import (
    PaymentCreate,
    PaymentReceiptResponse,
    PaymentReversalResponse,
    PaymentReverseRequest,
    PaymentResponse,
)
from app.schemas.pagination import Page
from app.services.accounting import AccountingError, apply_payment, money


router = APIRouter(
    prefix="/invoices/{invoice_id}/payments",
    tags=["Payments"],
)

reversal_router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


@router.post(
    "",
    response_model=PaymentReceiptResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a payment against an invoice",
)
async def create_payment(
    invoice_id: DbId,
    payload: PaymentCreate,
    current_user: Annotated[
        User,
        Depends(get_current_user),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> PaymentReceiptResponse:
    invoice = await session.scalar(
        select(Invoice)
        .where(
            Invoice.id == invoice_id,
            Invoice.organization_id
            == current_user.organization_id,
        )
        .with_for_update()
    )

    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )

    try:
        apply_payment(
            invoice=invoice,
            amount=payload.amount,
        )
    except AccountingError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from None

    payment = Payment(
        organization_id=current_user.organization_id,
        invoice_id=invoice.id,
        amount=money(payload.amount),
        method=payload.method,
        reference=payload.reference,
    )
    session.add(payment)
    await session.commit()
    await session.refresh(payment)

    return PaymentReceiptResponse(
        payment=PaymentResponse.model_validate(payment),
        invoice_status=invoice.status,
        amount_paid=invoice.amount_paid,
        balance_due=invoice.balance_due,
    )


@router.get(
    "",
    response_model=Page[PaymentResponse],
    summary="List payments for one invoice",
)
async def list_payments(
    invoice_id: DbId,
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
) -> Page[PaymentResponse]:
    invoice_exists = await session.scalar(
        select(Invoice.id).where(
            Invoice.id == invoice_id,
            Invoice.organization_id
            == current_user.organization_id,
        )
    )

    if invoice_exists is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )

    payment_filter = (
        Payment.invoice_id == invoice_id,
        Payment.organization_id
        == current_user.organization_id,
    )
    total = await session.scalar(
        select(func.count())
        .select_from(Payment)
        .where(*payment_filter)
    )
    result = await session.execute(
        select(Payment)
        .where(*payment_filter)
        .order_by(Payment.id)
        .offset(pagination.offset)
        .limit(pagination.size)
    )

    return Page[PaymentResponse].create(
        items=list(result.scalars().all()),
        page=pagination.page,
        size=pagination.size,
        total=total or 0,
    )


@reversal_router.post(
    "/{payment_id}/reverse",
    response_model=PaymentReversalResponse,
    summary="Reverse a payment",
    description=(
        "Preserves the original payment as an audit record, marks it "
        "reversed, and restores the invoice balance in one transaction."
    ),
)
async def reverse_payment(
    payment_id: DbId,
    payload: PaymentReverseRequest,
    current_user: Annotated[
        User,
        Depends(get_current_owner),
    ],
    session: Annotated[
        AsyncSession,
        Depends(get_db_session),
    ],
) -> PaymentReversalResponse:
    payment = await session.scalar(
        select(Payment)
        .where(
            Payment.id == payment_id,
            Payment.organization_id
            == current_user.organization_id,
        )
        .with_for_update()
    )

    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found.",
        )
    if payment.reversed_at is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This payment is already reversed.",
        )

    invoice = await session.scalar(
        select(Invoice)
        .where(
            Invoice.id == payment.invoice_id,
            Invoice.organization_id
            == current_user.organization_id,
        )
        .with_for_update()
    )
    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found.",
        )

    new_amount_paid = money(invoice.amount_paid - payment.amount)
    if new_amount_paid < 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Payment reversal would create an invalid balance.",
        )

    payment.reversed_at = datetime.now(timezone.utc)
    payment.reversal_reason = payload.reason
    payment.reversed_by_user_id = current_user.id
    invoice.amount_paid = new_amount_paid
    invoice.balance_due = money(invoice.total - new_amount_paid)
    invoice.status = (
        "issued"
        if new_amount_paid == 0
        else "partially_paid"
    )

    await session.commit()
    await session.refresh(payment)

    return PaymentReversalResponse(
        payment=PaymentResponse.model_validate(payment),
        invoice_status=invoice.status,
        amount_paid=invoice.amount_paid,
        balance_due=invoice.balance_due,
    )
