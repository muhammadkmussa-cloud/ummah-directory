from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class PremierPurchase(BaseModel):
    amount: Decimal
    currency: str = "KES"
    payment_gateway: str


class PremierResponse(BaseModel):
    id: str
    amount: Decimal
    currency: str = "KES"
    status: str = "pending"
    start_date: datetime | None = None
    end_date: datetime | None = None
    auto_renew: bool = False
    business_id: str
    created_at: datetime | None = None
