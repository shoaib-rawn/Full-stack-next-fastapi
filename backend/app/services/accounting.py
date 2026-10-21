from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

from app.core.limits import MONEY_MAX
from app.models.invoice import Invoice
from app.schemas.invoice import InvoiceLineItemCreate


MONEY_PLACES = Decimal("0.01")
HUNDRED = Decimal("100")


class AccountingError(ValueError):
    pass


@dataclass(frozen=True)
class CalculatedLineItem:
    description: str
    quantity: Decimal
    unit_price: Decimal
    line_total: Decimal


@dataclass(frozen=True)
class InvoiceCalculation:
    line_items: list[CalculatedLineItem]
    subtotal: Decimal
    tax_amount: Decimal
    total: Decimal


def money(value: Decimal) -> Decimal:
    return value.quantize(
        MONEY_PLACES,
        rounding=ROUND_HALF_UP,
    )


def calculate_invoice(
    line_items: list[InvoiceLineItemCreate],
    tax_rate: Decimal,
) -> InvoiceCalculation:
    calculated_items = [
        CalculatedLineItem(
            description=item.description,
            quantity=item.quantity,
            unit_price=money(item.unit_price),
            line_total=money(
                item.quantity * item.unit_price
            ),
        )
        for item in line_items
    ]

    subtotal = money(
        sum(
            (item.line_total for item in calculated_items),
            start=Decimal("0.00"),
        )
    )
    tax_amount = money(
        subtotal * tax_rate / HUNDRED
    )
    total = money(subtotal + tax_amount)

    # Each input fits its column, but products and sums can still exceed
    # Numeric(14, 2); reject before the database overflows.
    amounts = [item.line_total for item in calculated_items]
    if any(amount > MONEY_MAX for amount in [*amounts, subtotal, total]):
        raise AccountingError(
            f"Invoice amount is too large. The maximum is {MONEY_MAX}."
        )

    return InvoiceCalculation(
        line_items=calculated_items,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total=total,
    )


def apply_payment(
    invoice: Invoice,
    amount: Decimal,
) -> None:
    payment_amount = money(amount)

    if invoice.status == "void":
        raise AccountingError(
            "A void invoice cannot receive payments."
        )

    if invoice.status == "paid" or invoice.balance_due == Decimal("0.00"):
        raise AccountingError(
            "This invoice is already fully paid."
        )

    if payment_amount > invoice.balance_due:
        raise AccountingError(
            "Payment cannot exceed the invoice balance."
        )

    invoice.amount_paid = money(
        invoice.amount_paid + payment_amount
    )
    invoice.balance_due = money(
        invoice.total - invoice.amount_paid
    )
    invoice.status = (
        "paid"
        if invoice.balance_due == Decimal("0.00")
        else "partially_paid"
    )
