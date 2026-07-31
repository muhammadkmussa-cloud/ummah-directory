from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class CampaignCreate(BaseModel):
    name: str = Field(..., max_length=255)
    campaign_type: str = Field(..., pattern=r"^(featured_listing|feed_ad|category_spotlight)$")
    organization_id: str
    headline: str | None = Field(None, max_length=255)
    description: str | None = None
    cta_type: str | None = Field(
        None, pattern=r"^(visit_profile|call_now|whatsapp|book_now|donate|learn_more)$"
    )
    media_url: str | None = Field(None, max_length=512)
    destination_url: str | None = Field(None, max_length=512)
    budget_type: str = Field("total", pattern=r"^(daily|total)$")
    budget_amount: Decimal = Field(..., gt=0)
    start_date: datetime
    end_date: datetime
    target_country: str | None = Field(None, max_length=100)
    target_city: str | None = Field(None, max_length=100)
    target_categories: list[str] | None = None


class CampaignUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    headline: str | None = Field(None, max_length=255)
    description: str | None = None
    cta_type: str | None = Field(
        None, pattern=r"^(visit_profile|call_now|whatsapp|book_now|donate|learn_more)$"
    )
    media_url: str | None = Field(None, max_length=512)
    destination_url: str | None = Field(None, max_length=512)
    budget_type: str | None = Field(None, pattern=r"^(daily|total)$")
    budget_amount: Decimal | None = Field(None, gt=0)
    start_date: datetime | None = None
    end_date: datetime | None = None
    target_country: str | None = Field(None, max_length=100)
    target_city: str | None = Field(None, max_length=100)
    target_categories: list[str] | None = None


class CampaignResponse(BaseModel):
    id: str
    name: str
    campaign_type: str
    status: str
    organization_id: str | None = None
    organization_name: str | None = None
    organization_slug: str | None = None
    headline: str | None = None
    description: str | None = None
    cta_type: str | None = None
    media_url: str | None = None
    destination_url: str | None = None
    budget_type: str
    budget_amount: Decimal
    spent: Decimal = Decimal("0.00")
    start_date: datetime
    end_date: datetime
    target_country: str | None = None
    target_city: str | None = None
    target_categories: list[str] | None = None
    impressions: int = 0
    clicks: int = 0
    rejection_reason: str | None = None
    created_at: datetime | None = None


class CampaignListResponse(BaseModel):
    items: list[CampaignResponse]
    total: int


class CampaignSubmitResponse(BaseModel):
    message: str
    campaign_id: str
    status: str


class CampaignPayRequest(BaseModel):
    payment_gateway: str = Field(default="mpesa", pattern=r"^(stripe|paypal|mpesa)$")
    currency: str = "KES"


class AdFeedItem(BaseModel):
    id: str
    headline: str | None = None
    description: str | None = None
    cta_type: str | None = None
    media_url: str | None = None
    destination_url: str | None = None
    organization_id: str | None = None
    organization_name: str | None = None
    organization_slug: str | None = None


class AdFeedResponse(BaseModel):
    items: list[AdFeedItem]


class AdSpotlightResponse(BaseModel):
    id: str
    headline: str | None = None
    description: str | None = None
    cta_type: str | None = None
    media_url: str | None = None
    destination_url: str | None = None
    organization_id: str | None = None
    organization_name: str | None = None
    organization_slug: str | None = None
