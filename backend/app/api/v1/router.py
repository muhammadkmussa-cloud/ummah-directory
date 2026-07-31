from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    advertisements,
    analytics,
    appeals,
    auth,
    businesses,
    campaigns,
    categories,
    charities,
    cms,
    donations,
    education,
    events,
    favorites,
    files,
    follows,
    mfa,
    mosques,
    notifications,
    organizations,
    owner,
    payments,
    posts,
    prayer_times,
    push,
    reports,
    reviews,
    search,
    seo,
    specialized,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(campaigns.router, prefix="", tags=["Campaigns"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
api_router.include_router(files.router, prefix="/files", tags=["Files"])
api_router.include_router(businesses.router, prefix="/businesses", tags=["Businesses"])
api_router.include_router(mosques.router, prefix="/mosques", tags=["Mosques"])
api_router.include_router(charities.router, prefix="/charities", tags=["Charities"])
api_router.include_router(education.router, prefix="/education", tags=["Education"])
api_router.include_router(mfa.router, prefix="/mfa", tags=["MFA"])
api_router.include_router(events.router, prefix="/events", tags=["Events"])
api_router.include_router(posts.router, prefix="", tags=["Posts"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
api_router.include_router(donations.router, prefix="/donations", tags=["Donations"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(prayer_times.router, prefix="/prayer-times", tags=["Prayer Times"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(push.router, prefix="/push", tags=["Push"])
api_router.include_router(favorites.router, prefix="/favorites", tags=["Favorites"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(advertisements.router, prefix="/advertisements", tags=["Advertisements"])
api_router.include_router(follows.router, prefix="/follows", tags=["Follows"])
api_router.include_router(appeals.router, prefix="/appeals", tags=["Appeals"])

api_router.include_router(cms.router, prefix="/cms", tags=["CMS"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(owner.router, prefix="/owner", tags=["Owner"])
api_router.include_router(seo.router, prefix="", tags=["SEO"])
api_router.include_router(specialized.router, prefix="", tags=["Specialized Orgs"])
