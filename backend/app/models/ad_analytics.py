from __future__ import annotations

import uuid
from decimal import Decimal
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from typing import TYPE_CHECKING

from app.models.base import BaseModelMixin

if TYPE_CHECKING:
    from app.models.ad_campaign import AdCampaign


class AdAnalytics(BaseModelMixin):
    __tablename__ = "ad_analytics"

    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ad_campaigns.id"), nullable=False, index=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)

    impressions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    clicks: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ctr: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    reach: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    calls: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    whatsapp_clicks: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    website_clicks: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    conversions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    spend: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)

    campaign: Mapped[AdCampaign] = relationship("AdCampaign", backref="analytics")

    __table_args__ = (
        UniqueConstraint("campaign_id", "date", name="uq_campaign_date"),
    )
