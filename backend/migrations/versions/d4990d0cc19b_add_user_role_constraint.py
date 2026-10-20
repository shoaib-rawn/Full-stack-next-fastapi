"""add user role constraint

Revision ID: d4990d0cc19b
Revises: f0fb74b766bf
Create Date: 2026-10-13 07:41:47.262648

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4990d0cc19b'
down_revision: Union[str, Sequence[str], None] = 'f0fb74b766bf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_check_constraint(
        "ck_users_role",
        "users",
        "role IN ('owner', 'member')",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        "ck_users_role",
        "users",
        type_="check",
    )
