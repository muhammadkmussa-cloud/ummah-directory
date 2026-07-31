"""add push notifications (preference + subscriptions)

Revision ID: b03c4d5e6f70
Revises: a02b3c4d5e6f
Create Date: 2026-08-01 00:02:00.000000

Adds the push delivery channel (workflows.md #25): a push_notifications
preference flag and a push_subscriptions table for Web Push (VAPID) endpoints.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b03c4d5e6f70"
down_revision: Union[str, None] = "a02b3c4d5e6f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "notification_preferences",
        sa.Column("push_notifications", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )

    op.create_table(
        "push_subscriptions",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("endpoint", sa.Text(), nullable=False),
        sa.Column("p256dh", sa.Text(), nullable=False),
        sa.Column("auth", sa.Text(), nullable=False),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "endpoint", name="uq_push_user_endpoint"),
    )
    op.create_index("ix_push_subscriptions_user_id", "push_subscriptions", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_push_subscriptions_user_id", table_name="push_subscriptions")
    op.drop_table("push_subscriptions")
    op.drop_column("notification_preferences", "push_notifications")
