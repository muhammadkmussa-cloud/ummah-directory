# Remediation Execution Plan

## Phase 1: Investigation & Exploration (Parallel Explorers)
Dispatch 4 Explorer subagents to investigate:
- Explorer 1 (M1): `backend/app/payments/mpesa_gateway.py` payload validation & out-of-band transaction status check implementation details.
- Explorer 2 (M2): `frontend/` TypeScript errors (`npm run typecheck`), `Button.tsx` `xs` size, and ESLint v9 configuration (`eslint.config.js`).
- Explorer 3 (M3): `backend/app/api/v1/endpoints/` attribute mismatches, `OrganizationManager` unique constraint in `organization.py`, `log_action` UUID/str handling, `main.py` slowapi exception handler, and `mypy app` errors.
- Explorer 4 (M4): `backend/tests/conftest.py` setup to resolve database connection errors during `pytest`.

## Phase 2: Implementation (Workers)
Dispatch Workers with Explorer findings to implement clean fixes and run verification:
- Worker 1 (M1): Update `MpesaGateway.verify_webhook` in `backend/app/payments/mpesa_gateway.py`.
- Worker 2 (M2): Fix frontend TS compilation errors, add `'xs'` size to `ButtonProps`, create `eslint.config.js`. Run `npm run typecheck` and `npm run lint`.
- Worker 3 (M3): Fix backend models, unique constraint, `log_action`, `slowapi` in `main.py`. Run `./.venv/bin/python -m mypy app`.
- Worker 4 (M4): Update `backend/tests/conftest.py`. Run `./.venv/bin/python -m pytest`.

## Phase 3: Verification (Reviewers & Challengers)
- Reviewers: Verify code quality, design choices, interface consistency.
- Challengers: Perform empirical verification (run tests, check boundary conditions).

## Phase 4: Forensic Audit (Auditor)
- Auditor: Run integrity audit to confirm genuine logic, zero hardcoded test pass tricks or dummy facades.

## Phase 5: Final Synthesis & Sentinel Report
- Aggregate results, update `PROJECT.md` and `progress.md`, send completion report to parent/Sentinel.
