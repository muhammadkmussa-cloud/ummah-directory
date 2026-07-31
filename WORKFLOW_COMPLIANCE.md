# Ummah Directory — Workflow Compliance Audit

**Spec:** `workflows.md` v2.0 (Production Specification) — 35 workflows
**Method:** Each workflow traced to its backend models, endpoints (`backend/app/api/v1/endpoints/`), services, frontend pages, and the router (`router.py`). Status is verified against code, not assumed.

**Legend:** ✅ Implemented · 🟡 Partial · ❌ Missing

---

## Summary

| # | Workflow | Status | Notes |
|---|----------|:------:|-------|
| 1 | Guest User Journey | ✅ | Public browse/search; protected actions enforce auth. (Frontend "return to original page after auth" is a UX nicety to confirm.) |
| 2 | User Registration | ✅ | `auth.py` register + email verify gate. |
| 3 | Login Workflow | 🟡 | Works, **but the refresh-token/session bug breaks persistent login** (see prior `AUDIT.md` H1). |
| 4 | Forgot Password | ✅ | Signed, time-limited reset tokens. |
| 5 | Email Verification | ✅ | `verify-email`; welcome email template exists. |
| 6 | Organization Registration | 🟡 | Flow exists, **but only 4 of the 11 spec'd categories are implemented.** |
| 7 | Organization Verification | ✅ | Approve/reject with reason, status field, verification badge. |
| 8 | Moderator Review Workflow | ✅ | Approve / reject / suspend / restore / escalate + role change + pending-edit approvals. ("Request Changes" is approximated by reject-with-reason + edit-approval flow.) |
| 9 | Super Admin Workflow | ✅ | Users, orgs, ads, payments, reports, categories, settings, analytics, audit logs. |
| 10 | Organization Owner Workflow | ✅ | `owner.py`, org management. |
| 11 | Business Management | ✅ | `businesses.py`. |
| 12 | Mosque Management | ✅ | `mosques.py` + prayer times + subscriptions. |
| 13 | Charity Management | ✅ | `charities.py` + campaigns + reports. |
| 14 | Education Institution | ✅ | `education.py`. |
| 15 | **Hospital Workflow** | ❌ | **No `Hospital` entity type.** |
| 16 | **Hotel & Restaurant Workflow** | ❌ | **No distinct `Hotel`/`Restaurant` types** (folded into generic Business). |
| 17 | Advertisement Workflow | ✅ | Ads + campaigns + payment + moderator approval + analytics. |
| 18 | Payment Workflow | ✅ | M-Pesa / Stripe / PayPal, signed webhooks, receipts. |
| 19 | Donation Workflow | ✅ | Donate + payment + receipt. |
| 20 | Event Workflow | ✅ | Events + save-event + reminder task (reminder scheduling is a Celery task — verify beat is wired). |
| 21 | Review Workflow | ✅ | Spam/profanity check, owner reply, 30-min edit window, status. |
| 22 | Favorite Workflow | ✅ | `favorites.py` + collections. |
| 23 | **Follow Workflow** | ❌ | **No org follow at all** (only mosque *prayer* subscription exists; that's a different feature). |
| 24 | Search Workflow | ✅ | `search.py` keyword/category/location/filters. |
| 25 | Notification Workflow | 🟡 | In-app + email. **No push notifications** (spec lists push first). |
| 26 | Profile Management | ✅ | `users.py` profile fields + preferences. |
| 27 | File Upload Workflow | ✅ | Validation + magic-byte check + S3 + thumbnail. (Virus scan correctly marked "future" in spec.) |
| 28 | Account Suspension | 🟡 | `toggle_user_suspend` exists; **the "appeal" option is not implemented.** |
| 29 | Organization Suspension | 🟡 | `suspend_organization` exists; **no appeal path.** |
| 30 | **Appeals Workflow** | ❌ | **No appeal model/endpoint anywhere.** |
| 31 | Reporting Workflow | ✅ | `reports.py` (org/post/review/ad) + moderator decisions. |
| 32 | Analytics Workflow | ✅ | `analytics.py` dashboards. |
| 33 | Audit Logging | ✅ | `audit_service` + `log_action(...)` across endpoints. |
| 34 | Error Handling | ✅ | Global exception handler; structured per-error messages partial. |
| 35 | Future Workflows | N/A | Out of scope by definition. (Note: i18n / multi-language already partially exists in frontend.) |

**Totals:** ✅ Implemented ~22 · 🟡 Partial ~5 · ❌ Missing 4 (+ the 11→4 category gap)

---

## ❌ Missing workflows (functional gaps)

### M1. Follow Workflow (#23) — completely absent
The spec defines Follow as distinct from Favorite: *follow an organization → its posts appear in the Home Feed → receive updates → unfollow anytime.* The codebase has **no follow model, endpoint, or follower count**. Only `MosquePrayerSubscription` exists, which is specifically for prayer-time notifications, not the general follow/feed relationship.
**Build:** `OrganizationFollow` model (`follower_id`, `organization_id`, unique), follow/unfollow endpoints, follower/following counts on org, and a Home Feed query that prioritizes followed-org posts (the feed the spec references in #22/#23/#10).

### M2. Appeals Workflow (#30) — completely absent
Suspension (#28/#29) and report decisions can happen, but there is **no appeal model or endpoint** — a `grep` for "appeal" across the entire `app/` tree returns nothing. The spec explicitly requires "Appeal option available" after suspension and a dedicated Appeals review queue.
**Build:** `Appeal` model (`target_type` user/org/report, `target_id`, `submitted_by`, `reason`, `status` pending/reviewed/approved/rejected), submit-appeal endpoint (used by suspended users/owners), and moderator endpoints to review/approve/reject appeals with notifications.

### M3. Hospital, Hotel & Restaurant entity types (#15, #16) — not implemented
The spec (#6) lists **11 organization categories**: Business, Mosque, School, Hospital, Restaurant, Hotel, NGO, Charity, Government, Community Centre, Other. The polymorphic model only defines **4** identities: `business`, `mosque`, `charity`, `educational_institution`. The frontend wizard offers only Business / Mosque / Charity(NGO) / Education. Restaurants/clinics are collapsed under "Business", but the spec treats Hospital (#15) and Hotel & Restaurant (#16) as first-class workflows with their own fields (departments, emergency contacts, rooms, menus, facilities).
**Build:** add `Hospital`, `Hotel`, `Restaurant` (and optionally NGO, Government, Community Centre) polymorphic subtypes with their specific fields + endpoints + frontend wizard steps.

---

## 🟡 Partial workflows

### P1. Organization categories (11 → 4)
See M3 above. This is the single largest *functional* divergence from the Production Specification and underpins workflows #6, #15, #16.

### P2. Notification delivery (#25) — no push
`notification_service.py` delivers via **email + in-app only**. The spec requires **Push Notification** as the first channel, with email and in-app as fallbacks. There is no FCM/APNs/Web Push integration (and SMS, though an `sms_service` exists, is only used for phone verification).
**Build:** a push provider (Web Push / FCM), device-token model, and a `push` channel branch in `notification_service` respecting `NotificationPreference`.

### P3. Login persistence (#3)
Carry-over from `AUDIT.md` H1: the refresh-token/session comparison is broken, so "Generate JWT → load dashboard" works on first login but **refresh fails once a session is written**, logging users out. Fixing this is a prerequisite for the Login workflow passing the spec.

### P4. Suspension appeal path (#28, #29)
The suspend/unsuspend + hide-from-directory actions exist, but the "appeal option available" half depends on M2.

---

## ⚠️ Cross-cutting issues affecting multiple workflows

These come from `AUDIT.md` but matter for workflow correctness:

- **Rate limiting** (spec Principle: "Validate all input", and #21 spam, #18/#19 payment abuse): only 5 of 27 modules are rate-limited. Registration (#2), Login (#3), Upload (#27), Payment (#18), Review (#21) are all abuse-exposed.
- **RBAC fragility** (spec Principle: "Follow RBAC rules"): the super-admin check is split between role-name and permission-codename logic (`AUDIT.md` M3) and the seed grants `registered_user` broad perms (`AUDIT.md` M4).
- **Audit logging** (#33) is strong and broadly applied ✅.

---

## Recommended priority

1. **Fix Login persistence** (P3) — refresh-token bug — unblocks the core authenticated experience.
2. **Add Follow** (M1) — small, self-contained, high user value; unlocks the Home Feed.
3. **Add Appeals** (M2) — completes the moderation/suspension loop the spec mandates.
4. **Add push notifications** (P2) — closes the #25 delivery gap.
5. **Add Hospital / Hotel / Restaurant types** (M3) — largest effort; aligns the taxonomy with the Production Specification.

---

*Compliance assessed against `workflows.md` v2.0 by tracing each workflow to code in this branch. I can implement any of the gaps — Follow and Appeals are the fastest wins and I can start on either now.*
