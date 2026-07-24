from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class MosqueCreate(BaseModel):
    name: str
    description: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    country: str = "Kenya"
    latitude: float | None = None
    longitude: float | None = None
    imam_name: str | None = None
    has_women_facilities: bool = False
    has_parking: bool = False
    has_children_facilities: bool = False
    is_wheelchair_accessible: bool = False
    prayer_times: dict | None = None
    facilities: dict | None = None


class MosqueUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    imam_name: str | None = None
    has_women_facilities: bool | None = None
    has_parking: bool | None = None
    has_children_facilities: bool | None = None
    is_wheelchair_accessible: bool | None = None
    prayer_times: dict | None = None
    facilities: dict | None = None


class MosqueResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    country: str = "Kenya"
    latitude: float | None = None
    longitude: float | None = None
    imam_name: str | None = None
    logo_url: str | None = None
    cover_image_url: str | None = None
    is_verified: bool = False
    has_women_facilities: bool = False
    has_parking: bool = False
    has_children_facilities: bool = False
    is_wheelchair_accessible: bool = False
    status: str = "pending"
    prayer_times: dict | None = None
    facilities: dict | None = None
    created_at: datetime | None = None

class MosquePrayerTimesUpdate(BaseModel):
    prayer_times: dict
