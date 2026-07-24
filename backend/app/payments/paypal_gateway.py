import json
from decimal import Decimal

import httpx

from app.core.config import settings
from app.core.retry import with_retry
from app.payments.base import PaymentEvent, PaymentGateway, PaymentIntent

PAYPAL_API = "https://api-m.sandbox.paypal.com" if settings.paypal_mode == "sandbox" else "https://api-m.paypal.com"

RETRY_EXCEPTIONS = (httpx.RequestError, httpx.TimeoutException, httpx.HTTPStatusError)


class PayPalGateway(PaymentGateway):
    @with_retry(max_attempts=3, base_delay=1.0, exceptions=RETRY_EXCEPTIONS)
    async def _get_access_token(self) -> str:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{PAYPAL_API}/v1/oauth2/token",
                auth=(settings.paypal_client_id, settings.paypal_client_secret),
                data={"grant_type": "client_credentials"},
            )
            data = resp.json()
            return data["access_token"]

    @with_retry(max_attempts=3, base_delay=1.0, exceptions=RETRY_EXCEPTIONS)
    async def create_payment(
        self, amount: Decimal, currency: str, metadata: dict | None = None
    ) -> PaymentIntent:
        token = await self._get_access_token()
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{PAYPAL_API}/v2/checkout/orders",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={
                    "intent": "CAPTURE",
                    "purchase_units": [{
                        "amount": {
                            "currency_code": currency.upper(),
                            "value": str(amount),
                        },
                        "description": metadata.get("description", "") if metadata else "",
                    }],
                },
            )
            data = resp.json()
            approval_url = next(
                (link["href"] for link in data.get("links", []) if link["rel"] == "approve"),
                None,
            )
            return PaymentIntent(
                id=data["id"],
                gateway_payment_id=data["id"],
                approval_url=approval_url,
                status=data["status"],
            )

    async def verify_webhook(self, payload: bytes, headers: dict) -> PaymentEvent | None:
        token = await self._get_access_token()
        verification = await self._verify_signature(payload, headers, token)
        if not verification:
            return None
        data = json.loads(payload)
        event_type = data.get("event_type", "")
        resource = data.get("resource", {})

        if event_type == "PAYMENT.CAPTURE.COMPLETED":
            return PaymentEvent(
                event_id=data.get("id", ""),
                type="payment.succeeded",
                gateway_payment_id=resource.get("id", ""),
                status="succeeded",
                amount=Decimal(str(resource.get("amount", {}).get("value", 0))),
                currency=resource.get("amount", {}).get("currency_code", "USD"),
            )
        elif event_type == "PAYMENT.CAPTURE.DENIED":
            return PaymentEvent(
                event_id=data.get("id", ""),
                type="payment.failed",
                gateway_payment_id=resource.get("id", ""),
                status="failed",
                amount=Decimal("0"),
                currency="USD",
            )
        return None

    @with_retry(max_attempts=3, base_delay=1.0, exceptions=RETRY_EXCEPTIONS)
    async def capture_order(self, order_id: str) -> bool:
        token = await self._get_access_token()
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{PAYPAL_API}/v2/checkout/orders/{order_id}/capture",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            )
            return resp.is_success

    @with_retry(max_attempts=3, base_delay=1.0, exceptions=RETRY_EXCEPTIONS)
    async def _verify_signature(self, payload: bytes, headers: dict, token: str) -> bool:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{PAYPAL_API}/v1/notifications/verify-webhook-signature",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json={
                    "auth_algo": headers.get("PAYPAL-AUTH-ALGO", ""),
                    "cert_url": headers.get("PAYPAL-CERT-URL", ""),
                    "transmission_id": headers.get("PAYPAL-TRANSMISSION-ID", ""),
                    "transmission_sig": headers.get("PAYPAL-TRANSMISSION-SIG", ""),
                    "transmission_time": headers.get("PAYPAL-TRANSMISSION-TIME", ""),
                    "webhook_id": settings.paypal_webhook_id,
                    "webhook_event": json.loads(payload),
                },
            )
            result = resp.json()
            return result.get("verification_status") == "SUCCESS"

    async def refund(self, payment_id: str, amount: Decimal | None = None) -> bool:
        token = await self._get_access_token()
        async with httpx.AsyncClient() as client:
            data = {}
            if amount:
                data["amount"] = {"value": str(amount), "currency_code": "USD"}
            resp = await client.post(
                f"{PAYPAL_API}/v2/payments/captures/{payment_id}/refund",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=data,
            )
            return resp.is_success

    async def get_status(self, payment_id: str) -> str:
        token = await self._get_access_token()
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{PAYPAL_API}/v2/checkout/orders/{payment_id}",
                headers={"Authorization": f"Bearer {token}"},
            )
            data = resp.json()
            return data.get("status", "unknown")
