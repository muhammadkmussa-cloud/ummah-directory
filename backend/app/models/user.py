from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin

if TYPE_CHECKING:
    from app.models.audit import AuditLog
    from app.models.donation import Donation
    from app.models.event import SavedEvent
    from app.models.favorite import Favorite, FavoriteCollection
    from app.models.follow import OrganizationFollow
    from app.models.notification import Notification
    from app.models.organization import Organization, OrganizationManager
    from app.models.permission import Permission
    from app.models.report import Report
    from app.models.review import Review
    from app.models.saved_payment_method import SavedPaymentMethod


class Role(BaseModelMixin):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))

    users: Mapped[list[User]] = relationship("User", back_populates="role")
    permissions: Mapped[list[Permission]] = relationship(
        "Permission", secondary="role_permissions", back_populates="roles"
    )


class User(BaseModelMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    profile_photo_url: Mapped[str | None] = mapped_column(String(512))
    cover_photo_url: Mapped[str | None] = mapped_column(String(512))
    bio: Mapped[str | None] = mapped_column(String(1000))
    city: Mapped[str | None] = mapped_column(String(100))
    country: Mapped[str | None] = mapped_column(String(100))
    preferred_language: Mapped[str] = mapped_column(String(10), default="en")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_phone_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    prayer_time_settings: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False
    )

    role: Mapped[Role] = relationship("Role", back_populates="users")

    # Organization relations
    owned_organizations: Mapped[list[Organization]] = relationship(
        "Organization", back_populates="owner", foreign_keys="Organization.owner_id"
    )
    managed_organizations: Mapped[list[OrganizationManager]] = relationship(
        "OrganizationManager", back_populates="user"
    )

    reviews: Mapped[list[Review]] = relationship(
        "Review", back_populates="user", foreign_keys="Review.user_id"
    )
    favorites: Mapped[list[Favorite]] = relationship("Favorite", back_populates="user")
    following: Mapped[list[OrganizationFollow]] = relationship(
        "OrganizationFollow",
        back_populates="follower",
        foreign_keys="OrganizationFollow.follower_id",
        cascade="all, delete-orphan",
    )
    favorite_collections: Mapped[list[FavoriteCollection]] = relationship(
        "FavoriteCollection", back_populates="user", cascade="all, delete-orphan"
    )
    saved_payment_methods: Mapped[list[SavedPaymentMethod]] = relationship(
        "SavedPaymentMethod", back_populates="user", cascade="all, delete-orphan"
    )
    donations: Mapped[list[Donation]] = relationship("Donation", back_populates="donor")
    notifications: Mapped[list[Notification]] = relationship("Notification", back_populates="user")
    audit_logs: Mapped[list[AuditLog]] = relationship("AuditLog", back_populates="user")
    reports: Mapped[list[Report]] = relationship(
        "Report", back_populates="user", foreign_keys="Report.user_id"
    )
    saved_events: Mapped[list[SavedEvent]] = relationship(
        "SavedEvent", back_populates="user", cascade="all, delete-orphan"
    )
