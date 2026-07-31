"""add organization_follows table

Revision ID: f01a2b3c4d5e
Revises: 3a6e3d5e2d1f
Create Date: 2026-08-01 00:00:00.000000

Introduces the Follow workflow (workflows.md #23): users follow organizations so
that their posts surface in the Home Feed and the org's follower count can be shown.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f01a2b3c4d5e"
down_revision: Union[str, None] = "3a6e3d5e2d1f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "organization_follows",
        sa.Column("follower_id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["follower_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("follower_id", "organization_id", name="uq_follow_follower_org"),
    )
    op.create_index("ix_organization_follows_follower_id", "organization_follows", ["follower_id"])
    op.create_index("ix_organization_follows_organization_id", "organization_follows", ["organization_id"])


def downgrade() -> None:
    op.drop_index("ix_organization_follows_organization_id", table_name="organization_follows")
    op.drop_index("ix_organization_follows_follower_id", table_name="organization_follows")
    op.drop_table("organization_follows")
