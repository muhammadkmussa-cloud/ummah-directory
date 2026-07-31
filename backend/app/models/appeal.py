from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin

if TYPE_CHECKING:
    from app.models.user import User


class Appeal(BaseModelMixin):
    """An appeal submitted against a suspension (workflows.md #28/#29/#30).

    A user appeals their own account suspension; an owner appeals the suspension
    of an organization they own. Moderators review, then approve (reactivating
    the target), reject, or escalate.
    """

    __tablename__ = "appeals"

    target_type: Mapped[str] = mapped_column(String(20), nullable=False)  # user, organization
    target_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    submitted_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )  # pending, approved, rejected, escalated
    moderator_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    moderator_notes: Mapped[str | None] = mapped_column(Text)

    submitted_by: Mapped[User] = relationship("User", foreign_keys=[submitted_by_id])
    moderator: Mapped[User | None] = relationship("User", foreign_keys=[moderator_id])
