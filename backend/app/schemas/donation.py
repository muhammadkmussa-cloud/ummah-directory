from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class DonationInitiate(BaseModel):
    amount: Decimal = Field(gt=0)
    currency: str = "KES"
    campaign_id: str
    payment_gateway: str
    is_anonymous: bool = False
    idempotency_key: str | None = None


class DonationResponse(BaseModel):
    id: str
    amount: Decimal
    currency: str = "KES"
    status: str = "pending"
    receipt_number: str | None = None
    is_anonymous: bool = False
    charity_id: str
    charity_name: str | None = None
    campaign_id: str | None = None
    campaign_title: str | None = None
    created_at: datetime | None = None
