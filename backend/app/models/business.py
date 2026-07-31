from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin
from app.models.organization import Organization

if TYPE_CHECKING:
    from app.models.user import User


class Category(BaseModelMixin):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    name_ar: Mapped[str | None] = mapped_column(String(100))
    name_sw: Mapped[str | None] = mapped_column(String(100))
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    icon: Mapped[str | None] = mapped_column(String(255))
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    parent: Mapped[Category | None] = relationship(
        "Category", remote_side="Category.id", back_populates="children"
    )
    children: Mapped[list[Category]] = relationship("Category", back_populates="parent")
    businesses: Mapped[list[Business]] = relationship("Business", back_populates="category")


class Business(Organization):
    __tablename__ = "businesses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True
    )

    whatsapp: Mapped[str | None] = mapped_column(String(20))
    operating_hours: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    social_media: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_halal_certified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_premier: Mapped[bool] = mapped_column(Boolean, default=False)
    premier_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    pending_edit: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False
    )

    __mapper_args__ = {
        "polymorphic_identity": "business",
    }

    category: Mapped[Category] = relationship("Category", back_populates="businesses")
    branches: Mapped[list[BusinessBranch]] = relationship(
        "BusinessBranch", back_populates="business", cascade="all, delete-orphan"
    )


class BusinessBranch(BaseModelMixin):
    __tablename__ = "business_branches"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(Text)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    phone: Mapped[str | None] = mapped_column(String(20))
    operating_hours: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    manager_name: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False
    )

    business: Mapped[Business] = relationship("Business", back_populates="branches")


class OwnershipClaim(BaseModelMixin):
    __tablename__ = "ownership_claims"

    status: Mapped[str] = mapped_column(String(20), default="pending")
    documents: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    organization_type: Mapped[str] = mapped_column(String(50), nullable=False)
    claimant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    organization: Mapped[Organization] = relationship("Organization", back_populates="claims")
    claimant: Mapped[User] = relationship("User", foreign_keys=[claimant_id])
    reviewer: Mapped[User] = relationship("User", foreign_keys=[reviewed_by])
