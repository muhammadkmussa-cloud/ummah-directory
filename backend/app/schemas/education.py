from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class EducationCreate(BaseModel):
    name: str
    institution_type: str
    description: str | None = None
    curriculum: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    country: str = "Kenya"
    latitude: float | None = None
    longitude: float | None = None
    has_girls_section: bool = False
    has_boarding: bool = False
    has_quran_program: bool = False


class EducationUpdate(BaseModel):
    name: str | None = None
    institution_type: str | None = None
    description: str | None = None
    curriculum: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    has_girls_section: bool | None = None
    has_boarding: bool | None = None
    has_quran_program: bool | None = None


class EducationResponse(BaseModel):
    id: str
    name: str
    slug: str
    institution_type: str
    description: str | None = None
    curriculum: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    country: str = "Kenya"
    latitude: float | None = None
    longitude: float | None = None
    logo_url: str | None = None
    cover_image_url: str | None = None
    is_verified: bool = False
    has_girls_section: bool = False
    has_boarding: bool = False
    has_quran_program: bool = False
    status: str = "pending"
    created_at: datetime | None = None
