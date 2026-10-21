from decimal import Decimal

from pydantic import BaseModel, Field


class CurrencyTotals(BaseModel):
    currency: str = Field(min_length=3, max_length=3)
    total_invoiced: Decimal = Field(ge=0)
    total_paid: Decimal = Field(ge=0)
    total_outstanding: Decimal = Field(ge=0)


class DashboardSummaryResponse(BaseModel):
    total_customers: int = Field(ge=0)
    total_invoices: int = Field(ge=0)
    issued_invoices: int = Field(ge=0)
    partially_paid_invoices: int = Field(ge=0)
    paid_invoices: int = Field(ge=0)
    void_invoices: int = Field(ge=0)
    currency_totals: list[CurrencyTotals]
