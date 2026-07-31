from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import PaymentProvider
from app.payments import get_gateway
from app.payments.base import PaymentGateway


class PaymentService:
    @staticmethod
    async def get_configured_gateway(db: AsyncSession, name: str) -> PaymentGateway:
        result = await db.execute(
            select(PaymentProvider).where(
                PaymentProvider.name == name,
                PaymentProvider.is_active == True,  # noqa: E712
            )
        )
        provider = result.scalar_one_or_none()

        # We always fall back to the basic configured gateways even if DB lacks them,
        # but if we have DB credentials, we should pass them to the gateway.
        # For this prototype, we'll instantiate the gateway.
        # In a real app, we'd pass credentials into the constructor.

        gw = get_gateway(name)
        if provider and provider.credentials:
            # Optionally configure gw with provider.credentials here
            pass

        return gw
