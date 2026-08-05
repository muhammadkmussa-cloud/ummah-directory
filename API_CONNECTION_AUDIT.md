# API Connection Audit Report

## Executive Summary

**Total Backend Endpoints**: 167  
**Frontend API Calls Found**: 89  
**Properly Connected**: 14 (16%)  
**Backend Missing Frontend**: 153 endpoints  
**Frontend Missing Backend**: 76 calls with path mismatches

---

## 🔴 Critical Issues

### 1. Path Prefix Mismatches

The frontend is calling paths that don't match backend routes:

| Frontend Call | Expected Backend Route | Issue |
|--------------|----------------------|-------|
| `GET /users/me` | `GET /me` (users.py) | Missing `/users` prefix in backend |
| `GET /admin/dashboard` | `GET /dashboard` (admin.py) | Missing `/admin` prefix |
| `GET /admin/categories` | `GET /categories` (admin.py) | Missing `/admin` prefix |
| `POST /admin/categories` | `POST /categories` (admin.py) | Missing `/admin` prefix |
| `GET /analytics/admin/overview` | `GET /admin/overview` (analytics.py) | Wrong path structure |
| `GET /analytics/owner/dashboard` | `GET /owner/dashboard` (analytics.py) | Wrong path structure |
| `GET /cms/blog` | `GET /blog` (cms.py) | Missing `/cms` prefix |
| `GET /cms/banners` | `GET /banners` (cms.py) | Missing `/cms` prefix |
| `GET /notifications` | `GET /` (notifications.py - missing route) | No list endpoint |
| `GET /favorites` | `DELETE /{id}` only | Missing GET endpoint |
| `POST /favorites` | No POST endpoint | Missing create endpoint |
| `GET /follows/feed` | `GET /feed` (follows.py) | Missing `/follows` prefix |
| `GET /prayer-times/me` | `GET /me` (prayer_times.py) | Missing `/prayer-times` prefix |
| `GET /search/suggestions` | `GET /suggestions` (search.py) | Missing `/search` prefix |
| `GET /search/nearby` | `GET /nearby` (search.py) | Missing `/search` prefix |
| `GET /mfa/status` | `GET /status` (mfa.py) | Missing `/mfa` prefix |
| `POST /mfa/setup` | `POST /setup` (mfa.py) | Missing `/mfa` prefix |
| `GET /push/vapid-public-key` | `GET /vapid-public-key` (push.py) | Missing `/push` prefix |
| `POST /auth/logout` | `POST /logout` (auth.py) | Missing `/auth` prefix |
| `POST /auth/login` | `POST /login` (auth.py) | Missing `/auth` prefix |

### 2. Completely Missing Backend Endpoints

These frontend features have NO corresponding backend endpoints:

| Feature | Frontend Component | Needed Endpoint |
|---------|------------------|-----------------|
| Appeals Creation | AppealPage.tsx | `POST /appeals` |
| Business Listing | BusinessListPage.tsx | `GET /businesses` |
| Charity Listing | CharityListPage.tsx, DonationPage.tsx | `GET /charities` |
| Education Listing | EducationListPage.tsx | `GET /education` |
| Events Listing | EventsPage.tsx | `GET /events` |
| Mosque Listing | MosqueListPage.tsx | `GET /mosques` |
| Organization Posts | OrganizationPostsTab.tsx | `GET /organizations/:id/posts` |
| User Organizations | MyOrganizations.tsx | `GET /users/me/organizations` |
| Review Creation | ReviewSheet.tsx | `POST /organization/:id/reviews` |
| Saved Events | DashboardPage.tsx, EventDetailPage.tsx | `GET /users/me/saved-events` |
| Advertisement Feed | HomePage.tsx, CategoryDetailPage.tsx | `GET /ads/feed`, `GET /ads/spotlight` |
| Follow Feed | FollowFeed.tsx | `GET /follows/feed` |
| Favorites List | FavoriteButton.tsx, FavoritesPage.tsx | `GET /favorites`, `POST /favorites` |
| Blog List | BlogListPage.tsx | `GET /cms/blog` |
| Prayer Times | PrayerTimesPreferences.tsx | `GET /prayer-times/me`, `PUT /prayer-times/me` |
| Notification Preferences | NotificationPreferencesPage.tsx | `GET /notifications/preferences` |
| Campaign Wizard | CampaignWizard.tsx | Multiple analytics endpoints |

### 3. Backend Endpoints With NO Frontend Implementation

Critical admin and user features not exposed in UI:

#### Admin Features (High Priority)
- `GET /admin/users` - User management
- `POST /users/{id}/suspend` - Suspend users
- `PUT /users/{id}/role` - Change user roles
- `GET /admin/claims` - Claim approvals
- `POST /claims/{id}/approve` - Approve claims
- `POST /claims/{id}/reject` - Reject claims
- `GET /admin/reports` - Content reports
- `POST /reports/{id}/resolve` - Resolve reports
- `GET /admin/audit-logs` - Security audit trail
- `POST /verification-documents/{id}/approve` - Verify businesses
- `POST /verification-documents/{id}/reject` - Reject verification

#### Payment Features
- `POST /payments/create-intent` - Create payment intent
- `POST /payments/{id}/refund` - Process refunds
- `GET /payments/methods` - List payment methods
- `POST /payments/methods` - Add payment method
- `DELETE /payments/methods/{id}` - Remove payment method

#### Campaign Management
- `POST /campaigns/{id}/activate` - Activate campaigns
- `POST /campaigns/{id}/pause` - Pause campaigns
- `POST /campaigns/{id}/resume` - Resume campaigns
- `POST /campaigns/{id}/cancel` - Cancel campaigns
- `POST /campaigns/{id}/renew` - Renew campaigns

#### MFA/Security
- `GET /mfa/status` - Check MFA status
- `POST /mfa/setup` - Setup MFA
- `POST /mfa/verify` - Verify MFA code
- `POST /mfa/disable` - Disable MFA

#### Push Notifications
- `GET /push/vapid-public-key` - Get VAPID key
- `POST /push/subscribe` - Subscribe to push
- `POST /push/unsubscribe` - Unsubscribe

---

## 📋 Remediation Plan

### Phase 1: Fix Path Prefixes (Week 1)
**Priority**: CRITICAL - Blocks all API communication

1. **Update Backend Routers** - Add proper prefixes to match frontend expectations
2. **OR Update Frontend** - Remove prefixes from API calls

**Recommendation**: Update backend to use `/api/v1/{module}` prefix pattern for consistency

### Phase 2: Implement Missing Backend Endpoints (Weeks 2-3)
**Priority**: HIGH - Required for core functionality

Create these endpoints:
- `GET /businesses` - List all businesses
- `GET /charities` - List all charities  
- `GET /mosques` - List all mosques
- `GET /education` - List educational institutions
- `GET /events` - List events
- `GET /favorites` - Get user favorites
- `POST /favorites` - Add to favorites
- `GET /follows/feed` - Get followed content feed
- `GET /users/me/organizations` - Get user's organizations
- `GET /users/me/saved-events` - Get saved events

### Phase 3: Build Missing Frontend Integrations (Weeks 3-4)
**Priority**: MEDIUM - Enhance user experience

Create UI components for:
- Admin user management
- Payment method management
- Campaign activation/pause controls
- MFA setup flow
- Push notification preferences
- Verification document upload/status

### Phase 4: Testing & Validation (Week 5)
- Integration testing for all endpoints
- End-to-end testing of critical flows
- API documentation generation

---

## 🎯 Immediate Actions Required

1. **Decide on URL structure convention** (prefix on backend vs frontend)
2. **Fix auth endpoints** - currently completely broken
3. **Add listing endpoints** for businesses, charities, mosques, events
4. **Implement favorites system** (backend + frontend)
5. **Create admin dashboard connections**

