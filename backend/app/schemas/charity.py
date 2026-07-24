from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class CharityCreate(BaseModel):
    name: str
    registration_number: str | None = None
    description: str | None = None
    mission_statement: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    country: str = "Kenya"


class CharityUpdate(BaseModel):
    name: str | None = None
    registration_number: str | None = None
    description: str | None = None
    mission_statement: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None


class CharityResponse(BaseModel):
    id: str
    name: str
    slug: str
    registration_number: str | None = None
    description: str | None = None
    mission_statement: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    country: str = "Kenya"
    logo_url: str | None = None
    cover_image_url: str | None = None
    is_verified: bool = False
    status: str = "pending"
    created_at: datetime | None = None


class CampaignCreate(BaseModel):
    title: str
    description: str | None = None
    target_amount: float
    currency: str = "KES"
    deadline: datetime | None = None
    category: str | None = None
    beneficiary_info: str | None = None


class CampaignUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    target_amount: float | None = None
    currency: str | None = None
    deadline: datetime | None = None
    status: str | None = None
    category: str | None = None
    beneficiary_info: str | None = None


class CampaignResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    target_amount: str
    amount_raised: str = "0.00"
    currency: str = "KES"
    deadline: datetime | None = None
    status: str = "active"
    is_featured: bool = False
    category: str | None = None
    charity_id: str
    created_at: datetime | None = None
