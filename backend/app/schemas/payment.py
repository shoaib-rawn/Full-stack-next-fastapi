from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class PaymentCreate(BaseModel):
    amount: Decimal = Field(
        gt=0,
        max_digits=14,
        decimal_places=2,
        examples=["10000.00"],
    )
    method: Literal[
        "cash",
        "bank_transfer",
        "card",
        "other",
    ] = "bank_transfer"
    reference: str | None = Field(
        default=None,
        max_length=100,
        examples=["BANK-REF-001"],
    )


class PaymentResponse(BaseModel):
    id: int
    organization_id: int
    invoice_id: int
    amount: Decimal
    method: str
    reference: str | None
    paid_at: datetime
    reversed_at: datetime | None
    reversal_reason: str | None
    reversed_by_user_id: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentReceiptResponse(BaseModel):
    payment: PaymentResponse
    invoice_status: str
    amount_paid: Decimal
    balance_due: Decimal


class PaymentReverseRequest(BaseModel):
    reason: str = Field(
        min_length=3,
        max_length=250,
        examples=["Bank transfer was returned."],
    )


class PaymentReversalResponse(BaseModel):
    payment: PaymentResponse
    invoice_status: str
    amount_paid: Decimal
    balance_due: Decimal
