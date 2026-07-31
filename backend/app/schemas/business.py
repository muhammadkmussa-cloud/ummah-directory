from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, field_validator


class DayHours(BaseModel):
    open: str | None = None
    close: str | None = None
    is_closed: bool = False

    @field_validator("open", "close", mode="before")
    @classmethod
    def validate_time_format(cls, v: str | None) -> str | None:
        if v is not None:
            try:
                datetime.strptime(v, "%H:%M")
            except ValueError:
                raise ValueError("Time must be in HH:MM format") from None
        return v


class BusinessCreate(BaseModel):
    name: str
    description: str | None = None
    email: str | None = None
    phone: str | None = None
    whatsapp: str | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    country: str = "Kenya"
    latitude: float | None = None
    longitude: float | None = None
    category_id: str
    operating_hours: dict[str, DayHours] | None = None
    social_media: dict | None = None


class BusinessUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    email: str | None = None
    phone: str | None = None
    whatsapp: str | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    operating_hours: dict[str, DayHours] | None = None
    social_media: dict | None = None


class BusinessResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None = None
    email: str | None = None
    phone: str | None = None
    whatsapp: str | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    country: str = "Kenya"
    latitude: float | None = None
    longitude: float | None = None
    logo_url: str | None = None
    cover_image_url: str | None = None
    avg_rating: float = 0.0
    review_count: int = 0
    is_verified: bool = False
    is_premier: bool = False
    is_featured: bool = False
    status: str = "pending"
    category_id: str
    category_name: str | None = None
    created_at: datetime | None = None


class BranchCreate(BaseModel):
    name: str
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    phone: str | None = None
    operating_hours: dict | None = None
    manager_name: str | None = None


class BranchResponse(BaseModel):
    id: str
    name: str
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    phone: str | None = None
    operating_hours: dict | None = None
    manager_name: str | None = None
    is_active: bool = True


class CategoryResponse(BaseModel):
    id: str
    name: str
    name_ar: str | None = None
    name_sw: str | None = None
    slug: str
    description: str | None = None
    icon: str | None = None
    parent_id: str | None = None
    children: list[CategoryResponse] = []
