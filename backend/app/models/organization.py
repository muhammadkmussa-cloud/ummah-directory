from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin


class Organization(BaseModelMixin):
    __tablename__ = "organizations"

    organization_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(20))
    website: Mapped[str | None] = mapped_column(String(255))
    address: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(100))
    country: Mapped[str] = mapped_column(String(100), default="Kenya")
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    
    logo_url: Mapped[str | None] = mapped_column(String(512))
    cover_image_url: Mapped[str | None] = mapped_column(String(512))
    
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, approved, rejected, suspended
    
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    avg_rating: Mapped[float] = mapped_column(Float, default=0.0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    
    __mapper_args__ = {
        "polymorphic_on": "organization_type",
        "polymorphic_identity": "organization",
    }
    
    owner: Mapped["User"] = relationship("User", foreign_keys=[owner_id])
    managers: Mapped[list["OrganizationManager"]] = relationship("OrganizationManager", back_populates="organization", cascade="all, delete-orphan")
    invitations: Mapped[list["OrganizationInvitation"]] = relationship("OrganizationInvitation", back_populates="organization", cascade="all, delete-orphan")

    # Generic relationships (moved from business/mosque/charity)
    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="organization", cascade="all, delete-orphan")
    media: Mapped[list["MediaFile"]] = relationship("MediaFile", back_populates="organization", cascade="all, delete-orphan")
    events: Mapped[list["Event"]] = relationship("Event", back_populates="organization", cascade="all, delete-orphan")
    favorites: Mapped[list["Favorite"]] = relationship("Favorite", back_populates="organization", cascade="all, delete-orphan")
    claims: Mapped[list["OwnershipClaim"]] = relationship("OwnershipClaim", back_populates="organization", cascade="all, delete-orphan")


class OrganizationManager(BaseModelMixin):
    __tablename__ = "organization_managers"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(50), default="manager")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    __table_args__ = (
        UniqueConstraint("organization_id", name="uq_organization_single_manager"),
    )

    organization: Mapped[Organization] = relationship("Organization", back_populates="managers")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])


class OrganizationInvitation(BaseModelMixin):
    __tablename__ = "organization_invitations"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(50), default="manager")
    token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending") # pending, accepted, expired
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    invited_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    organization: Mapped[Organization] = relationship("Organization", back_populates="invitations")
    invited_by: Mapped["User"] = relationship("User", foreign_keys=[invited_by_id])

