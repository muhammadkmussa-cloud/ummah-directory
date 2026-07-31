from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModelMixin

if TYPE_CHECKING:
    from app.models.user import User


class SavedPaymentMethod(BaseModelMixin):
    __tablename__ = "saved_payment_methods"

    gateway: Mapped[str] = mapped_column(String(20), nullable=False)
    gateway_payment_method_id: Mapped[str] = mapped_column(String(255), nullable=False)
    last_four: Mapped[str | None] = mapped_column(String(4))
    card_brand: Mapped[str | None] = mapped_column(String(20))
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[str | None] = mapped_column(String(7))

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    user: Mapped[User] = relationship("User", back_populates="saved_payment_methods")
