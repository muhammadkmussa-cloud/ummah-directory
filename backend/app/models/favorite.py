from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin
from app.models.organization import Organization


class Favorite(BaseModelMixin):
    __tablename__ = "favorites"

    __table_args__ = (
        UniqueConstraint("user_id", "organization_id", name="uq_favorites_user_org"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    user: Mapped["User"] = relationship("User", back_populates="favorites")
    organization: Mapped[Organization] = relationship("Organization", back_populates="favorites")
