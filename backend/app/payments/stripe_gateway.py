import asyncio
from decimal import Decimal

import stripe

from app.core.config import settings
from app.core.retry import retry_async
from app.payments.base import PaymentEvent, PaymentGateway, PaymentIntent

stripe.api_key = settings.stripe_secret_key


class StripeGateway(PaymentGateway):
    async def create_payment(
        self, amount: Decimal, currency: str, metadata: dict | None = None
    ) -> PaymentIntent:
        intent = await retry_async(
            lambda: asyncio.to_thread(
                stripe.PaymentIntent.create,
                amount=int(amount * 100),
                currency=currency.lower(),
                metadata=metadata or {},
            ),
            max_attempts=3,
            base_delay=1.0,
            exceptions=(stripe.error.StripeError,),
        )
        return PaymentIntent(
            id=intent.id,
            gateway_payment_id=intent.id,
            client_secret=intent.client_secret,
            status=intent.status,
        )

    async def verify_webhook(self, payload: bytes, headers: dict) -> PaymentEvent | None:
        sig_header = headers.get("stripe-signature", "")
        try:
            event = await asyncio.to_thread(
                stripe.Webhook.construct_event,
                payload, sig_header, settings.stripe_webhook_secret,
            )
            if event["type"] == "payment_intent.succeeded":
                pi = event["data"]["object"]
                return PaymentEvent(
                    event_id=event["id"],
                    type="payment.succeeded",
                    gateway_payment_id=pi["id"],
                    status="succeeded",
                    amount=Decimal(str(pi["amount"])) / 100,
                    currency=pi["currency"],
                    metadata=pi.get("metadata"),
                )
            elif event["type"] == "payment_intent.payment_failed":
                pi = event["data"]["object"]
                return PaymentEvent(
                    event_id=event["id"],
                    type="payment.failed",
                    gateway_payment_id=pi["id"],
                    status="failed",
                    amount=Decimal(str(pi["amount"])) / 100,
                    currency=pi["currency"],
                )
        except ValueError:
            return None
        return None

    async def refund(self, payment_id: str, amount: Decimal | None = None) -> bool:
        try:
            kwargs: dict[str, str | int] = {"payment_intent": payment_id}
            if amount:
                kwargs["amount"] = int(amount * 100)
            await retry_async(
                lambda: asyncio.to_thread(stripe.Refund.create, **kwargs),  # type: ignore[arg-type]
                max_attempts=3,
                base_delay=1.0,
                exceptions=(stripe.error.StripeError,),
            )
            return True
        except stripe.error.StripeError:
            return False

    async def get_status(self, payment_id: str) -> str:
        try:
            pi = await retry_async(
                lambda: asyncio.to_thread(stripe.PaymentIntent.retrieve, payment_id),
                max_attempts=3,
                base_delay=1.0,
                exceptions=(stripe.error.StripeError,),
            )
            return pi.status
        except stripe.error.StripeError:
            return "unknown"
