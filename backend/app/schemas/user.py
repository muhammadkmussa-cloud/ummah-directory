from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, field_validator

from app.schemas.common import PASSWORD_REQUIREMENTS, validate_password_strength


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str | None = None
    profile_photo_url: str | None = None
    cover_photo_url: str | None = None
    bio: str | None = None
    city: str | None = None
    country: str | None = None
    preferred_language: str = "en"
    is_email_verified: bool = False
    role: str = "registered_user"
    permissions: list[str] = []
    created_at: datetime | None = None


class UserUpdateRequest(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    email: str | None = None
    preferred_language: str | None = None
    profile_photo_url: str | None = None
    cover_photo_url: str | None = None
    bio: str | None = None
    city: str | None = None
    country: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return validate_password_strength(v)
