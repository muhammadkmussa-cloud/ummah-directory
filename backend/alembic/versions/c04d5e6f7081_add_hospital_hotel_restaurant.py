"""add hospital, hotel, restaurant organization subtypes

Revision ID: c04d5e6f7081
Revises: b03c4d5e6f70
Create Date: 2026-08-01 00:03:00.000000

Adds three new polymorphic Organization subtypes (workflows.md #15/#16):
hospitals, hotels, restaurants. They join onto the organizations table.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c04d5e6f7081"
down_revision: Union[str, None] = "b03c4d5e6f70"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "hospitals",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("departments", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("services_offered", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("emergency_contacts", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("operating_hours", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("has_emergency_room", sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(["id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "hotels",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("rooms", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("facilities", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("star_rating", sa.Integer(), nullable=True),
        sa.Column("operating_hours", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "restaurants",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("menu", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("cuisine_type", sa.String(length=255), nullable=True),
        sa.Column("facilities", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("operating_hours", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("is_halal_certified", sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(["id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("restaurants")
    op.drop_table("hotels")
    op.drop_table("hospitals")
