from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


if TYPE_CHECKING:
    from app.models.invoice import Invoice


class InvoiceLineItem(TimestampMixin, Base):
    __tablename__ = "invoice_line_items"

    __table_args__ = (
        CheckConstraint(
            "quantity > 0",
            name="ck_invoice_line_items_quantity_positive",
        ),
        CheckConstraint(
            "unit_price >= 0 AND line_total >= 0",
            name="ck_invoice_line_items_non_negative_money",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    invoice_id: Mapped[int] = mapped_column(
        ForeignKey("invoices.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    description: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    quantity: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )

    line_total: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )

    invoice: Mapped["Invoice"] = relationship(
        back_populates="line_items",
    )
