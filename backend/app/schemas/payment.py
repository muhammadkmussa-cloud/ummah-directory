from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class PaymentIntentRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount to be paid")
    currency: str = Field(default="KES", description="Currency code (e.g., KES, USD)")
    gateway: str = Field(..., description="Payment gateway (e.g., mpesa, stripe)")
    reference_type: Optional[str] = Field(None, description="Type of reference (e.g., donation, subscription, listing_fee)")
    reference_id: Optional[str] = Field(None, description="ID of the referenced entity")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata for the gateway")

class PaymentIntentResponse(BaseModel):
    payment_id: str
    gateway_payment_id: Optional[str] = None
    client_secret: Optional[str] = None
    approval_url: Optional[str] = None
    status: str
