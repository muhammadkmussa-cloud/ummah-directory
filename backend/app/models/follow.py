from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User


class OrganizationFollow(BaseModelMixin):
    """A user following an organization (distinct from a favorite/save).

    Following drives the Home Feed (posts from followed organizations) and the
    org's follower count.
    """

    __tablename__ = "organization_follows"

    __table_args__ = (
        UniqueConstraint("follower_id", "organization_id", name="uq_follow_follower_org"),
    )

    follower_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    follower: Mapped[User] = relationship(
        "User", back_populates="following", foreign_keys=[follower_id]
    )
    organization: Mapped[Organization] = relationship("Organization", back_populates="followers")
