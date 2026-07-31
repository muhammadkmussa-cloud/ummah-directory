from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String, event
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from typing import TYPE_CHECKING

from app.models.base import BaseModelMixin

if TYPE_CHECKING:
    from app.models.user import User


class AuditLog(BaseModelMixin):
    __tablename__ = "audit_logs"

    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str | None] = mapped_column(String(50))
    resource_id: Mapped[str | None] = mapped_column(String(100))
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(50))
    user_agent: Mapped[str | None] = mapped_column(String(255))
    outcome: Mapped[str] = mapped_column(String(20), default="success")

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    user: Mapped[User | None] = relationship("User", back_populates="audit_logs")


@event.listens_for(AuditLog, "before_update")
def prevent_audit_log_update(mapper, connection, target):
    raise ValueError("AuditLog records are immutable and cannot be updated")


@event.listens_for(AuditLog, "before_delete")
def prevent_audit_log_delete(mapper, connection, target):
    raise ValueError("AuditLog records are immutable and cannot be deleted")
