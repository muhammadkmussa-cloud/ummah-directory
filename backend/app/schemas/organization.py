from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- Organization Schemas ---

class OrganizationBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    website: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    country: str = Field("Kenya", max_length=100)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    logo_url: Optional[str] = Field(None, max_length=512)
    cover_image_url: Optional[str] = Field(None, max_length=512)


class OrganizationCreate(OrganizationBase):
    organization_type: str = Field(..., max_length=50)


class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    website: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    logo_url: Optional[str] = Field(None, max_length=512)
    cover_image_url: Optional[str] = Field(None, max_length=512)


class OrganizationResponse(OrganizationBase):
    id: UUID
    organization_type: str
    slug: str
    is_verified: bool
    status: str
    view_count: int
    avg_rating: float
    review_count: int
    owner_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Organization Manager Schemas ---

class OrganizationManagerResponse(BaseModel):
    id: UUID
    organization_id: UUID
    user_id: UUID
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ManagerAssignRequest(BaseModel):
    email: EmailStr
