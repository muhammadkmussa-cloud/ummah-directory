from __future__ import annotations

import uuid

from sqlalchemy import Boolean, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin
from app.models.organization import Organization


class EducationalInstitution(Organization):
    __tablename__ = "educational_institutions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True
    )

    institution_type: Mapped[str] = mapped_column(String(50), nullable=False)
    curriculum: Mapped[str | None] = mapped_column(String(100))
    has_girls_section: Mapped[bool] = mapped_column(Boolean, default=False)
    has_boarding: Mapped[bool] = mapped_column(Boolean, default=False)
    has_quran_program: Mapped[bool] = mapped_column(Boolean, default=False)
    facilities: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    programs: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    __mapper_args__ = {
        "polymorphic_identity": "educational_institution",
    }
