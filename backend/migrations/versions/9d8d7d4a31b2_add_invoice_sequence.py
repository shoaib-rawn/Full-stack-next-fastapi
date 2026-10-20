"""add organization invoice sequence

Revision ID: 9d8d7d4a31b2
Revises: 6651b7191c62
Create Date: 2026-10-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9d8d7d4a31b2"
down_revision: Union[str, Sequence[str], None] = "6651b7191c62"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "organizations",
        sa.Column(
            "next_invoice_sequence",
            sa.Integer(),
            server_default="1",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("organizations", "next_invoice_sequence")
