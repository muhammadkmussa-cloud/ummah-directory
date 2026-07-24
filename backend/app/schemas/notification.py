from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str | None = None
    data: dict | None = None
    is_read: bool = False
    created_at: datetime | None = None


class NotificationPreferenceResponse(BaseModel):
    email_notifications: bool = True
    in_app_notifications: bool = True
    listing_updates: bool = True
    donation_updates: bool = True
    review_updates: bool = True
    promotional: bool = False
    security_alerts: bool = True


class NotificationPreferenceUpdate(BaseModel):
    email_notifications: bool | None = None
    in_app_notifications: bool | None = None
    listing_updates: bool | None = None
    donation_updates: bool | None = None
    review_updates: bool | None = None
    promotional: bool | None = None
    security_alerts: bool | None = None
