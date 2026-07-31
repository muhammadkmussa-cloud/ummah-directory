from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin
from app.models.organization import Organization

if TYPE_CHECKING:
    from app.models.donation import Donation


class Charity(Organization):
    __tablename__ = "charities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True
    )

    registration_number: Mapped[str | None] = mapped_column(String(100))
    mission_statement: Mapped[str | None] = mapped_column(Text)
    bank_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    __mapper_args__ = {
        "polymorphic_identity": "charity",
    }

    campaigns: Mapped[list[CharityCampaign]] = relationship(
        "CharityCampaign", back_populates="charity", cascade="all, delete-orphan"
    )
    donations: Mapped[list[Donation]] = relationship(
        "Donation", back_populates="organization", cascade="all, delete-orphan"
    )


class CharityCampaign(BaseModelMixin):
    __tablename__ = "charity_campaigns"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    target_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    amount_raised: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    currency: Mapped[str] = mapped_column(String(3), default="KES")
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20), default="active")
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    images: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    videos: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    beneficiary_info: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(100))
    charity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("charities.id", ondelete="CASCADE"), nullable=False
    )

    charity: Mapped[Charity] = relationship("Charity", back_populates="campaigns")
    donations: Mapped[list[Donation]] = relationship("Donation", back_populates="campaign")


class CharityReport(BaseModelMixin):
    __tablename__ = "charity_reports"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    report_type: Mapped[str] = mapped_column(String(50), default="financial")
    file_url: Mapped[str] = mapped_column(String(512), nullable=False)
    period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_published: Mapped[bool] = mapped_column(default=True)

    charity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("charities.id", ondelete="CASCADE"), nullable=False
    )

    charity: Mapped[Charity] = relationship("Charity")
