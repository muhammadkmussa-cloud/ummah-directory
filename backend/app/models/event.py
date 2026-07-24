from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin
from app.models.organization import Organization


class Event(BaseModelMixin):
    __tablename__ = "events"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    event_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    event_time: Mapped[str | None] = mapped_column(String(20))
    venue: Mapped[str | None] = mapped_column(String(255))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    registration_link: Mapped[str | None] = mapped_column(String(512))
    cover_image_url: Mapped[str | None] = mapped_column(String(512))
    category: Mapped[str | None] = mapped_column(String(100))
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="published")
    registration_count: Mapped[int] = mapped_column(Integer, default=0)

    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True
    )
    
    organizer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    organization: Mapped[Organization | None] = relationship("Organization", back_populates="events")
    saved_by: Mapped[list["SavedEvent"]] = relationship("SavedEvent", back_populates="event", cascade="all, delete-orphan")


class SavedEvent(BaseModelMixin):
    __tablename__ = "saved_events"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="saved_events")
    event: Mapped[Event] = relationship("Event", back_populates="saved_by")

