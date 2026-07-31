# Handoff Report — Code Implementation Audit (Phases 6, 7 & 11)

**Audit Target**: Ummah Directory Codebase  
**Auditor**: Teamwork Explorer (Read-Only Investigator)  
**Date**: 2026-07-31  

---

## Executive Summary & Scores

| Audit Phase | Focus Area | Score | Status |
| :--- | :--- | :---: | :--- |
| **Phase 6** | Role & Permission Structure | **65 / 100** | ⚠️ Needs Architectural Alignment |
| **Phase 7** | Authentication Mechanics | **85 / 100** | ✅ Robust with Minor Operational Edge Cases |
| **Phase 11** | Security Best Practices & Configuration | **82 / 100** | ✅ High Quality with Configuration Gaps |

---

## 1. Observation

### Phase 6: Role & Permission Audit (Score: 65/100)
- **Role Model & Database Seeding**:
  - `backend/app/models/user.py` (lines 28–39) defines a single `Role` model and relationship.
  - `backend/scripts/seed_dev_data.py` (lines 113–149) seeds only three global system roles: `super_admin`, `moderator`, and `registered_user`.
  - Roles specified in platform requirements (`Guest`, `Organization Owner`, `Business Manager`, `Mosque Manager`, `Charity Manager`, `Education Manager`) are **not** defined as system-level RBAC `Role` records.
  - Resource-level management relies on `Organization` (`owner_id`, `backend/app/models/organization.py`: line 50) and `OrganizationManager` (`user_id`, `role`, `backend/app/models/organization.py`: lines 71–89).
- **Backend Dependency Enforcement**:
  - `require_role()` in `backend/app/core/dependencies.py` (lines 73–81) checks `user.role.name == role_name` or `user.role.name == "super_admin"`.
  - `require_permission()` in `backend/app/core/dependencies.py` (lines 84–107) queries permission codenames associated with `user.role`.
  - `require_org_access()` in `backend/app/core/dependencies.py` (lines 153–191) checks if the user is `Organization.owner_id` or an active manager in `OrganizationManager`.
  - **Gap**: `seed_dev_data.py` (lines 130–147) grants all CRUD permission codenames (`business.create`, `business.edit`, `business.delete`, `mosque.create`, `mosque.edit`, `mosque.delete`, `charity.create`, `charity.edit`, `charity.delete`, `education.create`, `education.edit`, `education.delete`, etc.) directly to `registered_user`. Domain endpoints (`businesses.py`, `mosques.py`, `charities.py`, `education.py`) check global permissions rather than validating entity-level manager roles.
- **Frontend Route Protection**:
  - `frontend/src/App.tsx` wraps protected routes (`/dashboard`, `/organizations/new`) with `<AuthRoute>` (lines 105, 114).
  - `frontend/src/features/auth/components/AuthRoute.tsx` (lines 7–15) only checks for `localStorage.getItem('access_token')`. It performs no role or permission checks.
  - Sensitive frontend route `/admin` (`frontend/src/App.tsx`: line 126) is **unprotected by `AuthRoute`** on the client side, allowing any guest user to view the layout shell (though backend calls fail with 401/403).

### Phase 7: Authentication Audit (Score: 85/100)
- **JWT Generation & Token Refresh**:
  - Implementation located in `backend/app/core/security.py` (lines 28–51) and `backend/app/api/v1/endpoints/auth.py` (lines 179–180, 222–304).
  - Uses `HS256` signed JWTs containing `sub` (User ID), `type` (`access` or `refresh`), `exp`, and a unique `jti` UUID (`security.py`: lines 33, 42).
  - Default token expiration: Access Token = 15 minutes (`config.py`: line 27), Refresh Token = 7 days (`config.py`: line 28).
  - Token refresh (`auth.py`: lines 222–304) implements token rotation: the previous refresh token `jti` is blacklisted in Redis and replaced with a newly generated pair.
- **Password Hashing & Reset**:
  - Password hashing in `backend/app/core/security.py` (lines 10–25) uses `argon2-cffi` (`PasswordHasher` with `time_cost=3`, `memory_cost=65536`, `parallelism=4`).
  - Forgot password & Reset mechanisms in `backend/app/api/v1/endpoints/auth.py` (lines 349–385) use `URLSafeTimedSerializer` with 1-hour token expiration (`max_age=3600`).
- **Email & Phone Verification**:
  - Email verification handler in `auth.py` (lines 45–102) signs tokens with `URLSafeTimedSerializer` (24-hour expiry) and updates `is_email_verified`. Enforced via `require_email_verified()` (`dependencies.py`: lines 110–118).
  - Phone verification handler in `auth.py` (lines 388–451) sends 6-digit numeric OTP stored in Redis (`phone_verify:{user_id}`, 5-minute TTL) with SMS provider abstraction (Twilio / Africa's Talking).
- **Session Management & Logout**:
  - Logout endpoint in `auth.py` (lines 307–346) blacklists the JWT `jti` in Redis for its remaining lifetime and evicts the session from `active_sessions:{user_id}`.
  - Concurrent active sessions capped at 5 per user (`auth.py`: lines 193, 278).
  - Login lockout protection (`auth.py`: lines 123–165) tracks failed login attempts in Redis (`login_attempts:{email}`) and locks account for 15 minutes after 5 consecutive failures.
  - **Gap**: Fallback exception handling (`auth.py`: lines 143–144, 163–164) catches Redis connection errors and sets `redis = None`, allowing login without lockout enforcement or token revocation if Redis is unavailable. Furthermore, JWT tokens are stored in `localStorage` in the frontend (`AuthRoute.tsx`: line 8).

### Phase 11: Security & Configuration Audit (Score: 82/100)
- **Input Validation Schemas**:
  - Backend uses Pydantic v2 schemas (`backend/app/schemas/auth.py`, `user.py`, `business.py`, etc.) enforcing strict data types, email formats, and string bounds.
  - Frontend utilizes TypeScript interfaces (`frontend/src/types/`).
- **CORS Policies & Security Headers**:
  - Defined in `backend/app/main.py` (lines 54–93).
  - `SecurityHeadersMiddleware` (lines 54–63) sets `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and `Content-Security-Policy`.
  - CORS middleware (`main.py`: lines 77–86) uses configurable origins from `Settings.cors_origin_list` (`config.py`: lines 15, 76–77).
  - **Gap**: `Settings.allowed_hosts` in `backend/app/core/config.py` (line 69) defaults to `"*"` (wildcard). In production, this permits HTTP Host Header spoofing if not overridden.
- **Rate Limiting**:
  - Configured using `slowapi` (`backend/app/core/rate_limit.py` & `main.py`: lines 74–75, 89).
  - Applied to authentication routes (`auth.py`): `/register` (5/min), `/login` (10/min), `/refresh` (10/min), `/forgot-password` (3/min), `/reset-password` (5/min), `/send-phone-verification` (3/min), `/verify-phone` (5/min).
- **Secret Key Management**:
  - Managed via `pydantic-settings` in `backend/app/core/config.py`.
  - `validate_secrets()` method (`config.py`: lines 83–95) enforces that `app_secret_key`, `jwt_secret_key`, and `database_url` are explicitly set and not set to default `"change-me"` values during non-test startup.
- **File Upload Security Constraints**:
  - Implemented in `backend/app/api/v1/endpoints/files.py` (lines 19–133).
  - Strict type whitelist: `ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}` (line 19).
  - Magic bytes verification (`validate_file_signature()`, lines 26–38) checks binary signatures (`%PDF`, `\xff\xd8\xff`, `\x89PNG`, `RIFF`) to prevent file extension spoofing.
  - File size capped at 10MB (`MAX_SIZE = 10 * 1024 * 1024`, line 21).
  - Image bomb mitigation (`MAX_IMAGE_PIXELS = 50_000_000`, line 23) and LANCZOS resizing to 2048px maximum dimension (lines 41–59).
  - Path traversal protection using `PurePosixPath(filename).name` and UUID storage paths (lines 89–90).

---

## 2. Logic Chain

1. **Phase 6 Score (65/100)**:
   - *Observation*: System seeds only 3 roles (`super_admin`, `moderator`, `registered_user`). Domain roles (`Business Manager`, `Mosque Manager`, `Charity Manager`, `Education Manager`) are absent from RBAC tables. Frontend `AuthRoute` checks `localStorage` token existence only, omitting role guards.
   - *Deduction*: Role architecture split between global RBAC and entity ownership works for ownership checks (`require_org_access`), but assigns excessive global permissions (`business.edit`, `mosque.edit`, etc.) to all registered users. Frontend route protection is weak. Deducted 35 points.

2. **Phase 7 Score (85/100)**:
   - *Observation*: Argon2id hashing, 15-min JWT access token expiry, 7-day refresh token rotation, active session cap (5), 15-min lockout after 5 login failures, email/phone verification handlers present.
   - *Deduction*: Authentication mechanics are built with modern security standards. Minor deductions (-15 points) for Redis outage fail-open behavior and storing tokens in frontend `localStorage` instead of HttpOnly cookies.

3. **Phase 11 Score (82/100)**:
   - *Observation*: Pydantic v2 validation, custom security headers (HSTS, CSP, X-Frame-Options), slowapi rate limiting on sensitive routes, startup secret validation, magic bytes file validation, image bomb protection.
   - *Deduction*: Implementation quality is high. Deducted 18 points due to wildcard `allowed_hosts = "*"` default in `config.py` and lack of rate limiting on general resource creation endpoints.

---

## 3. Caveats

- **Runtime Verification**: Analysis was conducted strictly via static code inspection per read-only rules. Live API execution and database verification were not performed.
- **Environment Settings**: Production environment variable file `.env` was not accessed; configuration evaluation was based on `.env.example` and `app/core/config.py`.

---

## 4. Conclusion

- **Phase 6 (Role & Permission Structure - 65/100)**: High priority to implement a dedicated `<RoleGuard>` on frontend routes (especially `/admin`) and refine backend permission assignments so `registered_user` does not hold broad global permissions.
- **Phase 7 (Authentication Mechanics - 85/100)**: Strong implementation using Argon2id and JWT rotation. Recommend upgrading frontend storage from `localStorage` to `HttpOnly` samesite cookies.
- **Phase 11 (Security Best Practices & Configuration - 82/100)**: Strong upload constraints and security headers. Recommend setting `ALLOWED_HOSTS` explicitly for production deployments.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Phase 6 Roles & Frontend Guards**:
   - Inspect `backend/scripts/seed_dev_data.py` (lines 113–149) to confirm only `super_admin`, `moderator`, and `registered_user` roles exist.
   - Inspect `frontend/src/App.tsx` (line 126) and `frontend/src/features/auth/components/AuthRoute.tsx` (lines 7–15) to confirm `/admin` route lacks authentication guards and role restrictions.

2. **Verify Phase 7 Auth Mechanics**:
   - Inspect `backend/app/core/security.py` (lines 10–25) for Argon2id configuration.
   - Inspect `backend/app/api/v1/endpoints/auth.py` (lines 126–165, 222–304) for login lockout, JWT rotation, and session management in Redis.

3. **Verify Phase 11 Security Headers & File Upload Constraints**:
   - Inspect `backend/app/main.py` (lines 54–63) for `SecurityHeadersMiddleware`.
   - Inspect `backend/app/api/v1/endpoints/files.py` (lines 19–38, 41–59) for MIME whitelist, magic byte validation, and pixel limit checks.
