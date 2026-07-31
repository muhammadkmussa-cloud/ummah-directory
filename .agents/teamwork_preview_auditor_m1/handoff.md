# Forensic Audit Report — M-Pesa Gateway Webhook Verification Fix

**Work Product**: M-Pesa Gateway Webhook & Out-of-Band Verification Fix (`backend/app/payments/mpesa_gateway.py`, `backend/tests/test_mpesa_gateway.py`, `backend/app/core/config.py`)  
**Profile**: General Project  
**Verdict**: CLEAN  

---

## 1. Observation

### Code Inspection
- **File**: `backend/app/payments/mpesa_gateway.py`
  - **Lines 99-109**: Security token validation logic against `settings.mpesa_webhook_secret` using normalized lower-cased headers (`x-mpesa-token`, `x-webhook-secret`, `authorization`). Rejects unauthorized callbacks with `None`.
  - **Lines 111-131**: Robust JSON payload parsing and safe extraction of `stkCallback` and `CheckoutRequestID`. Rejects invalid/malformed JSON or payloads missing `CheckoutRequestID` with `None`.
  - **Lines 134-148**: Mandatory out-of-band transaction status query `query_result = await self.query_status(checkout_id)`. Wrapped in `try...except Exception as exc`; network/API failures cleanly return `PaymentEvent` with `type="payment.failed"`, `status="failed"`, and detailed error metadata.
  - **Lines 150-155**: Dual-verification logic checking that both `callback_result_code` AND `out_of_band_code` evaluate to success (`0` or `"0"`):
    ```python
    out_of_band_code = query_result.get("ResultCode") if isinstance(query_result, dict) else None
    is_oob_success = out_of_band_code in (0, "0")
    is_callback_success = callback_result_code in (0, "0")
    ```
  - **Lines 156-184**: Successful payment event construct requiring both callback & out-of-band verification to pass.
  - **Lines 185-200**: Spoofed or failed transactions yield `type="payment.failed"`, recording out-of-band or callback result codes and descriptions.
  - **Lines 71-90**: `query_status` method authenticates with Safaricom OAuth (`_get_access_token()`), builds timestamped security password using `mpesa_business_shortcode` and `mpesa_passkey`, and POSTs query payload to Safaricom's Daraja `stkpushquery/v1/query` endpoint.

- **File**: `backend/tests/test_mpesa_gateway.py`
  - 6 unit tests covering:
    1. `test_verify_webhook_success_with_oob_verification`: Valid callback + OOB success -> `payment.succeeded`. Asserts `mock_query.assert_awaited_once_with("ws_CO_260520211000000000")`.
    2. `test_verify_webhook_spoofed_payload_rejected_by_oob`: Spoofed success callback + OOB failure (`ResultCode: 1032`) -> `payment.failed`. Asserts `mock_query.assert_awaited_once_with("ws_CO_spoofed123")`.
    3. `test_verify_webhook_oob_query_exception_handled`: OOB query timeout/network exception -> `payment.failed`.
    4. `test_verify_webhook_callback_failed_status`: Non-zero callback `ResultCode` -> `payment.failed`.
    5. `test_verify_webhook_security_token`: Validates token header authentication behavior.
    6. `test_verify_webhook_invalid_payload`: Rejects malformed JSON and empty payloads.

### Prohibited Patterns Audit Results
1. **Hardcoded test results**: NONE. Implementation contains no hardcoded shortcuts, fixed return values, or test-only overrides.
2. **Facade implementations**: NONE. `query_status` constructs authentic Safaricom Daraja STK Push Query payloads and handles real HTTP communication via `httpx`.
3. **Fabricated verification outputs**: NONE. No pre-populated result files or fake logs were present in the workspace.
4. **Self-certifying tests**: NONE. Unit tests invoke `verify_webhook` directly and assert that out-of-band query is awaited with correct arguments.
5. **Execution delegation**: NONE. Verification logic is executed directly within `MpesaGateway`.

### Empirical Test Execution Results
- **Pytest Suite Execution**:
  ```bash
  /home/muhammad-mussa/projects/ummah-directory/backend/.venv/bin/python3 -m pytest tests/test_mpesa_gateway.py -v
  ```
  Output: `6 passed in 0.28s`

- **Adversarial & Edge-Case Stress Testing**:
  - Test Case 1: String vs integer `ResultCode` normalization (e.g. callback `"0"` + OOB `0`) -> PASS.
  - Test Case 2: Anti-spoofing rejection when callback claims `ResultCode: 0` but OOB query returns `"1"` -> PASS (`type="payment.failed"`).
  - Test Case 3: `Authorization: Bearer <token>` secret header handling -> PASS.
  - Test Case 4: Empty dict response from `query_status` -> PASS (`type="payment.failed"`).
  - Test Case 5: `query_status` returning `None` -> PASS (`type="payment.failed"`).
  - Test Case 6: Network exception (`ConnectionError`) during out-of-band query -> PASS (`type="payment.failed"` with exception details in metadata).

---

## 2. Logic Chain

1. **Vulnerability Resolution Verification**:
   The unauthenticated webhook vulnerability allowed arbitrary external actors to send JSON payloads claiming `ResultCode: 0` to fake payment completion. The implementation in `MpesaGateway.verify_webhook` mandates an out-of-band status query (`query_status`) to Safaricom's Daraja API before granting `payment.succeeded` status.
2. **Authenticity of Out-of-Band Call**:
   The out-of-band call is not bypassed or short-circuited. `verify_webhook` unconditionally calls `await self.query_status(checkout_id)` for any valid JSON callback payload containing a `CheckoutRequestID`.
3. **Response Schema & Type Handling**:
   Safaricom Daraja API returns `ResultCode` as either string `"0"` or integer `0`. The implementation checks `out_of_band_code in (0, "0")`, ensuring compatibility with both formats while maintaining strict verification.
4. **Test Suite Discipline**:
   The unit test suite in `test_mpesa_gateway.py` does not contain hardcoded pass shortcuts. Tests use `AsyncMock` to verify that `query_status` is explicitly awaited with the exact `CheckoutRequestID` extracted from the webhook payload. Spoofed payloads (where webhook claims success but Safaricom query returns failure) are explicitly tested and verified to yield `payment.failed`.

---

## 3. Caveats

- **External Network Dependency**: Out-of-band verification depends on Safaricom's Daraja API availability (`https://sandbox.safaricom.co.ke` or `https://api.safaricom.co.ke`). In production environments, network timeouts or Safaricom downtime will cause webhooks to fail closed (`payment.failed`), protecting against unauthorized payment claims.
- **Safaricom Query Latency**: `query_status` makes an HTTP request during webhook processing. Ensure proper HTTP client timeouts are configured on gateway deployment.

---

## 4. Conclusion

The M-Pesa gateway webhook verification fix is genuine, secure, robust, and free of integrity violations. Out-of-band verification is properly wired, type-safe, and thoroughly tested against spoofing attacks and network errors.

**Final Audit Verdict: CLEAN**

---

## 5. Verification Method

To independently verify this forensic audit:

1. **Source Inspection**:
   ```bash
   view_file /home/muhammad-mussa/projects/ummah-directory/backend/app/payments/mpesa_gateway.py
   view_file /home/muhammad-mussa/projects/ummah-directory/backend/tests/test_mpesa_gateway.py
   ```
2. **Run Pytest Suite**:
   ```bash
   cd /home/muhammad-mussa/projects/ummah-directory/backend
   .venv/bin/python3 -m pytest tests/test_mpesa_gateway.py -v
   ```
3. **Invalidation Conditions**:
   - If `test_verify_webhook_spoofed_payload_rejected_by_oob` fails or is removed, spoofing protection is compromised.
   - If `query_status` call in `verify_webhook` is removed or conditioned on client-controlled input, out-of-band verification is bypassed.
