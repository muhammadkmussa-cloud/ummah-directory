from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal


@dataclass
class PaymentIntent:
    id: str
    gateway_payment_id: str
    client_secret: str | None = None
    approval_url: str | None = None
    status: str = "pending"
    metadata: dict | None = None


@dataclass
class PaymentEvent:
    event_id: str
    type: str
    gateway_payment_id: str
    status: str
    amount: Decimal
    currency: str
    metadata: dict | None = None


class PaymentGateway(ABC):
    @abstractmethod
    async def create_payment(
        self, amount: Decimal, currency: str, metadata: dict | None = None
    ) -> PaymentIntent: ...

    @abstractmethod
    async def verify_webhook(self, payload: bytes, headers: dict) -> PaymentEvent | None: ...

    @abstractmethod
    async def refund(self, payment_id: str, amount: Decimal | None = None) -> bool: ...

    @abstractmethod
    async def get_status(self, payment_id: str) -> str: ...
