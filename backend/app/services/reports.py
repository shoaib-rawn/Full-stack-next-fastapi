from decimal import Decimal

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.models.invoice import Invoice
from app.schemas.report import CurrencyTotals, DashboardSummaryResponse


async def build_dashboard_summary(
    session: AsyncSession,
    organization_id: int,
) -> DashboardSummaryResponse:
    """Build tenant-scoped counts and currency-safe accounting totals."""
    total_customers = await session.scalar(
        select(func.count(Customer.id)).where(
            Customer.organization_id == organization_id,
        )
    )

    counts = (
        await session.execute(
            select(
                func.count(Invoice.id).label("total"),
                func.count(Invoice.id)
                .filter(Invoice.status == "issued")
                .label("issued"),
                func.count(Invoice.id)
                .filter(Invoice.status == "partially_paid")
                .label("partially_paid"),
                func.count(Invoice.id)
                .filter(Invoice.status == "paid")
                .label("paid"),
                func.count(Invoice.id)
                .filter(Invoice.status == "void")
                .label("void"),
            ).where(Invoice.organization_id == organization_id)
        )
    ).one()

    # A PKR amount cannot safely be added to a USD amount. Group money by
    # currency, and exclude void invoices from invoiced revenue.
    currency_rows = (
        await session.execute(
            select(
                Invoice.currency,
                func.coalesce(
                    func.sum(
                        case(
                            (Invoice.status != "void", Invoice.total),
                            else_=Decimal("0.00"),
                        )
                    ),
                    Decimal("0.00"),
                ).label("total_invoiced"),
                func.coalesce(func.sum(Invoice.amount_paid), Decimal("0.00")).label(
                    "total_paid"
                ),
                func.coalesce(func.sum(Invoice.balance_due), Decimal("0.00")).label(
                    "total_outstanding"
                ),
            )
            .where(Invoice.organization_id == organization_id)
            .group_by(Invoice.currency)
            .order_by(Invoice.currency)
        )
    ).all()

    return DashboardSummaryResponse(
        total_customers=total_customers or 0,
        total_invoices=counts.total or 0,
        issued_invoices=counts.issued or 0,
        partially_paid_invoices=counts.partially_paid or 0,
        paid_invoices=counts.paid or 0,
        void_invoices=counts.void or 0,
        currency_totals=[
            CurrencyTotals(
                currency=row.currency,
                total_invoiced=row.total_invoiced,
                total_paid=row.total_paid,
                total_outstanding=row.total_outstanding,
            )
            for row in currency_rows
        ],
    )
