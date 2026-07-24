from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class EventCreate(BaseModel):
    title: str
    description: str | None = None
    event_date: datetime
    event_time: str | None = None
    venue: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    registration_link: str | None = None
    category: str | None = None
    organizer_type: str | None = None
    organizer_id: str | None = None


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    event_date: datetime | None = None
    event_time: str | None = None
    venue: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    registration_link: str | None = None
    category: str | None = None
    status: str | None = None


class EventResponse(BaseModel):
    id: str
    title: str
    slug: str
    description: str | None = None
    event_date: datetime
    event_time: str | None = None
    venue: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    registration_link: str | None = None
    cover_image_url: str | None = None
    category: str | None = None
    status: str = "published"
    registration_count: int = 0
    organizer_type: str | None = None
    created_at: datetime | None = None


class SavedEventResponse(BaseModel):
    id: str
    event_id: str
    event_title: str
    event_slug: str
    event_date: datetime
    event_time: str | None = None
    venue: str | None = None
    cover_image_url: str | None = None
    category: str | None = None
    created_at: datetime | None = None
