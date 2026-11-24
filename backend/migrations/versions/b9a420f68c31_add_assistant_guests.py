"""Add guest contact details and short-lived assistant sessions.

Revision ID: b9a420f68c31
Revises: a7c3e91d4b20
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b9a420f68c31"
down_revision: Union[str, Sequence[str], None] = "a7c3e91d4b20"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "assistant_guests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("full_name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("session_hash", sa.String(64), nullable=False),
        sa.Column("session_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_assistant_guests_session_hash", "assistant_guests", ["session_hash"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_assistant_guests_session_hash", table_name="assistant_guests")
    op.drop_table("assistant_guests")
