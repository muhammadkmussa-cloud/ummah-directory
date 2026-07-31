# Handoff Report — M-Pesa Gateway Webhook & Out-of-Band Status Verification Implementation

## 1. Observation

- **File Modified**: `backend/app/payments/mpesa_gateway.py`
  - Updated `verify_webhook(self, payload: bytes, headers: dict) -> PaymentEvent | None` (lines 99-195):
    - Added security token header validation checking `x-mpesa-token`, `x-webhook-secret`, or `authorization` header against `settings.mpesa_webhook_secret` when configured. Returns `None` if configured secret does not match incoming token.
    - Added robust payload JSON parsing and `CheckoutRequestID` extraction.
    - Added out-of-band transaction status query by calling `query_result = await self.query_status(checkout_id)`.
    - Wrapped out-of-band call in a `try...except` block; if an exception occurs during the out-of-band request (e.g. network/timeout error), returns a `PaymentEvent` with `type="payment.failed"`, `status="failed"`, and detailed error metadata.
    - Verified that both the callback `ResultCode` and out-of-band `ResultCode` indicate success (`0` or `"0"`) before returning `PaymentEvent` with `type="payment.succeeded"`, `status="succeeded"`, and metadata containing `receipt`, `phone`, `checkout_id`, and `query_response`.
    - If out-of-band query returns non-zero result code or failure, returns `PaymentEvent` with `type="payment.failed"`, `status="failed"`, and descriptive result code/description metadata.

- **File Modified**: `backend/app/core/config.py`
  - Added `mpesa_webhook_secret: str = ""` field to `Settings` class under M-Pesa configuration settings (line 55).

- **New Test File**: `backend/tests/test_mpesa_gateway.py`
  - Added 6 unit tests covering:
    1. `test_verify_webhook_success_with_oob_verification`: Valid callback payload with `ResultCode == 0` and out-of-band status query returning `ResultCode == "0"` yields `payment.succeeded`.
    2. `test_verify_webhook_spoofed_payload_rejected_by_oob`: Spoofed webhook claiming `ResultCode == 0` is rejected when out-of-band status query returns `ResultCode == "1032"` (Request cancelled), yielding `payment.failed`.
    3. `test_verify_webhook_oob_query_exception_handled`: Exception raised during out-of-band query yields `payment.failed`.
    4. `test_verify_webhook_callback_failed_status`: Callback with `ResultCode == 1` yields `payment.failed`.
    5. `test_verify_webhook_security_token`: Validates security token check when `settings.mpesa_webhook_secret` is set.
    6. `test_verify_webhook_invalid_payload`: Handles invalid/malformed JSON payloads returning `None`.

- **Test Execution Command & Result**:
  - Command: `/home/muhammad-mussa/projects/ummah-directory/backend/.venv/bin/python3 -m pytest tests/test_mpesa_gateway.py`
  - Result: `6 passed in 0.29s`

## 2. Logic Chain

1. **Initial Vulnerability**:
   - `MpesaGateway.verify_webhook` previously relied solely on in-memory JSON parsing of the unauthenticated callback payload (`stkCallback.get("ResultCode") == 0`).
   - Because M-Pesa Daraja STK Push callbacks lack native HMAC signature headers, an attacker could post fake JSON payloads with `ResultCode: 0` to `/api/v1/payments/mpesa/webhook` and force payments into `succeeded` status.
2. **Implementation Strategy**:
   - To secure webhook verification, `verify_webhook` was updated to perform an out-of-band API call via `await self.query_status(checkout_id)` to Safaricom's `stkpushquery` API.
   - Authoritative transaction status is established by Safaricom's API response. If Safaricom's out-of-band response yields `ResultCode == 0` (or `"0"`), the payment is confirmed legitimate.
   - If an attacker sends a spoofed callback or if out-of-band query returns non-zero (`ResultCode != 0`) or fails with a network exception, `verify_webhook` yields `type="payment.failed"` / `status="failed"`.
3. **Optional Token Guard**:
   - For additional defense-in-depth, if `mpesa_webhook_secret` is configured in `settings`, `verify_webhook` validates `x-mpesa-token`, `x-webhook-secret`, or `authorization` header matching `settings.mpesa_webhook_secret` before proceeding with parsing and out-of-band query.

## 3. Caveats

- **Network Dependency**: `verify_webhook` executes an asynchronous HTTP POST request to Safaricom's API (`query_status`). Out-of-band verification depends on Safaricom API availability and OAuth access token generation.
- **Retry / Timeout**: If Safaricom's STK push query endpoint is temporarily unreachable, `query_status` handles network retries (via `@with_retry`), and any persistent failure turns the event into `payment.failed` with exception details in metadata.

## 4. Conclusion

- Payload verification and out-of-band transaction status verification (`query_status`) have been successfully implemented in `MpesaGateway.verify_webhook`.
- All requirements are met, and the implementation is validated by 6 passing unit tests.

## 5. Verification Method

To independently verify the implementation:

1. Inspect source files:
   - `backend/app/payments/mpesa_gateway.py` lines 99-195
   - `backend/app/core/config.py` line 55
   - `backend/tests/test_mpesa_gateway.py`
2. Run pytest suite:
   ```bash
   cd /home/muhammad-mussa/projects/ummah-directory/backend
   .venv/bin/python3 -m pytest tests/test_mpesa_gateway.py
   ```
3. Verification Invalidation Conditions:
   - If `test_verify_webhook_spoofed_payload_rejected_by_oob` fails, out-of-band verification is disconnected or bypassed.
   - If `test_verify_webhook_success_with_oob_verification` fails, successful payments are improperly rejected.
