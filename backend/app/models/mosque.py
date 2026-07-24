from __future__ import annotations

import uuid

from sqlalchemy import Boolean, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin
from app.models.organization import Organization


class Mosque(Organization):
    __tablename__ = "mosques"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True
    )
    
    imam_name: Mapped[str | None] = mapped_column(String(255))
    has_women_facilities: Mapped[bool] = mapped_column(Boolean, default=False)
    has_parking: Mapped[bool] = mapped_column(Boolean, default=False)
    has_children_facilities: Mapped[bool] = mapped_column(Boolean, default=False)
    is_wheelchair_accessible: Mapped[bool] = mapped_column(Boolean, default=False)

    prayer_times: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    facilities: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    community_services: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    __mapper_args__ = {
        "polymorphic_identity": "mosque",
    }
