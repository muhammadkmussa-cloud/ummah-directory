from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.analytics import AnalyticsEvent
from app.models.business import Business
from app.models.charity import Charity
from app.models.education import EducationalInstitution
from app.models.favorite import Favorite
from app.models.mosque import Mosque
from app.models.review import Review
from app.models.user import User
from app.schemas.common import MessageResponse
from app.services.audit_service import log_action

router = APIRouter()

ALLOWED_CLICK_TYPES = {"website", "phone", "whatsapp", "email", "direction"}


async def record_event(
    db: AsyncSession,
    event_type: str,
    resource_type: str,
    resource_id: str,
    user_id: str | None = None,
    business_id: str | None = None,
    metadata_json: dict | None = None,
):
    event = AnalyticsEvent(
        event_type=event_type,
        resource_type=resource_type,
        resource_id=resource_id,
        user_id=user_id,
        business_id=business_id,
        metadata_json=metadata_json,
    )
    db.add(event)
    await db.flush()
    return event


@router.post("/track/click/{business_id}")
async def track_click(
    business_id: str,
    click_type: str = "website",
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if click_type not in ALLOWED_CLICK_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid click type. Must be one of: {ALLOWED_CLICK_TYPES}")
    result = await db.execute(select(Business).where(Business.id == business_id))
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    await record_event(
        db, f"click.{click_type}", "business", business_id, str(user.id), business_id,
    )
    await log_action(db, user.id, f"analytics.click.{click_type}", "business", business_id)
    return {"message": "Tracked"}


@router.post("/track/directions/{business_id}")
async def track_directions(
    business_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Business).where(Business.id == business_id))
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    await record_event(db, "directions", "business", business_id, str(user.id), business_id)
    await log_action(db, user.id, "analytics.directions", "business", business_id)
    return {"message": "Tracked"}


@router.post("/track/search")
async def track_search(
    query: str,
    result_count: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await record_event(
        db, "search", "search", query, str(user.id),
        metadata_json={"query": query, "result_count": result_count},
    )
    return {"message": "Tracked"}


@router.get("/business/{business_id}")
async def business_analytics(
    business_id: str,
    user: User = Depends(get_current_user),
    _perm: User = Depends(require_permission("analytics.view_own")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Business).where(Business.id == business_id))
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    if str(business.owner_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your business")

    event_counts = {}
    for event_type in ["click.website", "click.phone", "click.directions", "search", "directions"]:
        count = await db.execute(
            select(func.count(AnalyticsEvent.id)).where(
                AnalyticsEvent.event_type == event_type,
                AnalyticsEvent.business_id == business_id,
            )
        )
        event_counts[event_type] = count.scalar() or 0

    total_views = business.view_count or 0
    review_count = business.review_count or 0
    avg_rating = float(business.avg_rating or 0)

    fav_count = await db.execute(
        select(func.count(Favorite.id)).where(
            Favorite.resource_type == "business",
            Favorite.resource_id == business_id,
        )
    )
    favorite_count = fav_count.scalar() or 0

    return {
        "total_views": total_views,
        "total_reviews": review_count,
        "average_rating": avg_rating,
        "favorite_count": favorite_count,
        "clicks": {
            "website": event_counts.get("click.website", 0),
            "phone": event_counts.get("click.phone", 0),
            "directions": (
                event_counts.get("click.directions", 0)
                + event_counts.get("directions", 0)
            ),
        },
        "search_impressions": event_counts.get("search", 0),
    }


@router.get("/resource/{resource_type}/{resource_id}")
async def resource_analytics(
    resource_type: str,
    resource_id: str,
    user: User = Depends(get_current_user),
    _perm: User = Depends(require_permission("analytics.view_own")),
    db: AsyncSession = Depends(get_db),
):
    if resource_type not in ("business", "mosque", "charity", "education"):
        raise HTTPException(status_code=400, detail="Invalid resource type")

    owner_id = None
    if resource_type == "business":
        result = await db.execute(select(Business).where(Business.id == resource_id))
        obj = result.scalar_one_or_none()
        if obj:
            owner_id = str(obj.owner_id)
    elif resource_type == "mosque":
        result = await db.execute(select(Mosque).where(Mosque.id == resource_id))
        obj = result.scalar_one_or_none()
        if obj:
            owner_id = str(obj.primary_admin_id)
    elif resource_type == "charity":
        result = await db.execute(select(Charity).where(Charity.id == resource_id))
        obj = result.scalar_one_or_none()
        if obj:
            owner_id = str(obj.primary_admin_id)
    elif resource_type == "education":
        result = await db.execute(select(EducationalInstitution).where(EducationalInstitution.id == resource_id))
        obj = result.scalar_one_or_none()
        if obj:
            owner_id = str(obj.primary_admin_id)
    else:
        obj = None

    if not obj:
        raise HTTPException(status_code=404, detail=f"{resource_type} not found")
    if owner_id != str(user.id):
        raise HTTPException(status_code=403, detail="Not your listing")

    event_counts = {}
    for event_type in ["click.website", "click.phone", "click.directions", "search", "directions"]:
        count = await db.execute(
            select(func.count(AnalyticsEvent.id)).where(
                AnalyticsEvent.event_type == event_type,
                AnalyticsEvent.resource_type == resource_type,
                AnalyticsEvent.resource_id == resource_id,
            )
        )
        event_counts[event_type] = count.scalar() or 0

    fav_count = await db.execute(
        select(func.count(Favorite.id)).where(
            Favorite.resource_type == resource_type,
            Favorite.resource_id == resource_id,
        )
    )

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    historical = await db.execute(
        select(
            func.date(AnalyticsEvent.created_at).label("date"),
            func.count(AnalyticsEvent.id).label("count")
        ).where(
            AnalyticsEvent.resource_type == resource_type,
            AnalyticsEvent.resource_id == resource_id,
            AnalyticsEvent.created_at >= thirty_days_ago
        ).group_by(func.date(AnalyticsEvent.created_at)).order_by("date")
    )
    
    historical_data = [{"date": str(row.date), "interactions": row.count} for row in historical.all()]

    view_count = getattr(obj, "view_count", 0) or 0
    review_count = getattr(obj, "review_count", 0) or 0
    avg_rating = float(getattr(obj, "avg_rating", 0) or 0)

    return {
        "total_views": view_count,
        "total_reviews": review_count,
        "average_rating": avg_rating,
        "favorite_count": fav_count.scalar() or 0,
        "clicks": {
            "website": event_counts.get("click.website", 0),
            "phone": event_counts.get("click.phone", 0),
            "directions": (
                event_counts.get("click.directions", 0)
                + event_counts.get("directions", 0)
            ),
        },
        "search_impressions": event_counts.get("search", 0),
        "historical_data": historical_data,
    }


@router.get("/owner/dashboard")
async def owner_dashboard(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    businesses_result = await db.execute(
        select(Business).where(Business.owner_id == user.id)
    )
    businesses = businesses_result.scalars().all()

    total_views = sum(b.view_count or 0 for b in businesses)
    total_reviews = sum(b.review_count or 0 for b in businesses)
    approved = sum(1 for b in businesses if b.status == "approved")
    pending = sum(1 for b in businesses if b.status == "pending")

    return {
        "total_businesses": len(businesses),
        "approved": approved,
        "pending": pending,
        "rejected": sum(1 for b in businesses if b.status == "rejected"),
        "total_views": total_views,
        "total_reviews": total_reviews,
        "average_rating": (
            sum(b.avg_rating or 0 for b in businesses) / approved
            if approved > 0 else 0
        ),
        "businesses": [
            {
                "id": str(b.id),
                "name": b.name,
                "slug": b.slug,
                "status": b.status,
                "views": b.view_count or 0,
                "reviews": b.review_count or 0,
                "rating": float(b.avg_rating or 0),
                "is_verified": b.is_verified,
                "is_premier": b.is_premier,
            }
            for b in businesses
        ],
    }


@router.get("/mosque/dashboard")
async def mosque_dashboard(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    mosques_result = await db.execute(
        select(Mosque).where(Mosque.primary_admin_id == user.id)
    )
    mosques = mosques_result.scalars().all()

    return {
        "total_mosques": len(mosques),
        "approved": sum(1 for m in mosques if m.status == "approved"),
        "pending": sum(1 for m in mosques if m.status == "pending"),
        "rejected": sum(1 for m in mosques if m.status == "rejected"),
        "mosques": [
            {
                "id": str(m.id),
                "name": m.name,
                "slug": m.slug,
                "status": m.status,
                "is_verified": m.is_verified,
                "city": m.city,
                "has_prayer_times": bool(m.prayer_times),
            }
            for m in mosques
        ],
    }


@router.get("/charity/dashboard")
async def charity_dashboard(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    charities_result = await db.execute(
        select(Charity).where(Charity.primary_admin_id == user.id)
    )
    charities = charities_result.scalars().all()

    from app.models.charity import CharityCampaign
    campaigns_result = await db.execute(
        select(CharityCampaign).where(
            CharityCampaign.charity_id.in_([c.id for c in charities])
        )
    )
    campaigns = campaigns_result.scalars().all()

    total_raised = sum((c.amount_raised or 0) for c in campaigns)
    total_target = sum((c.target_amount or 0) for c in campaigns)
    active_campaigns = sum(1 for c in campaigns if c.status == "active")

    return {
        "total_charities": len(charities),
        "approved": sum(1 for c in charities if c.status == "approved"),
        "pending": sum(1 for c in charities if c.status == "pending"),
        "rejected": sum(1 for c in charities if c.status == "rejected"),
        "total_campaigns": len(campaigns),
        "active_campaigns": active_campaigns,
        "total_raised": float(total_raised),
        "total_target": float(total_target),
        "charities": [
            {
                "id": str(c.id),
                "name": c.name,
                "slug": c.slug,
                "status": c.status,
                "is_verified": c.is_verified,
                "city": c.city,
            }
            for c in charities
        ],
    }


@router.get("/admin/overview")
async def admin_analytics_overview(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.core.dependencies import require_role
    await require_role("super_admin")(user=user)

    total_searches = await db.execute(
        select(func.count(AnalyticsEvent.id)).where(AnalyticsEvent.event_type == "search")
    )

    total_clicks = await db.execute(
        select(func.count(AnalyticsEvent.id)).where(AnalyticsEvent.event_type.like("click.%"))
    )

    top_businesses = await db.execute(
        select(Business.id, Business.name, Business.view_count)
        .where(Business.status == "approved")
        .order_by(Business.view_count.desc())
        .limit(10)
    )

    return {
        "total_searches": total_searches.scalar() or 0,
        "total_clicks": total_clicks.scalar() or 0,
        "top_listed_businesses": [
            {"id": str(r[0]), "name": r[1], "views": r[2]}
            for r in top_businesses.all()
        ],
    }
