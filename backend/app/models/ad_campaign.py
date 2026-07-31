from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User


class AdCampaign(BaseModelMixin):
    __tablename__ = "ad_campaigns"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    campaign_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft", index=True)

    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True, index=True
    )
    advertiser_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    headline: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    cta_type: Mapped[str | None] = mapped_column(String(30))
    media_url: Mapped[str | None] = mapped_column(String(512))
    media_type: Mapped[str | None] = mapped_column(String(10))
    destination_url: Mapped[str | None] = mapped_column(String(512))

    placement_config: Mapped[dict | None] = mapped_column(JSONB)

    budget_type: Mapped[str] = mapped_column(String(10), nullable=False, default="total")
    budget_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    spent: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)

    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    target_country: Mapped[str | None] = mapped_column(String(100))
    target_city: Mapped[str | None] = mapped_column(String(100))
    target_categories: Mapped[dict | None] = mapped_column(JSONB)
    target_languages: Mapped[dict | None] = mapped_column(JSONB)
    target_radius_km: Mapped[float | None] = mapped_column(Float)
    target_latitude: Mapped[float | None] = mapped_column(Float)
    target_longitude: Mapped[float | None] = mapped_column(Float)

    impressions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    clicks: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejection_reason: Mapped[str | None] = mapped_column(Text)

    legacy_ad_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("advertisements.id"), nullable=True
    )

    advertiser: Mapped[User] = relationship("User", foreign_keys=[advertiser_id])
    reviewer: Mapped[User | None] = relationship("User", foreign_keys=[reviewed_by])
    organization: Mapped[Organization | None] = relationship("Organization")

    __table_args__ = (
        UniqueConstraint("organization_id", "campaign_type", name="uq_org_active_featured"),
        Index("ix_ad_campaigns_dates", "start_date", "end_date"),
    )
