"""add void audit fields and payment reversed_by

Revision ID: a7c3e91d4b20
Revises: 9d8d7d4a31b2
Create Date: 2026-10-24 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a7c3e91d4b20"
down_revision: Union[str, Sequence[str], None] = "9d8d7d4a31b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Record who voided an invoice, when and why, and who reversed a payment."""
    op.add_column(
        "invoices",
        sa.Column("voided_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "invoices",
        sa.Column("voided_by_user_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "invoices",
        sa.Column("void_reason", sa.String(length=250), nullable=True),
    )
    op.create_foreign_key(
        "fk_invoices_voided_by_user_id_users",
        "invoices",
        "users",
        ["voided_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.add_column(
        "payments",
        sa.Column("reversed_by_user_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_payments_reversed_by_user_id_users",
        "payments",
        "users",
        ["reversed_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    """Remove the audit fields."""
    op.drop_constraint(
        "fk_payments_reversed_by_user_id_users", "payments", type_="foreignkey"
    )
    op.drop_column("payments", "reversed_by_user_id")
    op.drop_constraint(
        "fk_invoices_voided_by_user_id_users", "invoices", type_="foreignkey"
    )
    op.drop_column("invoices", "void_reason")
    op.drop_column("invoices", "voided_by_user_id")
    op.drop_column("invoices", "voided_at")
