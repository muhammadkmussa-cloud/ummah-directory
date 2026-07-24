from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin


class Notification(BaseModelMixin):
    __tablename__ = "notifications"

    type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str | None] = mapped_column(Text)
    data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    delivery_channel: Mapped[str] = mapped_column(String(20), default="in_app")
    delivery_status: Mapped[str] = mapped_column(String(20), default="pending")

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    user: Mapped[User] = relationship("User", back_populates="notifications")


class NotificationPreference(BaseModelMixin):
    __tablename__ = "notification_preferences"

    email_notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    in_app_notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    listing_updates: Mapped[bool] = mapped_column(Boolean, default=True)
    donation_updates: Mapped[bool] = mapped_column(Boolean, default=True)
    review_updates: Mapped[bool] = mapped_column(Boolean, default=True)
    promotional: Mapped[bool] = mapped_column(Boolean, default=False)
    security_alerts: Mapped[bool] = mapped_column(Boolean, default=True)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )

    user: Mapped[User] = relationship("User")
