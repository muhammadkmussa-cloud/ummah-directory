from typing import Any

from pydantic import BaseModel, Field


class PaymentIntentRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount to be paid")
    currency: str = Field(default="KES", description="Currency code (e.g., KES, USD)")
    gateway: str = Field(..., description="Payment gateway (e.g., mpesa, stripe)")
    reference_type: str | None = Field(
        None, description="Type of reference (e.g., donation, subscription, listing_fee)"
    )
    reference_id: str | None = Field(None, description="ID of the referenced entity")
    metadata: dict[str, Any] | None = Field(None, description="Additional metadata for the gateway")


class PaymentIntentResponse(BaseModel):
    payment_id: str
    gateway_payment_id: str | None = None
    client_secret: str | None = None
    approval_url: str | None = None
    status: str
