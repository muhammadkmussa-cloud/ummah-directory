from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from typing import TYPE_CHECKING

from app.models.base import BaseModelMixin
from app.models.organization import Organization

if TYPE_CHECKING:
    from app.models.charity import CharityCampaign
    from app.models.payment import Payment
    from app.models.user import User


class Donation(BaseModelMixin):
    __tablename__ = "donations"

    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="KES")
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    receipt_number: Mapped[str | None] = mapped_column(String(100), unique=True)
    idempotency_key: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")

    donor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    # Changed from charity_id to organization_id since NGOs/Mosques might also take donations
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    campaign_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("charity_campaigns.id"), nullable=True
    )
    payment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("payments.id"), nullable=True
    )

    donor: Mapped["User"] = relationship("User", back_populates="donations")
    organization: Mapped[Organization] = relationship("Organization")
    campaign: Mapped["CharityCampaign"] = relationship("CharityCampaign", back_populates="donations")
    payment: Mapped["Payment"] = relationship("Payment", back_populates="donation")
