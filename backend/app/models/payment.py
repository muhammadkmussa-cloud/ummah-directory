from __future__ import annotations

import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin

if TYPE_CHECKING:
    from app.models.donation import Donation
    from app.models.user import User


class PaymentProvider(BaseModelMixin):
    __tablename__ = "payment_providers"

    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    credentials: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True
    )  # Store API keys securely or use for settings


class Payment(BaseModelMixin):
    __tablename__ = "payments"

    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="KES")
    gateway: Mapped[str] = mapped_column(String(20), nullable=False)
    gateway_payment_id: Mapped[str | None] = mapped_column(String(255))
    gateway_order_id: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(20), default="pending")
    gateway_response: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text)
    is_refunded: Mapped[bool] = mapped_column(Boolean, default=False)
    refunded_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    idempotency_key: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # Generic reference mapping
    reference_type: Mapped[str | None] = mapped_column(String(50), index=True)
    reference_id: Mapped[str | None] = mapped_column(String(255), index=True)

    user: Mapped[User] = relationship("User")
    donation: Mapped[Donation | None] = relationship("Donation", back_populates="payment")
