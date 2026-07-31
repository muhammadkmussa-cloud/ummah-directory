from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# --- Organization Schemas ---


class OrganizationBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: str | None = None
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=20)
    website: str | None = Field(None, max_length=255)
    address: str | None = None
    city: str | None = Field(None, max_length=100)
    country: str = Field("Kenya", max_length=100)
    latitude: float | None = None
    longitude: float | None = None
    logo_url: str | None = Field(None, max_length=512)
    cover_image_url: str | None = Field(None, max_length=512)


class OrganizationCreate(OrganizationBase):
    organization_type: str = Field(..., max_length=50)


class OrganizationUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    description: str | None = None
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=20)
    website: str | None = Field(None, max_length=255)
    address: str | None = None
    city: str | None = Field(None, max_length=100)
    country: str | None = Field(None, max_length=100)
    latitude: float | None = None
    longitude: float | None = None
    logo_url: str | None = Field(None, max_length=512)
    cover_image_url: str | None = Field(None, max_length=512)


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
