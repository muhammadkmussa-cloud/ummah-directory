import base64
import json
from datetime import datetime
from decimal import Decimal

import httpx

from app.core.config import settings
from app.core.retry import with_retry
from app.payments.base import PaymentEvent, PaymentGateway, PaymentIntent

MPESA_API = "https://sandbox.safaricom.co.ke" if settings.mpesa_environment == "sandbox" else "https://api.safaricom.co.ke"

RETRY_EXCEPTIONS = (httpx.RequestError, httpx.TimeoutException)


class MpesaGateway(PaymentGateway):
    @with_retry(max_attempts=3, base_delay=1.0, exceptions=RETRY_EXCEPTIONS)
    async def _get_access_token(self) -> str:
        credentials = f"{settings.mpesa_consumer_key}:{settings.mpesa_consumer_secret}"
        encoded = base64.b64encode(credentials.encode()).decode()
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{MPESA_API}/oauth/v1/generate?grant_type=client_credentials",
                headers={"Authorization": f"Basic {encoded}"},
            )
            data = resp.json()
            return data["access_token"]

    async def stk_push(
        self, phone: str, amount: Decimal, account_ref: str, transaction_desc: str = "Payment"
    ) -> PaymentIntent:
        token = await self._get_access_token()
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        password_str = f"{settings.mpesa_business_shortcode}{settings.mpesa_passkey}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode()

        payload = {
            "BusinessShortCode": settings.mpesa_business_shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone,
            "PartyB": settings.mpesa_business_shortcode,
            "PhoneNumber": phone,
            "CallBackURL": settings.mpesa_callback_url,
            "AccountReference": account_ref[:12],
            "TransactionDesc": transaction_desc[:13],
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{MPESA_API}/mpesa/stkpush/v1/processrequest",
                json=payload,
                headers={"Authorization": f"Bearer {token}"},
            )
            data = resp.json()

            return PaymentIntent(
                id=data.get("CheckoutRequestID", ""),
                gateway_payment_id=data.get("CheckoutRequestID", ""),
                status="pending",
                metadata={
                    "merchant_request_id": data.get("MerchantRequestID", ""),
                    "response_code": data.get("ResponseCode", ""),
                    "response_description": data.get("ResponseDescription", ""),
                },
            )

    async def query_status(self, checkout_request_id: str) -> dict:
        token = await self._get_access_token()
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        password_str = f"{settings.mpesa_business_shortcode}{settings.mpesa_passkey}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode()

        payload = {
            "BusinessShortCode": settings.mpesa_business_shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "CheckoutRequestID": checkout_request_id,
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{MPESA_API}/mpesa/stkpushquery/v1/query",
                json=payload,
                headers={"Authorization": f"Bearer {token}"},
            )
            return resp.json()

    async def create_payment(
        self, amount: Decimal, currency: str, metadata: dict | None = None
    ) -> PaymentIntent:
        phone = (metadata or {}).get("phone", "")
        account_ref = (metadata or {}).get("account_ref", "UMMA")
        return await self.stk_push(phone, amount, account_ref)

    async def verify_webhook(self, payload: bytes, headers: dict) -> PaymentEvent | None:
        data = json.loads(payload)
        body = data.get("Body", {})
        stk = body.get("stkCallback", {})

        result_code = stk.get("ResultCode", 1)
        checkout_id = stk.get("CheckoutRequestID", "")

        if result_code == 0:
            metadata_items = stk.get("CallbackMetadata", {}).get("Item", [])
            amount = "0"
            receipt = ""
            phone = ""
            for item in metadata_items:
                if item.get("Name") == "Amount":
                    amount = str(item.get("Value", 0))
                elif item.get("Name") == "MpesaReceiptNumber":
                    receipt = str(item.get("Value", ""))
                elif item.get("Name") == "PhoneNumber":
                    phone = str(item.get("Value", ""))

            return PaymentEvent(
                event_id=checkout_id,
                type="payment.succeeded",
                gateway_payment_id=checkout_id,
                status="succeeded",
                amount=Decimal(amount),
                currency="KES",
                metadata={"receipt": receipt, "phone": phone, "checkout_id": checkout_id},
            )
        else:
            return PaymentEvent(
                event_id=checkout_id,
                type="payment.failed",
                gateway_payment_id=checkout_id,
                status="failed",
                amount=Decimal("0"),
                currency="KES",
                metadata={"result_code": result_code, "description": stk.get("ResultDesc", "")},
            )

    async def refund(self, payment_id: str, amount: Decimal | None = None) -> bool:
        return False

    async def get_status(self, payment_id: str) -> str:
        result = await self.query_status(payment_id)
        code = result.get("ResultCode", 1)
        if code == 0:
            return "succeeded"
        elif code == 1037:
            return "pending"
        else:
            return "failed"
