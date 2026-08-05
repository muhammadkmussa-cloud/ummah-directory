import base64
import json
import logging
from datetime import datetime
from decimal import Decimal

import httpx

from app.core.config import settings
from app.core.retry import with_retry
from app.payments.base import PaymentEvent, PaymentGateway, PaymentIntent

logger = logging.getLogger(__name__)

MPESA_API = (
    "https://sandbox.safaricom.co.ke"
    if settings.mpesa_environment == "sandbox"
    else "https://api.safaricom.co.ke"
)

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
        secret = getattr(settings, "mpesa_webhook_secret", "")
        normalized_headers = {k.lower(): v for k, v in headers.items()}
        if secret:
            token = (
                normalized_headers.get("x-mpesa-token")
                or normalized_headers.get("x-webhook-secret")
                or normalized_headers.get("authorization", "").replace("Bearer ", "").strip()
            )
            if token != secret:
                return None

        try:
            data = json.loads(payload)
        except (json.JSONDecodeError, TypeError, ValueError):
            return None

        if not isinstance(data, dict):
            return None

        body = data.get("Body", {})
        if not isinstance(body, dict):
            return None

        stk = body.get("stkCallback", {})
        if not isinstance(stk, dict):
            return None

        checkout_id = stk.get("CheckoutRequestID", "")
        if not checkout_id:
            return None

        callback_result_code = stk.get("ResultCode", 1)

        # Perform out-of-band status query against Safaricom API
        try:
            query_result = await self.query_status(checkout_id)
        except Exception as exc:
            return PaymentEvent(
                event_id=checkout_id,
                type="payment.failed",
                gateway_payment_id=checkout_id,
                status="failed",
                amount=Decimal("0"),
                currency="KES",
                metadata={
                    "result_code": callback_result_code,
                    "error": f"Out-of-band verification query failed: {str(exc)}",
                },
            )

        out_of_band_code = (
            query_result.get("ResultCode") if isinstance(query_result, dict) else None
        )
        is_oob_success = out_of_band_code in (0, "0")
        is_callback_success = callback_result_code in (0, "0")

        if is_callback_success and is_oob_success:
            metadata_items = stk.get("CallbackMetadata", {}).get("Item", [])
            amount = "0"
            receipt = ""
            phone = ""
            if isinstance(metadata_items, list):
                for item in metadata_items:
                    if isinstance(item, dict):
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
                metadata={
                    "receipt": receipt,
                    "phone": phone,
                    "checkout_id": checkout_id,
                    "query_response": query_result,
                },
            )
        else:
            res_code = out_of_band_code if out_of_band_code is not None else callback_result_code
            desc = (
                query_result.get("ResultDesc")
                if isinstance(query_result, dict) and query_result.get("ResultDesc")
                else stk.get("ResultDesc", "")
            )
            return PaymentEvent(
                event_id=checkout_id,
                type="payment.failed",
                gateway_payment_id=checkout_id,
                status="failed",
                amount=Decimal("0"),
                currency="KES",
                metadata={"result_code": res_code, "description": desc},
            )

    async def refund(self, payment_id: str, amount: Decimal | None = None) -> bool:
        """
        Process a refund for an M-Pesa payment.
        
        Note: M-Pesa requires business-to-customer (B2C) payment API for refunds.
        This implementation uses the B2C API to send money back to the original payer.
        
        Args:
            payment_id: The original payment CheckoutRequestID or transaction ID
            amount: Amount to refund (optional, defaults to full refund)
            
        Returns:
            True if refund was initiated successfully, False otherwise
            
        Raises:
            NotImplementedError: If B2C credentials are not configured
        """
        try:
            # M-Pesa refunds require B2C (Business to Customer) API
            # which needs separate credentials from STK Push
            b2c_key = getattr(settings, 'mpesa_b2c_consumer_key', None)
            b2c_secret = getattr(settings, 'mpesa_b2c_consumer_secret', None)
            
            if not b2c_key or not b2c_secret:
                # Log that refund requires B2C credentials
                logger.warning(
                    "mpesa.refund_requires_b2c",
                    payment_id=payment_id,
                    message="M-Pesa refunds require B2C API credentials"
                )
                return False
            
            # Get B2C access token
            credentials = f"{b2c_key}:{b2c_secret}"
            encoded = base64.b64encode(credentials.encode()).decode()
            
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{MPESA_API}/oauth/v1/generate?grant_type=client_credentials",
                    headers={"Authorization": f"Basic {encoded}"},
                )
                data = resp.json()
                token = data.get("access_token")
                
                if not token:
                    return False
                
                # First, query the original transaction to get the phone number
                original_status = await self.query_status(payment_id)
                
                # Extract phone number from original transaction if available
                # For now, we'll need the phone number to be stored in metadata
                # This is a limitation - in production, store payer phone in donation record
                phone_number = None  # Should be retrieved from donation record
                
                if not phone_number:
                    logger.warning(
                        "mpesa.refund_failed_missing_phone",
                        payment_id=payment_id
                    )
                    return False
                
                timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
                password_str = f"{settings.mpesa_business_shortcode}{settings.mpesa_passkey}{timestamp}"
                password = base64.b64encode(password_str.encode()).decode()
                
                # Prepare B2C request
                b2c_payload = {
                    "ResultType": "Completed",
                    "CommandID": "SalaryPayment",  # or "BusinessPayment"
                    "Amount": int(amount) if amount else 0,
                    "PartyA": settings.mpesa_business_shortcode,
                    "PartyB": phone_number,
                    "Remarks": f"Refund for transaction {payment_id}",
                    "QueueTimeOutURL": settings.mpesa_callback_url,
                    "ResultURL": settings.mpesa_callback_url,
                    "Occasion": "Refund"
                }
                
                resp = await client.post(
                    f"{MPESA_API}/mpesa/b2c/v1/paymentrequest",
                    json=b2c_payload,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json"
                    },
                )
                
                result = resp.json()
                
                # Check if refund was accepted
                if result.get("ConversationID") or result.get("ResponseCode") == "0":
                    logger.info(
                        "mpesa.refund_initiated",
                        payment_id=payment_id,
                        conversation_id=result.get("ConversationID")
                    )
                    return True
                else:
                    logger.warning(
                        "mpesa.refund_rejected",
                        payment_id=payment_id,
                        response=result
                    )
                    return False
                    
        except Exception as e:
            logger.error(
                "mpesa.refund_error",
                payment_id=payment_id,
                error=str(e)
            )
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
