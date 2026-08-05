# API Integration Implementation Sequence

## Overview
This document outlines the step-by-step implementation sequence to fix all API connection issues identified in the audit.

**Total Issues**: 229 (153 backend missing frontend + 76 frontend path mismatches)  
**Estimated Effort**: 40-50 hours  
**Priority Order**: Critical → High → Medium → Low

---

## Phase 1: Fix Path Prefix Mismatches (CRITICAL - 8 hours)

### Step 1.1: Update Backend Router Prefixes
**Files to modify**: All endpoint files in `/backend/app/api/v1/endpoints/`

**Action**: Add module-specific prefixes to match frontend expectations

```python
# Example for users.py - NO CHANGE NEEDED (already correct)
router = APIRouter()  # Routes are already at /me, /dashboard, etc.

# The router is included in router.py with prefix="/users"
# So /me becomes /api/v1/users/me ✅
```

**Verification**: Check `/backend/app/api/v1/router.py` to see how routers are mounted

### Step 1.2: Verify Router Configuration
**File**: `/backend/app/api/v1/router.py`

Expected structure:
```python
from fastapi import APIRouter
from .endpoints import auth, users, businesses, charities, mosques, events, education, favorites, follows, notifications, mfa, push, search, prayer_times, cms, analytics, admin, payments, donations, campaigns, organizations, posts, reviews, reports, appeals, advertisements, categories, files, seo, specialized, owner

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(businesses.router, prefix="/businesses", tags=["Businesses"])
# ... etc for all modules
```

**Action Required**: Ensure all routers are included with proper prefixes

### Step 1.3: Fix Missing Base Routes
Some modules have incomplete route definitions:

#### Notifications Module
**Issue**: Frontend calls `GET /notifications` but backend has no list endpoint

**Fix**: Add to `/backend/app/api/v1/endpoints/notifications.py`:
```python
@router.get("/", response_model=List[NotificationResponse])
async def list_notifications(
    skip: int = 0,
    limit: int = 20,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()
```

#### Favorites Module
**Issue**: Frontend calls `GET /favorites` and `POST /favorites` but backend only has DELETE

**Fix**: Add to `/backend/app/api/v1/endpoints/favorites.py`:
```python
@router.get("/", response_model=List[FavoriteResponse])
async def list_favorites(...):
    # Return user's favorites

@router.post("/{target_id}")
async def add_favorite(target_id: str, ...):
    # Add item to favorites
```

---

## Phase 2: Implement Missing Listing Endpoints (HIGH - 16 hours)

### Step 2.1: Business Listing
**File**: `/backend/app/api/v1/endpoints/businesses.py`

**Add**:
```python
@router.get("/", response_model=List[BusinessResponse])
async def list_businesses(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    city: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    # Query businesses with filters
    # Return paginated list
```

### Step 2.2: Charity Listing
**File**: `/backend/app/api/v1/endpoints/charities.py`

**Add**:
```python
@router.get("/", response_model=List[CharityResponse])
async def list_charities(...):
    # Similar to businesses
```

### Step 2.3: Mosque Listing
**File**: `/backend/app/api/v1/endpoints/mosques.py`

**Add**:
```python
@router.get("/", response_model=List[MosqueResponse])
async def list_mosques(...):
    # Similar pattern
```

### Step 2.4: Education Listing
**File**: `/backend/app/api/v1/endpoints/education.py`

**Add**:
```python
@router.get("/", response_model=List[EducationResponse])
async def list_education(...):
```

### Step 2.5: Events Listing
**File**: `/backend/app/api/v1/endpoints/events.py`

**Add**:
```python
@router.get("/", response_model=List[EventResponse])
async def list_events(...):
```

### Step 2.6: Appeals Creation
**File**: `/backend/app/api/v1/endpoints/appeals.py`

**Add**:
```python
@router.post("/", response_model=AppealResponse)
async def create_appeal(req: AppealCreateRequest, ...):
    # Create new appeal
```

### Step 2.7: Organization Posts
**File**: `/backend/app/api/v1/endpoints/posts.py`

**Add**:
```python
@router.get("/organizations/{org_id}/posts", response_model=List[PostResponse])
async def get_organization_posts(org_id: str, ...):
```

### Step 2.8: User Organizations
**File**: `/backend/app/api/v1/endpoints/users.py`

**Add**:
```python
@router.get("/me/organizations", response_model=List[OrganizationResponse])
async def get_my_organizations(user: User = Depends(get_current_user), ...):
```

### Step 2.9: Saved Events
**File**: `/backend/app/api/v1/endpoints/users.py`

**Add**:
```python
@router.get("/me/saved-events", response_model=List[EventResponse])
async def get_saved_events(user: User = Depends(get_current_user), ...):
```

### Step 2.10: Advertisement Feeds
**File**: `/backend/app/api/v1/endpoints/campaigns.py` or separate `advertisements.py`

**Add**:
```python
@router.get("/ads/feed", response_model=List[AdResponse])
async def get_ad_feed(...):

@router.get("/ads/spotlight", response_model=List[AdResponse])
async def get_spotlight_ads(...):
```

### Step 2.11: Follow Feed
**File**: `/backend/app/api/v1/endpoints/follows.py`

**Add**:
```python
@router.get("/feed", response_model=List[FeedItemResponse])
async def get_follow_feed(user: User = Depends(get_current_user), ...):
```

### Step 2.12: Blog/CMS Listing
**File**: `/backend/app/api/v1/endpoints/cms.py`

**Add**:
```python
@router.get("/blog", response_model=List[BlogPostResponse])
async def list_blog_posts(...):
```

### Step 2.13: Prayer Times Preferences
**File**: `/backend/app/api/v1/endpoints/prayer_times.py`

**Already exists**: `GET /me` and `PUT /me`
**Frontend issue**: Calling `/prayer-times/me` instead of `/me`

**Fix**: Update frontend OR add alias route in backend

### Step 2.14: Notification Preferences
**File**: `/backend/app/api/v1/endpoints/notifications.py`

**Add**:
```python
@router.get("/preferences", response_model=NotificationPreferences)
async def get_preferences(user: User = Depends(get_current_user), ...):

@router.put("/preferences", response_model=NotificationPreferences)
async def update_preferences(req: NotificationPreferencesUpdate, ...):
```

### Step 2.15: Review Creation
**File**: `/backend/app/api/v1/endpoints/reviews.py`

**Add**:
```python
@router.post("/organization/{organization_id}", response_model=ReviewResponse)
async def create_review(organization_id: str, req: ReviewCreateRequest, ...):
```

---

## Phase 3: Implement Admin & Payment Features (MEDIUM - 12 hours)

### Step 3.1: Payment Methods Management
**File**: `/backend/app/api/v1/endpoints/payments.py`

**Ensure these exist**:
- `GET /methods` - List payment methods
- `POST /methods` - Add payment method
- `DELETE /methods/{id}` - Remove payment method

### Step 3.2: Campaign Management
**File**: `/backend/app/api/v1/endpoints/campaigns.py`

**Ensure these exist**:
- `POST /campaigns/{id}/activate`
- `POST /campaigns/{id}/pause`
- `POST /campaigns/{id}/resume`
- `POST /campaigns/{id}/cancel`
- `POST /campaigns/{id}/renew`

### Step 3.3: MFA Endpoints
**File**: `/backend/app/api/v1/endpoints/mfa.py`

**Ensure these exist**:
- `GET /status` - Check MFA status
- `POST /setup` - Setup MFA
- `POST /verify` - Verify MFA code
- `POST /disable` - Disable MFA

### Step 3.4: Push Notifications
**File**: `/backend/app/api/v1/endpoints/push.py`

**Ensure these exist**:
- `GET /vapid-public-key`
- `POST /subscribe`
- `POST /unsubscribe`

---

## Phase 4: Frontend Path Corrections (LOW - 4 hours)

### Step 4.1: Update API Client Calls
**Files**: All frontend files making API calls

**Pattern**: Change from `/module/endpoint` to `/endpoint` if backend router has prefix

Example:
```typescript
// ❌ Wrong (double prefix)
api.get('/users/me')

// ✅ Correct (backend adds /users prefix)
api.get('/me')
```

OR keep frontend paths and ensure backend router configuration matches.

---

## Phase 5: Testing & Validation (4 hours)

### Step 5.1: Create Integration Tests
**File**: `/backend/tests/test_api_integration.py`

Test each endpoint:
- Status code 200/201
- Response schema validation
- Authentication requirements
- Permission checks

### Step 5.2: Manual Testing Checklist
- [ ] Auth flow (register, login, logout)
- [ ] User profile CRUD
- [ ] Business listing and detail
- [ ] Charity listing and donations
- [ ] Mosque listing and prayer times
- [ ] Event listing and registration
- [ ] Favorites add/remove
- [ ] Follow/unfollow organizations
- [ ] Notifications list and mark read
- [ ] MFA setup and verification
- [ ] Push notification subscription
- [ ] Admin dashboard access
- [ ] Payment method management
- [ ] Campaign creation and management

---

## Implementation Order Summary

1. **Day 1**: Router configuration verification + Path prefix fixes
2. **Day 2**: Listing endpoints (businesses, charities, mosques, events, education)
3. **Day 3**: User-specific endpoints (organizations, saved events, preferences)
4. **Day 4**: Social features (favorites, follows, reviews, appeals)
5. **Day 5**: Content feeds (ads, blog, notifications)
6. **Day 6**: Admin & payment features
7. **Day 7**: Testing and bug fixes

---

## Success Criteria

✅ All 167 backend endpoints accessible from frontend  
✅ Zero 404 errors in browser console  
✅ All frontend pages load with real data  
✅ Authentication flow works end-to-end  
✅ Admin dashboard fully functional  
✅ Payment processing operational  

