# Umma Directory API — Full Endpoint Reference

**Base URL:** `/api/v1`  
**Framework:** FastAPI (Python 3.11+, async)  
**Auth:** JWT (access 15min + refresh 7d), Argon2 hashing, Redis blacklisting  
**ORM:** SQLAlchemy 2.x + asyncpg (PostgreSQL)  
**Payments:** Stripe, PayPal, M-Pesa  
**Cache/Queue:** Redis  
**API Docs (dev):** `/api/docs` (Swagger), `/api/redoc` (ReDoc)

---

## Auth (`/api/v1/auth`)

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/register` | No | 5/min | Register new user (email+password). Creates NotificationPreference. Sends verification email. |
| POST | `/verify-email` | No | — | Verify email via token sent to inbox (24h expiry) |
| POST | `/resend-verification` | No | — | Resend email verification link |
| POST | `/login` | No | 10/min | Email/password login. Lockout after 5 failed attempts (15 min). Returns JWT pair + user profile. |
| POST | `/refresh` | No | 10/min | Rotate refresh token for new access+refresh tokens. Checks session validity. |
| POST | `/logout` | Yes | — | Blacklist current access token, remove session from Redis |
| POST | `/forgot-password` | No | 3/min | Send password reset email with timed token (1 hour) |
| POST | `/reset-password` | No | 5/min | Reset password using token from email |
| POST | `/send-phone-verification` | Yes | 3/min | Send 6-digit SMS code to phone (Redis, 5-min TTL) |
| POST | `/verify-phone` | Yes | 5/min | Confirm phone with SMS code |

---

## Users (`/api/v1/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | Yes | Get current user profile (with role + permissions) |
| PATCH | `/me` | Yes | Update profile fields (name, phone, email, language, photos, bio, city, country). Email change triggers re-verification. |
| POST | `/change-password` | Yes | Change password (validates current password, blacklists current token) |
| GET | `/dashboard` | Yes | Aggregated user dashboard: stats (favorites, reviews, donations, orgs, notifications, claims, campaigns) + recent notifications + recent donations + owned organizations |
| POST | `/me/deactivate` | Yes | Soft-deactivate account (`is_active=False`) |
| GET | `/me/sessions` | Yes | List active sessions from Redis |
| POST | `/me/sessions/logout-all` | Yes | Blacklist all sessions except current |
| GET | `/me/login-history` | Yes | Paginated login audit log |
| GET | `/me/saved-events` | Yes | List user's saved events |
| GET | `/me/organizations` | Yes | List owned + managed organizations |

---

## Organizations (`/api/v1/organizations`)

| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/` | No | — | List approved organizations. Filterable by type, city, country, verified, search. Sortable. Paginated. |
| GET | `/{slug}` | No | — | Get single organization by slug. Increments view count. |
| PUT | `/{id}` | Yes | — | Update organization (owner or manager with editor role) |
| DELETE | `/{id}` | Yes | — | Delete organization (owner only) |
| GET | `/{id}/media` | No | — | List media files for an organization (filter by image/document) |
| GET | `/{id}/manager` | Yes | — | Get current manager of an organization |
| POST | `/{id}/manager` | Yes | `staff.invite` | Assign manager by email |
| DELETE | `/{id}/manager` | Yes | `staff.remove` | Remove manager |
| POST | `/{id}/claim` | Yes | — | Submit ownership claim (email must be verified) |

---

## Categories (`/api/v1/categories`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | List all active categories as a tree (parent-child, multi-language names: EN/AR/SW) |
| GET | `/{slug}` | No | Get single category with children |

---

## Search (`/api/v1/search`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | Full-text search across businesses, mosques, charities, education, events. Cacheable (120s TTL). Filterable by type, category, city, verified, premier, min_rating. |
| GET | `/suggestions` | No | Quick autocomplete suggestions (ILIKE prefix match) across all types (min 2 chars) |
| GET | `/nearby` | No | Geo-spatial search via Haversine distance calculation. Returns results within radius (km). |

---

## Files (`/api/v1/files`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/upload` | Yes | Upload file to S3. Supports JPEG/PNG/WEBP/PDF (max 10MB). Validates magic bytes. Auto-generates thumbnails for images. Optimizes/resizes images. Stores `MediaFile` record. |

---

## Businesses (`/api/v1/businesses`)

| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/` | No | — | List approved businesses. Filterable by category, city, country, verified, halal_certified, premier, search. Sortable. Paginated. Includes `is_featured` flag from active ad campaigns. |
| GET | `/{slug}` | No | — | Get single business (slug or UUID). Increments view count. |
| POST | `/` | Yes+perm | `business.create` | Create a new business (status=pending). Rate-limited 5/min. |
| PUT | `/{id}` | Yes | `business.edit` | Update business. Major field changes on approved business trigger pending edit review. |
| GET | `/{id}/branches` | No | — | List active branches of a business |
| POST | `/{id}/branches` | Yes | — | Create a branch for owned business |
| POST | `/{id}/claim` | Yes | — | Submit ownership claim |
| POST | `/{id}/verification-documents` | Yes | `verification.submit` | Upload verification documents (business_license, tax_certificate, id_document, other) |
| GET | `/{id}/verification-status` | Yes | — | Get verification document status |
| POST | `/{id}/premier` | Yes | `subscription.manage` | Purchase premier subscription (KES 999). Creates payment intent via Stripe/PayPal/M-Pesa. |
| POST | `/{id}/premier/confirm` | Yes | `subscription.manage` | Confirm premier subscription after payment success |
| POST | `/{id}/deactivate` | Yes | `business.delete` | Soft-deactivate a business |

---

## Mosques (`/api/v1/mosques`)

| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/` | No | — | List approved mosques. Filter by city, search. Paginated. |
| GET | `/{slug}` | No | — | Get single mosque (slug or UUID) |
| POST | `/` | Yes | `mosque.create` | Create a mosque (status=pending, rate-limited 5/min) |
| PUT | `/{id}` | Yes | `mosque.edit` | Update mosque (owner or primary_admin) |
| DELETE | `/{id}` | Yes | `mosque.delete` | Soft-delete mosque |
| GET | `/{id}/admins` | No | — | List mosque admins |
| POST | `/{id}/admins` | Yes | `staff.invite` | Add admin to mosque |
| DELETE | `/{id}/admins/{admin_id}` | Yes | `staff.remove` | Remove mosque admin |
| GET | `/{id}/subscribe-prayer` | Yes | — | Check if user is subscribed to prayer time updates |
| POST | `/{id}/subscribe-prayer` | Yes | — | Toggle prayer time subscription |
| GET | `/{id}/subscribers` | Yes | — | List prayer subscribers (admin only) |
| PUT | `/{id}/prayer-times` | Yes | — | Update prayer times (admin only) |

---

## Charities (`/api/v1/charities`)

| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/` | No | — | List approved charities. Filter by verified, search. Paginated. |
| GET | `/{slug}` | No | — | Get single charity with its campaigns |
| POST | `/` | Yes | `charity.create` | Create a charity (status=pending, rate-limited 5/min) |
| PUT | `/{id}` | Yes | `charity.edit` | Update charity (owner or primary_admin) |
| DELETE | `/{id}` | Yes | `charity.delete` | Soft-delete charity |
| GET | `/{charity_id}/campaigns` | No | — | List charity campaigns |
| POST | `/{charity_id}/campaigns` | Yes | — | Create a campaign for owned charity |
| PUT | `/{charity_id}/campaigns/{campaign_id}` | Yes | — | Update campaign |
| DELETE | `/{charity_id}/campaigns/{campaign_id}` | Yes | — | Soft-delete campaign |
| POST | `/{charity_id}/campaigns/{campaign_id}/pause` | Yes | — | Pause campaign |
| POST | `/{charity_id}/campaigns/{campaign_id}/complete` | Yes | — | Complete campaign |

---

## Education (`/api/v1/education`)

| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/` | No | — | List approved educational institutions. Filter by type, city, search. Paginated. |
| GET | `/{slug}` | No | — | Get single institution |
| POST | `/` | Yes | `education.create` | Create institution (status=pending) |
| PUT | `/{id}` | Yes | `education.edit` | Update institution |
| DELETE | `/{id}` | Yes | `education.delete` | Soft-delete institution |

---

## Events (`/api/v1/events`)

| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/` | No | — | List published events. Filter by category, organizer_id. Sort by date. Paginated. |
| GET | `/{slug}` | No | — | Get single event (slug or UUID) |
| POST | `/` | Yes | `event.create` | Create event |
| PUT | `/{id}` | Yes | `event.edit` | Update event (owner only) |
| DELETE | `/{id}` | Yes | `event.delete` | Soft-delete event |
| POST | `/{id}/save` | Yes | — | Save event to user's saved events |
| DELETE | `/{id}/save` | Yes | — | Unsave event |
| POST | `/{id}/register` | Yes | — | Register/RSVP for event (increments registration_count) |
| GET | `/{id}/calendar` | No | — | Download .ics calendar file for event |

---

## Posts (`/api/v1`) — mounted at root + `/organizations/{org_id}/posts`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/organizations/{org_id}/posts` | Optional | List published posts for an organization. Includes `is_liked_by_me` if user is authenticated. |
| POST | `/organizations/{org_id}/posts` | Yes | Create a post for owned/admin organization |
| POST | `/posts/{post_id}/like` | Yes | Toggle like on a post |
| DELETE | `/posts/{post_id}` | Yes | Delete post (author or admin) |

---

## Reviews (`/api/v1/reviews`)

| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/organization/{organization_id}` | No | — | List published reviews for an organization. Paginated. Includes owner reply. |
| POST | `/organization/{organization_id}` | Yes | `review.create` | Create review (rate-limited 10/min). Spam/profanity filter. Auto-updates org avg_rating and review_count. |
| PUT | `/{id}` | Yes | `review.edit` | Edit own review (within 30-min window) |
| POST | `/{id}/reply` | Yes | `review.respond` | Organization owner replies to review |
| DELETE | `/{id}` | Yes | — | Soft-delete own review (within 24-hour window) |

---

## Donations (`/api/v1/donations`)

| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| POST | `/initiate` | Yes | `donation.create` | Initiate a donation (to campaign or organization). Validates minimum amount. Uses idempotency key. Creates payment intent. |
| POST | `/{id}/confirm` | Yes | — | Confirm donation after payment success. Updates campaign amount_raised. Sends receipt email + notification. |
| GET | `/history` | Yes | — | User's donation history (paginated) |
| GET | `/{id}/receipt/pdf` | Yes | — | Download donation receipt as PDF |
| GET | `/{id}/receipt` | Yes | — | Get donation receipt JSON |
| GET | `/campaign/{campaign_id}` | No | — | List completed donations for a campaign (paginated, anonymized) |
| GET | `/stats` | Yes | — | Get total donation count and sum |

---

## Payments (`/api/v1/payments`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/create-intent` | Yes | Create generic payment intent (Stripe/PayPal/M-Pesa). Supports idempotency key header. |
| GET | `/{id}` | Yes | Get payment details |
| POST | `/{gateway}/webhook` | No | Payment gateway webhook receiver. Uses Redis for deduplication (7-day window). Updates payment status. |
| POST | `/{id}/refund` | Yes | Refund a succeeded payment (cannot refund if linked to completed donation) |
| GET | `/{id}/invoice` | Yes | Download PDF invoice for succeeded payment |
| GET | `/methods` | Yes | List user's saved payment methods |
| POST | `/methods` | Yes | Save a payment method (Stripe/PayPal) |
| DELETE | `/methods/{id}` | Yes | Remove saved payment method |

---

## Prayer Times (`/api/v1/prayer-times`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | Yes | Get current user's personal prayer time settings |
| PUT | `/me` | Yes | Update user's personal prayer time settings |

---

## Notifications (`/api/v1/notifications`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Yes | List user's notifications (paginated) |
| PATCH | `/{id}/read` | Yes | Mark single notification as read |
| PATCH | `/read-all` | Yes | Mark all notifications as read |
| DELETE | `/{id}` | Yes | Soft-delete a notification |
| GET | `/preferences` | Yes | Get user's notification preferences |
| PUT | `/preferences` | Yes | Update notification preferences |

---

## Favorites (`/api/v1/favorites`)

| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/` | Yes | — | List user's favorites (searchable by org name, paginated) |
| POST | `/` | Yes | `favorite.create` | Add organization to favorites |
| DELETE | `/{id}` | Yes | `favorite.delete` | Remove favorite |
| GET | `/feed` | Yes | — | Feed of posts from favorited organizations (paginated) |
| GET | `/collections` | Yes | — | List user's favorite collections |
| POST | `/collections` | Yes | — | Create a collection |
| DELETE | `/collections/{id}` | Yes | — | Delete collection |
| POST | `/{id}/move` | Yes | — | Move favorite to a collection |

---

## Reports (`/api/v1/reports`)

| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| POST | `/` | Yes | `report.create` | Submit a report (spam/offensive/incorrect/duplicate/other/fraud/closed/scam) for resource types: business, mosque, charity, education, event, review |

---

## Advertisements (`/api/v1/advertisements`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | List active approved ads (filterable by placement) |
| POST | `/` | Yes | Create an advertisement (status=pending) |
| POST | `/{id}/impression` | No | Track ad impression |
| POST | `/{id}/click` | No | Track ad click |

---

## Ad Campaigns (`/api/v1`) — mounted at root + `/organizations/{org_id}/campaigns`

| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/organizations/{org_id}/campaigns` | Yes | — | List ad campaigns for an organization |
| GET | `/owner/campaigns` | Yes | — | List ad campaigns across all user's organizations |
| POST | `/organizations/{org_id}/campaigns` | Yes | `campaign.create` | Create ad campaign (draft). Validates date ranges. Checks for duplicate featured_listing. |
| GET | `/campaigns/{id}` | Yes | — | Get single campaign |
| PUT | `/campaigns/{id}` | Yes | — | Update draft campaign |
| POST | `/campaigns/{id}/submit` | Yes | — | Submit campaign for review (draft → pending_review) |
| POST | `/campaigns/{id}/pay` | Yes | — | Initiate payment for campaign |
| POST | `/campaigns/{id}/activate` | Yes | — | Activate campaign (requires succeeded payment) |
| POST | `/campaigns/{id}/pause` | Yes | — | Pause active campaign |
| POST | `/campaigns/{id}/resume` | Yes | — | Resume paused campaign |
| POST | `/campaigns/{id}/cancel` | Yes | — | Cancel campaign |
| POST | `/campaigns/{id}/renew` | Yes | — | Renew campaign (extend end date) |
| DELETE | `/campaigns/{id}` | Yes | — | Delete draft campaign |
| GET | `/ads/feed` | No | — | Get random feed ads (active, campaign_type=feed_ad) |
| GET | `/ads/spotlight` | No | — | Get random category spotlight ad |
| POST | `/campaigns/{id}/impression` | No | — | Track ad campaign impression |
| POST | `/campaigns/{id}/click` | No | — | Track ad campaign click |

---

## CMS (`/api/v1/cms`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/pages/{slug}` | No | Get published CMS page |
| GET | `/banners` | No | List active banners (filterable by placement) |
| GET | `/blog` | No | List published blog posts |
| GET | `/blog/{slug}` | No | Get single blog post |

---

## Admin (`/api/v1/admin`) — all endpoints require MFA check

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/dashboard` | moderator | Aggregated counts: users, businesses, mosques, charities, education + pending counts + pending reports + pending claims |
| GET | `/users` | super_admin | List all users (paginated) |
| POST | `/users/{id}/suspend` | super_admin | Toggle user active/suspended |
| PUT | `/users/{id}/role` | super_admin | Change user role |
| GET | `/organizations` | moderator | List all organizations (filterable by status) |
| GET | `/organizations/pending` | moderator | List pending organizations |
| POST | `/organizations/{id}/approve` | moderator | Approve organization (sends notification to owner) |
| POST | `/organizations/{id}/reject` | moderator | Reject organization with reason |
| POST | `/organizations/{id}/suspend` | moderator | Suspend organization |
| POST | `/organizations/{id}/restore` | moderator | Restore suspended organization |
| GET | `/businesses/pending-edits` | moderator | List businesses with pending changes |
| POST | `/businesses/{id}/approve-edit` | moderator | Approve and apply pending business edits |
| POST | `/businesses/{id}/reject-edit` | moderator | Reject pending business edits |
| GET | `/verification-documents` | moderator | List pending verification documents |
| POST | `/verification-documents/{id}/approve` | moderator | Approve verification document (sets org verified) |
| POST | `/verification-documents/{id}/reject` | moderator | Reject verification document with reason |
| GET | `/reviews` | moderator | List all reviews |
| POST | `/reviews/{id}/remove` | moderator | Remove a review (sets status=removed) |
| POST | `/reviews/{id}/restore` | moderator | Restore a removed review |
| GET | `/claims` | moderator | List pending ownership claims |
| POST | `/claims/{id}/approve` | moderator | Approve claim (transfers ownership) |
| POST | `/claims/{id}/reject` | moderator | Reject claim |
| GET | `/reports` | moderator | List pending reports |
| POST | `/reports/{id}/resolve` | moderator | Resolve report (actions: dismissed, warning, content_removed, user_suspended, escalated) |
| GET | `/audit-logs` | super_admin | List audit logs (paginated) |
| GET | `/categories` | moderator | List all categories (admin view) |
| POST | `/categories` | moderator | Create category |
| PUT | `/categories/{id}` | moderator | Update category |
| DELETE | `/categories/{id}` | super_admin | Soft-delete category |
| GET | `/cms-pages` | moderator | List all CMS pages |
| POST | `/cms-pages` | moderator | Create CMS page |
| PUT | `/cms-pages/{id}` | moderator | Update CMS page |
| DELETE | `/cms-pages/{id}` | super_admin | Soft-delete CMS page |
| GET | `/advertisements/pending` | moderator | List pending advertisements |
| POST | `/advertisements/{id}/approve` | moderator | Approve advertisement |
| POST | `/advertisements/{id}/reject` | moderator | Reject advertisement |
| GET | `/campaigns` | moderator | List all ad campaigns (filterable by status, paginated) |
| POST | `/campaigns/{id}/approve` | moderator | Approve ad campaign (pending_review → active) |
| POST | `/campaigns/{id}/reject` | moderator | Reject ad campaign |
| GET | `/payment-providers` | super_admin | List payment providers |
| POST | `/payment-providers` | super_admin | Create/update payment provider |

---

## Analytics (`/api/v1/analytics`)

| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| POST | `/track/click/{business_id}` | Yes | — | Track a click event (website, phone, whatsapp, email, direction) |
| POST | `/track/directions/{business_id}` | Yes | — | Track directions request |
| POST | `/track/search` | Yes | — | Track a search query |
| GET | `/business/{business_id}` | Yes | `analytics.view_own` | Get analytics for owned business |
| GET | `/resource/{resource_type}/{resource_id}` | Yes | `analytics.view_own` | Get analytics for owned resource (business, mosque, charity, education). Includes 30-day historical data. |
| GET | `/owner/dashboard` | Yes | — | Owner dashboard with summary stats for all owned businesses |
| GET | `/mosque/dashboard` | Yes | — | Mosque admin dashboard |
| GET | `/charity/dashboard` | Yes | — | Charity admin dashboard (includes campaign stats) |
| GET | `/admin/overview` | super_admin | — | High-level platform analytics (total searches, clicks, top businesses) |

---

## Owner (`/api/v1/owner`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard/stats` | Yes | Aggregated owner dashboard stats (total businesses, views, reviews, avg rating) |

---

## MFA (`/api/v1/mfa`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/setup` | Yes | Generate TOTP secret & provisioning URI (requires password confirmation) |
| POST | `/verify` | Yes | Verify TOTP code & enable MFA |
| POST | `/disable` | Yes | Disable MFA (requires password + TOTP code) |
| GET | `/status` | Yes | Get MFA enabled/disabled status |

---

## SEO (`/api/v1`) — no auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/robots.txt` | No | Static robots.txt (allows all, points to sitemap) |
| GET | `/sitemap.xml` | No | Dynamic sitemap XML with all approved/published entities |

---

## Health (`/api`) — no auth, no `/api/v1` prefix

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health check returning `{ status: "ok", version: "1.0.0" }` |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total endpoint files | 28 |
| Total unique route paths | ~160+ |
| Total API routers mounted | 26 (including health) |
| HTTP methods used | GET (most), POST, PUT, PATCH, DELETE |
| Database models | 30 |
| Pydantic schemas | 18 |
| Service modules | 7 |
| Payment gateways | 3 (Stripe, PayPal, M-Pesa) |
| Middleware layers | 6 |
| Rate-limited endpoints | 9 |
| Admin-only endpoints | ~40 |
| Public (no auth) endpoints | ~20 |

---

## Permission System

Roles are defined in the database (`Role` + `Permission`). Permission codenames used across endpoint guards:

| Permission | Used In |
|------------|---------|
| `staff.invite` | Organization manager assign, mosque admin add |
| `staff.remove` | Organization manager remove, mosque admin remove |
| `campaign.create` | Ad campaign creation |
| `business.create` | Business creation |
| `business.edit` | Business update |
| `business.delete` | Business deactivation |
| `mosque.create` | Mosque creation |
| `mosque.edit` | Mosque update |
| `mosque.delete` | Mosque deletion |
| `charity.create` | Charity creation |
| `charity.edit` | Charity update |
| `charity.delete` | Charity deletion |
| `education.create` | Education institution creation |
| `education.edit` | Education institution update |
| `education.delete` | Education institution deletion |
| `event.create` | Event creation |
| `event.edit` | Event update |
| `event.delete` | Event deletion |
| `review.create` | Review creation |
| `review.edit` | Review update |
| `review.respond` | Reply to review |
| `favorite.create` | Add favorite |
| `favorite.delete` | Remove favorite |
| `report.create` | Submit report |
| `donation.create` | Initiate donation |
| `verification.submit` | Upload verification documents |
| `subscription.manage` | Purchase/confirm premier subscription |
| `analytics.view_own` | View own analytics |
| `super_admin` | Built-in bypass for all permission checks |

Roles encountered in the codebase: `registered_user`, `super_admin`, `moderator`.

---

## Middleware Stack

1. CORSMiddleware
2. SecurityHeadersMiddleware (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP)
3. SlowAPIMiddleware (rate limiting)
4. TrustedHostMiddleware
5. Logging middleware (request duration, method, path, status, IP)
6. Global exception handler (500 catch-all)
