from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin

if TYPE_CHECKING:
    from app.models.user import User


class PushSubscription(BaseModelMixin):
    """A browser/device push subscription (Web Push) for a user.

    Stores the Push API subscription info needed by pywebpush to deliver
    notifications (workflows.md #25 push channel).
    """

    __tablename__ = "push_subscriptions"

    __table_args__ = (UniqueConstraint("user_id", "endpoint", name="uq_push_user_endpoint"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    endpoint: Mapped[str] = mapped_column(Text, nullable=False)
    p256dh: Mapped[str] = mapped_column(Text, nullable=False)
    auth: Mapped[str] = mapped_column(Text, nullable=False)
    user_agent: Mapped[str | None] = mapped_column(String(255))

    user: Mapped[User] = relationship("User")
