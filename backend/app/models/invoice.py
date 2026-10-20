from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    Date,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


if TYPE_CHECKING:
    from app.models.invoice_line_item import InvoiceLineItem


class Invoice(TimestampMixin, Base):
    __tablename__ = "invoices"

    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "invoice_number",
            name="uq_invoices_organization_number",
        ),
        CheckConstraint(
            "status IN ('issued', 'partially_paid', 'paid', 'void')",
            name="ck_invoices_status",
        ),
        CheckConstraint(
            "subtotal >= 0 AND tax_amount >= 0 AND total >= 0 "
            "AND amount_paid >= 0 AND balance_due >= 0",
            name="ck_invoices_non_negative_totals",
        ),
        CheckConstraint(
            "tax_rate >= 0 AND tax_rate <= 100",
            name="ck_invoices_tax_rate",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    invoice_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="issued",
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="PKR",
    )

    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )

    tax_rate: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
    )

    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )

    total: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )

    amount_paid: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    balance_due: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )

    due_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    line_items: Mapped[list["InvoiceLineItem"]] = relationship(
        back_populates="invoice",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="InvoiceLineItem.id",
    )
