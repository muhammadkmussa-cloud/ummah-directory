import json
from decimal import Decimal
from unittest.mock import AsyncMock, patch

import pytest

from app.core.config import settings
from app.payments.mpesa_gateway import MpesaGateway


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    """Override session setup_db fixture to avoid requiring live PostgreSQL in unit tests."""
    yield


@pytest.mark.asyncio
async def test_verify_webhook_success_with_oob_verification():
    gateway = MpesaGateway()
    payload = json.dumps({
        "Body": {
            "stkCallback": {
                "MerchantRequestID": "29182-10001-1",
                "CheckoutRequestID": "ws_CO_260520211000000000",
                "ResultCode": 0,
                "ResultDesc": "The service request is processed successfully.",
                "CallbackMetadata": {
                    "Item": [
                        {"Name": "Amount", "Value": 1500},
                        {"Name": "MpesaReceiptNumber", "Value": "NLJ7RT61SV"},
                        {"Name": "PhoneNumber", "Value": 254712345678},
                    ]
                },
            }
        }
    }).encode("utf-8")

    with patch.object(gateway, "query_status", new_callable=AsyncMock) as mock_query:
        mock_query.return_value = {
            "ResponseCode": "0",
            "ResponseDescription": "The service request has been accepted successfully",
            "MerchantRequestID": "29182-10001-1",
            "CheckoutRequestID": "ws_CO_260520211000000000",
            "ResultCode": "0",
            "ResultDesc": "The service request is processed successfully.",
        }

        event = await gateway.verify_webhook(payload, {})

        assert event is not None
        assert event.type == "payment.succeeded"
        assert event.status == "succeeded"
        assert event.event_id == "ws_CO_260520211000000000"
        assert event.amount == Decimal("1500")
        assert event.currency == "KES"
        assert event.metadata["receipt"] == "NLJ7RT61SV"
        assert event.metadata["phone"] == "254712345678"
        mock_query.assert_awaited_once_with("ws_CO_260520211000000000")


@pytest.mark.asyncio
async def test_verify_webhook_spoofed_payload_rejected_by_oob():
    """Test spoofed webhook claiming success is rejected when out-of-band query returns failure."""
    gateway = MpesaGateway()
    payload = json.dumps({
        "Body": {
            "stkCallback": {
                "CheckoutRequestID": "ws_CO_spoofed123",
                "ResultCode": 0,
                "ResultDesc": "The service request is processed successfully.",
                "CallbackMetadata": {
                    "Item": [
                        {"Name": "Amount", "Value": 1000},
                        {"Name": "MpesaReceiptNumber", "Value": "FAKE123456"},
                        {"Name": "PhoneNumber", "Value": 254700000000},
                    ]
                },
            }
        }
    }).encode("utf-8")

    with patch.object(gateway, "query_status", new_callable=AsyncMock) as mock_query:
        # Out-of-band query indicates the transaction was cancelled by user
        mock_query.return_value = {
            "ResultCode": "1032",
            "ResultDesc": "Request cancelled by user.",
        }

        event = await gateway.verify_webhook(payload, {})

        assert event is not None
        assert event.type == "payment.failed"
        assert event.status == "failed"
        assert event.amount == Decimal("0")
        assert event.metadata["result_code"] == "1032"
        mock_query.assert_awaited_once_with("ws_CO_spoofed123")


@pytest.mark.asyncio
async def test_verify_webhook_oob_query_exception_handled():
    """Test that an exception during out-of-band query yields a payment.failed event."""
    gateway = MpesaGateway()
    payload = json.dumps({
        "Body": {
            "stkCallback": {
                "CheckoutRequestID": "ws_CO_timeout999",
                "ResultCode": 0,
                "ResultDesc": "Success",
            }
        }
    }).encode("utf-8")

    with patch.object(gateway, "query_status", new_callable=AsyncMock) as mock_query:
        mock_query.side_effect = RuntimeError("Safaricom API timeout")

        event = await gateway.verify_webhook(payload, {})

        assert event is not None
        assert event.type == "payment.failed"
        assert event.status == "failed"
        assert "Out-of-band verification query failed" in event.metadata["error"]


@pytest.mark.asyncio
async def test_verify_webhook_callback_failed_status():
    """Test callback with non-zero ResultCode."""
    gateway = MpesaGateway()
    payload = json.dumps({
        "Body": {
            "stkCallback": {
                "CheckoutRequestID": "ws_CO_failed123",
                "ResultCode": 1,
                "ResultDesc": "Insufficient Funds",
            }
        }
    }).encode("utf-8")

    with patch.object(gateway, "query_status", new_callable=AsyncMock) as mock_query:
        mock_query.return_value = {
            "ResultCode": 1,
            "ResultDesc": "Insufficient Funds",
        }

        event = await gateway.verify_webhook(payload, {})

        assert event is not None
        assert event.type == "payment.failed"
        assert event.status == "failed"
        assert event.metadata["result_code"] == 1


@pytest.mark.asyncio
async def test_verify_webhook_security_token():
    """Test optional security token header validation."""
    gateway = MpesaGateway()
    payload = json.dumps({
        "Body": {
            "stkCallback": {
                "CheckoutRequestID": "ws_CO_token_test",
                "ResultCode": 0,
            }
        }
    }).encode("utf-8")

    with patch.object(settings, "mpesa_webhook_secret", "secret_token_123"):
        # 1. Invalid token header -> rejected
        event_invalid = await gateway.verify_webhook(payload, {"x-mpesa-token": "wrong_token"})
        assert event_invalid is None

        # 2. Valid token header -> verified out-of-band and processed
        with patch.object(gateway, "query_status", new_callable=AsyncMock) as mock_query:
            mock_query.return_value = {"ResultCode": 0}
            event_valid = await gateway.verify_webhook(
                payload, {"x-mpesa-token": "secret_token_123"}
            )
            assert event_valid is not None
            assert event_valid.type == "payment.succeeded"


@pytest.mark.asyncio
async def test_verify_webhook_invalid_payload():
    """Test handling of invalid non-JSON or malformed payloads."""
    gateway = MpesaGateway()

    assert await gateway.verify_webhook(b"not-json", {}) is None
    assert await gateway.verify_webhook(b"{}", {}) is None
    assert await gateway.verify_webhook(b'{"Body": {}}', {}) is None
