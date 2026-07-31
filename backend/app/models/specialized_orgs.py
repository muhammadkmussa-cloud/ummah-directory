from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.organization import Organization


class Hospital(Organization):
    """Healthcare provider (workflows.md #15): departments, services,
    emergency contacts and operating hours."""

    __tablename__ = "hospitals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True
    )

    departments: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    services_offered: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    emergency_contacts: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    operating_hours: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    has_emergency_room: Mapped[bool] = mapped_column(Boolean, default=False)

    __mapper_args__ = {"polymorphic_identity": "hospital"}


class Hotel(Organization):
    """Lodging/hospitality (workflows.md #16): rooms, facilities, star rating."""

    __tablename__ = "hotels"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True
    )

    rooms: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    facilities: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    star_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    operating_hours: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    __mapper_args__ = {"polymorphic_identity": "hotel"}


class Restaurant(Organization):
    """Dining/hospitality (workflows.md #16): menu, cuisine, halal status, hours."""

    __tablename__ = "restaurants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True
    )

    menu: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    cuisine_type: Mapped[str | None] = mapped_column(String(255))
    facilities: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    operating_hours: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_halal_certified: Mapped[bool] = mapped_column(Boolean, default=False)

    __mapper_args__ = {"polymorphic_identity": "restaurant"}
