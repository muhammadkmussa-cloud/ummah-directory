# Ummah Directory — Project Audit

**Date:** 2026-07-31
**Scope:** Full-stack review — FastAPI backend, React/TS frontend, Alembic migrations, Docker/Traefik infra, CI.
**Method:** Read the code directly and *verified* each finding (ran `ruff`, confirmed Dockerfile flags, traced `get_db()` commit behavior, etc.). A prior internal audit exists in `.agents/orchestrator/AUDIT_REPORT.md`; this report **corrects several inaccurate claims** in it (see §6).

---

## TL;DR

The architecture is solid and a lot of the security-critical plumbing is genuinely good (Argon2id, JWT rotation + blacklisting, signed webhooks, upload magic-byte checks, global soft-delete). But the project is **not production-ready right now** for two concrete reasons:

1. **The production Docker image does not build** (`backend/Dockerfile` uses an invalid pip flag).
2. **CI is red** — `ruff check` reports 762 errors and `ruff format --check` reports 95 files out of format, so the quality gate is failing.

There are also a few real logic bugs (token refresh is effectively broken once a session exists) and missing frontend route guards (`/admin` is reachable by anyone).

### Severity counts
- 🔴 Critical (production blockers): **2**
- 🟠 High: **3**
- 🟡 Medium: **8**
- 🔵 Low / hygiene: **6**

---

## 1. 🔴 Critical (production blockers)

### C1. Production `Dockerfile` fails to build — invalid pip flag
`backend/Dockerfile`:
```dockerfile
RUN pip install --no-cache-dirs -e .
```
`--no-cache-dirs` (plural) is **not a valid pip option** — pip errors with "no such option" and the layer fails. The dev Dockerfile correctly uses `--no-cache-dir` (singular). I verified this against real `pip`.
**Fix:** `pip install --no-cache-dir -e .`
**Impact:** Production image cannot be built, so prod deploys are blocked (or someone is bypassing the Dockerfile).

### C2. CI is failing on lint + formatting
The workflow (`.github/workflows/ci.yml`) runs `ruff check backend/` and `ruff format --check backend/`. I ran them with the project's own config (`backend/pyproject.toml`):
- `ruff check`: **762 errors** (top rules: `E501` ×144 line-length, `I001` ×84 unsorted imports, `B904` ×19, `E402` ×16, `F541` ×14, plus `ARG`, `UP`, `W`).
- `ruff format --check`: **95 files** would be reformatted.

277 of the lint errors are auto-fixable. Until these are resolved, every PR to `main` fails CI (or CI is being ignored, which is worse).
**Fix:** `ruff check --fix backend/ && ruff format backend/`, then review the remaining non-auto-fixable items.

---

## 2. 🟠 High

### H1. JWT refresh is effectively broken once a session exists
`backend/app/api/v1/endpoints/auth.py` → `refresh_token()`:
- On **login**, active sessions are stored as **JSON strings**: `json.dumps({"jti": ..., "ip": ..., "user_agent": ..., ...})`.
- On **refresh**, it does:
  ```python
  valid_sessions_decoded = [s if isinstance(s, str) else s.decode("utf-8") for s in valid_sessions]
  if valid_sessions_decoded and jti not in valid_sessions_decoded:
      raise HTTPException(401, "Session revoked due to concurrent login limit")
  ```
  `jti` is a bare string; every entry in `valid_sessions_decoded` is a **JSON blob**. So `jti not in [...]` is **always True**, and refresh returns 401 for any user that has ≥1 session entry.
- On refresh it then pushes the bare `jti` (`r_cli.lpush(sessions_key, new_payload["jti"])`), so the data format is inconsistent between login and refresh anyway.
**Impact:** Silent session invalidation — refresh tokens stop working after the first login writes a session. Users get logged out. **Fix:** store/compare consistently (e.g., a Redis set of raw `jti` values, or parse the JSON and compare `.jti`).

### H2. Sensitive frontend routes are not guarded
`frontend/src/App.tsx` — these routes render **without** an `<AuthRoute>` wrapper:
- `/admin` → `<AdminDashboard />` (anyone can load the admin UI)
- `/profile`, `/favorites`, `/my-organizations`, `/my-organizations/:id/staff`, `/my-organizations/:id/manage`
- `/owner/businesses/:id/manage`, `/charity/...`, `/mosque/...`, `/analytics`

The API enforces auth, so this is defense-in-depth + UX, but `/admin` exposing the admin shell to unauthenticated visitors is a real concern. **Fix:** wrap each protected route in `<AuthRoute>`.

### H3. Dead redirect → 404
`App.tsx`: `<Route path="/ads" element={<Navigate to="/owner/dashboard?tab=advertising" />} />` — there is **no** `/owner/dashboard` route defined anywhere, so this always 404s. `OwnerDashboard.tsx` is also imported nowhere. **Fix:** add the `/owner/dashboard` route (wiring `OwnerDashboard`) or change the redirect target.

---

## 3. 🟡 Medium

### M1. Only 5 of 27 endpoint modules are rate-limited
`@limiter.limit` appears only in `auth.py, businesses.py, charities.py, mosques.py, reviews.py`. **Not protected:** `files.py` (upload abuse), `payments.py` (intent/refund spam), `mfa.py` (`/verify` brute force), `search.py`, `donations.py`, `admin.py`, `users.py`, etc.
**Fix:** add limits to write/abuse-prone endpoints, especially `mfa/verify`, `files/upload`, `search`, and payment-creation paths.

### M2. `TrustedHostMiddleware` is effectively disabled in prod
`config.py`: `allowed_hosts: str = "*"`. `docker-compose.prod.yml` does **not** set `ALLOWED_HOSTS`, so the middleware allows any `Host` header (host-header injection / cache-poisoning surface). **Fix:** set `ALLOWED_HOSTS=your-domain.com` in prod env.

### M3. Fragile, inconsistent super-admin authorization
Two different mechanisms:
- `require_role(name)` (`dependencies.py`) checks the **role name**.
- `require_permission(codename)` checks whether a **permission codename** literally named `"super_admin"` is in the user's permission set.

They only line up because `seed_dev_data.py` happens to seed the `super_admin` *role* with a permission whose codename is also `"super_admin"`. This coupling is easy to break during refactoring and leads to subtle privilege issues. **Fix:** centralize the super-admin check (e.g., a single `is_super_admin(user)` helper used by both).

### M4. Over-permissive `registered_user` role in the seed
`backend/scripts/seed_dev_data.py` grants every registered user: `staff.invite`, `staff.remove`, `business.delete`, `mosque.delete`, `charity.delete`, `analytics.view_own`, `verification.submit`, `subscription.manage`, full `*.create/edit/delete` on every entity type… Granting `staff.invite`/`staff.remove` and org-wide `*.delete` to *every* user is a permissive RBAC design, and risky if this seed is ever run against a non-dev DB. **Fix:** scope delete/staff perms to owners/managers/admins, not `registered_user`.

### M5. Two independent Redis connection pools
`app/core/cache.py`, `app/services/token_service.py`, and inline code in `auth.py` each create their own `redis.from_url(...)` client (`_redis` globals). Extra connections, inconsistent `decode_responses`/timeout settings, and divergent error handling. **Fix:** a single shared Redis accessor.

### M6. Token blacklist / logout fail open when Redis is down
`token_service.is_token_blacklisted()` and `blacklist_token()` swallow all exceptions and return `False` / no-op. If Redis is unavailable, a logged-out/revoked token keeps working. Acceptable trade-off, but it should be **documented and monitored** (alert on blacklist-write failures), not silent.

### M7. `.gitignore` contradicts the committed migrations
`.gitignore` contains `alembic/versions/*.py` (with only `.gitkeep` whitelisted), yet 9 migration files are tracked (they were force-added). New migrations authors generate **won't be committed by default**, guaranteeing drift across devs/deployments. **Fix:** remove `alembic/versions/*.py` from `.gitignore` (keep migrations version-controlled).

### M8. Secrets/runtime/build artifacts committed to git
- `.agents/` — **77 files** of internal multi-agent scaffolding (audit reports, briefings, handoffs, the original request). Clutter that leaks internal process; should not ship in the repo.
- `backend/celerybeat-schedule` — Celery runtime schedule file (regenerated each run).
- `frontend/tsconfig.tsbuildinfo` — TS incremental-build cache.
- `.env.test` (repo root) — committed env file carrying the dev DB password (`.gitignore` ignores `.env` but not `.env.test`).
- Dev DB password also hardcoded in `docker-compose.yml` and `backend/alembic.ini`.

**Fix:** add these to `.gitignore` and `git rm --cached` them; template real secrets.

---

## 4. 🔵 Low / hygiene

- **L1. Thin service layer.** Business logic lives in 800+ line controllers (e.g., `admin.py`) while `services/` files are small. Hurts testability.
- **L2. Loose admin response models.** Many admin endpoints use `response_model=list`/`dict`, leaking internal DB columns and bypassing schema filtering.
- **L3. Frontend duplication.** `components/layout/AuthLayout.tsx` vs `features/auth/components/AuthLayout.tsx`, and two `SecuritySettings.tsx` copies. Accessibility gaps in `Modal`/`Input`/`Button`.
- **L4. SEO/loading gaps.** Most pages lack `<Helmet>` metadata and skeleton loaders.
- **L5. `files.py` upload:** no rate limit (M1) and the org/ownership binding of `resource_id` isn't validated against the caller — worth a review.
- **L6. `alembic.ini`** hardcodes a localhost dev URL as the fallback; `env.py` correctly prefers `DATABASE_URL`, so it's only cosmetic — but still worth templating.

---

## 5. ✅ What's done well (keep these)

- **Password hashing:** Argon2id with strong params (`time_cost=3`, `memory=64 MiB`, `parallelism=4`).
- **AuthN:** JWT access (15 min) + rotating refresh tokens, `jti`, Redis blacklist, login attempt lockout, MFA for admins, email/phone verification.
- **Security headers middleware:** HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy, and a CSP.
- **Webhooks:** all three gateways (Stripe, PayPal, M-Pesa) **verify signatures**, with Redis-based replay protection (7-day `nx` lock) and idempotency-key handling on intent creation.
- **Upload safety:** magic-byte validation, MIME allowlist, 10 MB + 50 Mpx caps, server-side image optimization + thumbnails.
- **Global soft-delete enforcement** at the ORM level (`database.py` event listener with `with_loader_criteria`) — see correction §6.
- **Docs:** substantial `SRS.md`, `BACKEND_API.md`, `TEST_ACCOUNTS.md`.
- **Test breadth:** 25 backend test files covering auth, payments, donations, search, MFA, etc.

---

## 6. Corrections to the prior `.agents/` audit

The internal audit in `.agents/orchestrator/AUDIT_REPORT.md` is detailed but contains a few **inaccurate** claims that I verified against the code:

| Prior claim | Verdict |
|---|---|
| "Endpoints in `events.py`/`favorites.py` omit `db.commit()`, silently discarding changes" | ❌ **Wrong.** `get_db()` (`core/database.py`) auto-commits after `yield`. No data is lost. |
| "Soft deletes not enforced; soft-deleted entities exposed to public APIs" | ❌ **Wrong.** A global ORM event listener enforces `deleted_at IS NULL` on every SELECT. Soft-deletes *are* globally applied (arguably too aggressively — it also wraps counts/subqueries). |
| "alembic.ini hardcodes localhost (production problem)" | ⚠️ **Overstated.** `env.py` overrides it with `DATABASE_URL`; the ini value is just a dev fallback. Low severity. |
| "Broken super-admin RBAC at dependencies.py:101" | ⚠️ **Partially.** It *works* given the current seed, but the role-name-vs-permission-codename coupling is fragile (M3). |

---

## 7. Recommended action plan (priority order)

1. **Fix the prod Dockerfile** flag (C1) — one-line change, unblocks deploys.
2. **Run `ruff check --fix && ruff format`** and clear the remaining lint errors (C2) — makes CI green.
3. **Fix the refresh-token session logic** (H1) — currently breaking logins.
4. **Add `<AuthRoute>` to `/admin` and other protected routes**; fix the `/ads` redirect (H2, H3).
5. **Set `ALLOWED_HOSTS` in prod** and add rate limits to `mfa/files/search/payments` (M1, M2).
6. **Tighten the `registered_user` permissions** and centralize the super-admin check (M3, M4).
7. **Repo hygiene:** `.gitignore` + `git rm --cached` for `.agents/`, `celerybeat-schedule`, `tsconfig.tsbuildinfo`, `.env.test`; un-ignore migrations (M7, M8).
8. Consolidate Redis pools and document the blacklist fail-open behavior (M5, M6).

---

*Audit produced by reading and verifying the code in this branch. Happy to implement any of the fixes above — the C1 and C2 one/two-step wins are the natural starting point.*
