from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class InvoiceLineItemCreate(BaseModel):
    description: str = Field(
        min_length=1,
        max_length=200,
        examples=["Website development"],
    )
    quantity: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2,
        examples=["2.00"],
    )
    unit_price: Decimal = Field(
        ge=0,
        max_digits=14,
        decimal_places=2,
        examples=["15000.00"],
    )


class InvoiceCreate(BaseModel):
    customer_id: int = Field(gt=0, examples=[1])
    currency: str = Field(
        default="PKR",
        min_length=3,
        max_length=3,
        pattern=r"^[A-Z]{3}$",
        examples=["PKR"],
    )
    tax_rate: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        le=100,
        max_digits=5,
        decimal_places=2,
        examples=["18.00"],
    )
    due_date: date | None = Field(
        default=None,
        examples=["2026-11-12"],
    )
    notes: str | None = Field(
        default=None,
        max_length=1000,
        examples=["Thank you for your business."],
    )
    line_items: list[InvoiceLineItemCreate] = Field(
        min_length=1,
        max_length=100,
    )


class InvoiceUpdate(BaseModel):
    customer_id: int | None = Field(default=None, gt=0, examples=[1])
    currency: str | None = Field(
        default=None,
        min_length=3,
        max_length=3,
        pattern=r"^[A-Z]{3}$",
        examples=["PKR"],
    )
    tax_rate: Decimal | None = Field(
        default=None,
        ge=0,
        le=100,
        max_digits=5,
        decimal_places=2,
        examples=["18.00"],
    )
    due_date: date | None = Field(default=None, examples=["2026-11-30"])
    notes: str | None = Field(
        default=None,
        max_length=1000,
        examples=["Updated payment terms."],
    )
    line_items: list[InvoiceLineItemCreate] | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    @model_validator(mode="after")
    def require_a_value(self) -> "InvoiceUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided.")

        nullable_fields = {"due_date", "notes"}
        invalid_nulls = {
            field
            for field in self.model_fields_set - nullable_fields
            if getattr(self, field) is None
        }
        if invalid_nulls:
            raise ValueError(
                "Only due_date and notes can be null."
            )
        return self


class InvoiceLineItemResponse(BaseModel):
    id: int
    invoice_id: int
    description: str
    quantity: Decimal
    unit_price: Decimal
    line_total: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvoiceResponse(BaseModel):
    id: int
    organization_id: int
    customer_id: int
    invoice_number: str
    status: str
    currency: str
    subtotal: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    total: Decimal
    amount_paid: Decimal
    balance_due: Decimal
    due_date: date | None
    notes: str | None
    line_items: list[InvoiceLineItemResponse]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
