"""add appeals table

Revision ID: a02b3c4d5e6f
Revises: f01a2b3c4d5e
Create Date: 2026-08-01 00:01:00.000000

Introduces the Appeals workflow (workflows.md #28/#29/#30): a suspended user or
organization owner can appeal, and a moderator reviews/approves/rejects/escalates.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a02b3c4d5e6f"
down_revision: Union[str, None] = "f01a2b3c4d5e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "appeals",
        sa.Column("target_type", sa.String(length=20), nullable=False),
        sa.Column("target_id", sa.UUID(), nullable=False),
        sa.Column("submitted_by_id", sa.UUID(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("moderator_id", sa.UUID(), nullable=True),
        sa.Column("moderator_notes", sa.Text(), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["submitted_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["moderator_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_appeals_target_id", "appeals", ["target_id"])
    op.create_index("ix_appeals_submitted_by_id", "appeals", ["submitted_by_id"])
    op.create_index("ix_appeals_status", "appeals", ["status"])


def downgrade() -> None:
    op.drop_index("ix_appeals_status", table_name="appeals")
    op.drop_index("ix_appeals_submitted_by_id", table_name="appeals")
    op.drop_index("ix_appeals_target_id", table_name="appeals")
    op.drop_table("appeals")
