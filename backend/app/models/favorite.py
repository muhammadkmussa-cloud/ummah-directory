from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from typing import TYPE_CHECKING

from app.models.base import BaseModelMixin
from app.models.organization import Organization

if TYPE_CHECKING:
    from app.models.user import User


class FavoriteCollection(BaseModelMixin):
    __tablename__ = "favorite_collections"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    user: Mapped["User"] = relationship("User", back_populates="favorite_collections")
    favorites: Mapped[list["Favorite"]] = relationship("Favorite", back_populates="collection")

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_user_collection_name"),
    )


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
    collection_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("favorite_collections.id", ondelete="SET NULL"), nullable=True, index=True
    )

    user: Mapped["User"] = relationship("User", back_populates="favorites")
    organization: Mapped[Organization] = relationship("Organization", back_populates="favorites")
    collection: Mapped[FavoriteCollection | None] = relationship("FavoriteCollection", back_populates="favorites")
