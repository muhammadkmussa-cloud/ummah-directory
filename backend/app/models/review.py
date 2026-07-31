from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from typing import TYPE_CHECKING

from app.models.base import BaseModelMixin
from app.models.organization import Organization

if TYPE_CHECKING:
    from app.models.user import User


class Review(BaseModelMixin):
    __tablename__ = "reviews"

    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="published")
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False)
    edit_count: Mapped[int] = mapped_column(Integer, default=0)
    last_edited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    image_urls: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True, default=list)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="reviews")
    organization: Mapped[Organization] = relationship("Organization", back_populates="reviews")
    reply: Mapped[ReviewReply | None] = relationship("ReviewReply", back_populates="review", uselist=False)


class ReviewReply(BaseModelMixin):
    __tablename__ = "review_replies"

    content: Mapped[str] = mapped_column(Text, nullable=False)
    review_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("reviews.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    review: Mapped[Review] = relationship("Review", back_populates="reply")
    user: Mapped["User"] = relationship("User")
