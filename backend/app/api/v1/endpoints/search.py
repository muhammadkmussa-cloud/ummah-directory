from typing import Any

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import case, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_get, cache_set
from app.core.database import get_db
from app.core.rate_limit import limiter
from app.models.ad_campaign import AdCampaign
from app.models.business import Business, BusinessBranch
from app.models.charity import Charity
from app.models.education import EducationalInstitution
from app.models.event import Event
from app.models.mosque import Mosque
from app.schemas.business import BusinessResponse

router = APIRouter()

from sqlalchemy import or_


def apply_full_text_search(query_builder, model, q_str: str):
    if q_str and q_str.strip():
        term = f"%{q_str.strip()}%"
        conditions = []
        if hasattr(model, "name"):
            conditions.append(model.name.ilike(term))
        if hasattr(model, "title"):
            conditions.append(model.title.ilike(term))
        if hasattr(model, "description"):
            conditions.append(model.description.ilike(term))
        if hasattr(model, "mission_statement"):
            conditions.append(model.mission_statement.ilike(term))
        if hasattr(model, "venue"):
            conditions.append(model.venue.ilike(term))
        if conditions:
            query_builder = query_builder.where(or_(*conditions))
    return query_builder


@router.get("")
@limiter.limit("30/minute")
async def search_all(
    request: Request,
    q: str = Query(""),
    type: str | None = Query(None, pattern="^(business|mosque|charity|education|event)$"),
    category: str | None = None,
    city: str | None = None,
    verified: bool | None = None,
    premier: bool | None = None,
    min_rating: float | None = Query(None, ge=1.0, le=5.0),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    cache_key = (
        f"search:{q}:{type}:{category}:{city}:{verified}:{premier}:{min_rating}:{page}:{size}"
    )
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached

    results: dict[str, list[Any]] = {
        "businesses": [],
        "mosques": [],
        "charities": [],
        "events": [],
        "education": [],
    }
    offset_val = (page - 1) * size

    if not type or type == "business":
        qb = select(Business).where(Business.status == "approved")
        qb = apply_full_text_search(qb, Business, q)
        if category:
            qb = qb.where(Business.category_id == category)
        if city:
            qb = qb.where(Business.city.ilike(f"%{city}%"))
        if verified is not None:
            qb = qb.where(Business.is_verified == verified)
        if premier is not None:
            qb = qb.where(Business.is_premier == premier)
        if min_rating is not None:
            qb = qb.where(Business.avg_rating >= min_rating)

        if not q:
            active_featured_sq = (
                select(AdCampaign.organization_id)
                .where(
                    AdCampaign.campaign_type == "featured_listing",
                    AdCampaign.status == "active",
                    AdCampaign.start_date <= func.now(),
                    AdCampaign.end_date >= func.now(),
                    AdCampaign.deleted_at.is_(None),
                )
                .scalar_subquery()
            )
            qb = qb.order_by(
                case((Business.id.in_(active_featured_sq), 0), else_=1),
                Business.is_premier.desc(),
                Business.avg_rating.desc(),
            )

        qb = qb.offset(offset_val).limit(size)
        result = await db.execute(qb)
        businesses = result.scalars().all()

        featured_org_ids: set[str] = set()
        if businesses:
            biz_ids = [str(b.id) for b in businesses]
            f_result = await db.execute(
                select(AdCampaign.organization_id).where(
                    AdCampaign.organization_id.in_(biz_ids),
                    AdCampaign.campaign_type == "featured_listing",
                    AdCampaign.status == "active",
                    AdCampaign.start_date <= func.now(),
                    AdCampaign.end_date >= func.now(),
                    AdCampaign.deleted_at.is_(None),
                )
            )
            featured_org_ids = {str(row[0]) for row in f_result.all() if row[0]}

        for b in businesses:
            results["businesses"].append(
                BusinessResponse(
                    id=str(b.id),
                    name=b.name,
                    slug=b.slug,
                    description=b.description,
                    email=b.email,
                    phone=b.phone,
                    whatsapp=b.whatsapp,
                    website=b.website,
                    address=b.address,
                    city=b.city,
                    country=b.country,
                    latitude=b.latitude,
                    longitude=b.longitude,
                    logo_url=b.logo_url,
                    cover_image_url=b.cover_image_url,
                    avg_rating=b.avg_rating,
                    review_count=b.review_count,
                    is_verified=b.is_verified,
                    is_premier=b.is_premier,
                    is_featured=str(b.id) in featured_org_ids,
                    status=b.status,
                    category_id=str(b.category_id),
                    created_at=b.created_at,
                )
            )

    if not type or type == "mosque":
        qm = select(Mosque).where(Mosque.status == "approved")
        qm = apply_full_text_search(qm, Mosque, q)
        if city:
            qm = qm.where(Mosque.city.ilike(f"%{city}%"))
        if min_rating is not None:
            qm = qm.where(Mosque.avg_rating >= min_rating)
        qm = qm.offset(offset_val).limit(size)
        result = await db.execute(qm)
        results["mosques"] = [
            {
                "id": str(m.id),
                "name": m.name,
                "slug": m.slug,
                "address": m.address,
                "city": m.city,
                "latitude": m.latitude,
                "longitude": m.longitude,
            }
            for m in result.scalars().all()
        ]

    if not type or type == "charity":
        qc = select(Charity).where(Charity.status == "approved")
        qc = apply_full_text_search(qc, Charity, q)
        if city:
            qc = qc.where(Charity.city.ilike(f"%{city}%"))
        if min_rating is not None:
            qc = qc.where(Charity.avg_rating >= min_rating)
        qc = qc.offset(offset_val).limit(size)
        result = await db.execute(qc)
        results["charities"] = [
            {
                "id": str(c.id),
                "name": c.name,
                "slug": c.slug,
                "mission_statement": c.mission_statement,
                "city": c.city,
                "is_verified": c.is_verified,
            }
            for c in result.scalars().all()
        ]

    if not type or type == "education":
        qedu = select(EducationalInstitution).where(EducationalInstitution.status == "approved")
        qedu = apply_full_text_search(qedu, EducationalInstitution, q)
        if city:
            qedu = qedu.where(EducationalInstitution.city.ilike(f"%{city}%"))
        if min_rating is not None:
            qedu = qedu.where(EducationalInstitution.avg_rating >= min_rating)
        qedu = qedu.offset(offset_val).limit(size)
        result = await db.execute(qedu)
        results["education"] = [
            {
                "id": str(e.id),
                "name": e.name,
                "slug": e.slug,
                "institution_type": e.institution_type,
                "city": e.city,
                "is_verified": e.is_verified,
            }
            for e in result.scalars().all()
        ]

    if not type or type == "event":
        qe = select(Event).where(Event.status == "published")
        qe = apply_full_text_search(qe, Event, q)
        if category:
            qe = qe.where(Event.category == category)
        if not q:
            qe = qe.order_by(Event.event_date.asc())
        qe = qe.offset(offset_val).limit(size)
        result = await db.execute(qe)
        results["events"] = [
            {
                "id": str(e.id),
                "title": e.title,
                "slug": e.slug,
                "event_date": str(e.event_date) if e.event_date else None,
                "event_time": str(e.event_time) if e.event_time else None,
                "venue": e.venue,
                "category": e.category,
            }
            for e in result.scalars().all()
        ]

    await cache_set(cache_key, results, ttl=120)
    return results


@router.get("/suggestions")
@limiter.limit("30/minute")
async def suggestions(
    request: Request,
    q: str = Query("", min_length=2),
    limit: int = Query(8, le=20),
    db: AsyncSession = Depends(get_db),
):
    results = []
    # Use ILIKE for quick suggestions since tsvector doesn't handle partial words
    # well without prefix matching
    for model, name_attr, slug_attr, type_name in [
        (Business, Business.name, Business.slug, "business"),
        (Mosque, Mosque.name, Mosque.slug, "mosque"),
        (Charity, Charity.name, Charity.slug, "charity"),
        (
            EducationalInstitution,
            EducationalInstitution.name,
            EducationalInstitution.slug,
            "education",
        ),
    ]:
        query = (
            select(model)
            .where(
                model.status.in_(["approved", "published"]),
                name_attr.ilike(f"{q}%"),
            )
            .limit(limit)
        )
        result = await db.execute(query)
        for item in result.scalars().all():
            results.append(
                {
                    "type": type_name,
                    "name": getattr(item, name_attr.key),
                    "slug": getattr(item, slug_attr.key),
                }
            )
    return results[:limit]


@router.get("/nearby")
@limiter.limit("20/minute")
async def nearby_search(
    request: Request,
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius: float = Query(10.0, ge=0.1, le=100.0),
    type: str | None = Query(None, pattern="^(business|mosque|charity|education|event)$"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    cache_key = f"nearby:{lat}:{lng}:{radius}:{type}:{page}:{size}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached

    results: dict[str, list[dict]] = {
        "businesses": [],
        "mosques": [],
        "charities": [],
        "education": [],
        "events": [],
    }
    offset_val = (page - 1) * size

    # Haversine distance (meters) — no PostGIS dependency
    earth_radius = 6371000

    def st_distance(mlng, mlat):
        dlat = func.radians(lat - mlat)
        dlon = func.radians(lng - mlng)
        a = func.sin(dlat / 2) * func.sin(dlat / 2) + func.cos(func.radians(mlat)) * func.cos(
            func.radians(lat)
        ) * func.sin(dlon / 2) * func.sin(dlon / 2)
        c = 2 * func.atan2(func.sqrt(a), func.sqrt(func.greatest(0, 1 - a)))
        return earth_radius * c

    if not type or type == "business":
        branch_sq = (
            select(
                BusinessBranch.business_id,
                func.min(st_distance(BusinessBranch.longitude, BusinessBranch.latitude)).label(
                    "min_branch_dist"
                ),
            )
            .where(BusinessBranch.latitude.isnot(None), BusinessBranch.longitude.isnot(None))
            .group_by(BusinessBranch.business_id)
            .subquery()
        )

        b_dist = st_distance(Business.longitude, Business.latitude)

        distance_m = func.least(
            func.coalesce(b_dist, 999999999), func.coalesce(branch_sq.c.min_branch_dist, 999999999)
        )

        qb = (
            select(Business, distance_m.label("distance"))
            .outerjoin(branch_sq, branch_sq.c.business_id == Business.id)
            .where(Business.status == "approved", distance_m <= radius * 1000)
            .order_by(text("distance ASC"))
            .offset(offset_val)
            .limit(size)
        )

        result = await db.execute(qb)
        for row in result.all():
            b, dist = row[0], row[1]
            results["businesses"].append(
                {
                    "id": str(b.id),
                    "name": b.name,
                    "slug": b.slug,
                    "address": b.address,
                    "city": b.city,
                    "latitude": b.latitude,
                    "longitude": b.longitude,
                    "distance_km": round(dist / 1000.0, 2),
                    "is_premier": b.is_premier,
                    "is_featured": False,
                    "avg_rating": b.avg_rating,
                }
            )

    if not type or type == "mosque":
        qm = (
            select(Mosque, st_distance(Mosque.longitude, Mosque.latitude).label("distance"))
            .where(
                Mosque.status == "approved",
                Mosque.latitude.isnot(None),
                Mosque.longitude.isnot(None),
                st_distance(Mosque.longitude, Mosque.latitude) <= radius * 1000,
            )
            .order_by(text("distance ASC"))
            .offset(offset_val)
            .limit(size)
        )
        result = await db.execute(qm)
        for row in result.all():
            m, dist = row[0], row[1]
            results["mosques"].append(
                {
                    "id": str(m.id),
                    "name": m.name,
                    "slug": m.slug,
                    "address": m.address,
                    "city": m.city,
                    "latitude": m.latitude,
                    "longitude": m.longitude,
                    "distance_km": round(dist / 1000.0, 2),
                }
            )

    if not type or type == "charity":
        qch = (
            select(Charity, st_distance(Charity.longitude, Charity.latitude).label("distance"))
            .where(
                Charity.status == "approved",
                Charity.latitude.isnot(None),
                Charity.longitude.isnot(None),
                st_distance(Charity.longitude, Charity.latitude) <= radius * 1000,
            )
            .order_by(text("distance ASC"))
            .offset(offset_val)
            .limit(size)
        )
        result = await db.execute(qch)
        for row in result.all():
            c, dist = row[0], row[1]
            results["charities"].append(
                {
                    "id": str(c.id),
                    "name": c.name,
                    "slug": c.slug,
                    "city": c.city,
                    "latitude": c.latitude,
                    "longitude": c.longitude,
                    "distance_km": round(dist / 1000.0, 2),
                    "is_verified": c.is_verified,
                }
            )

    if not type or type == "education":
        qedu = (
            select(
                EducationalInstitution,
                st_distance(
                    EducationalInstitution.longitude, EducationalInstitution.latitude
                ).label("distance"),
            )
            .where(
                EducationalInstitution.status == "approved",
                EducationalInstitution.latitude.isnot(None),
                EducationalInstitution.longitude.isnot(None),
                st_distance(EducationalInstitution.longitude, EducationalInstitution.latitude)
                <= radius * 1000,
            )
            .order_by(text("distance ASC"))
            .offset(offset_val)
            .limit(size)
        )
        result = await db.execute(qedu)
        for row in result.all():
            e, dist = row[0], row[1]
            results["education"].append(
                {
                    "id": str(e.id),
                    "name": e.name,
                    "slug": e.slug,
                    "address": e.address,
                    "city": e.city,
                    "latitude": e.latitude,
                    "longitude": e.longitude,
                    "distance_km": round(dist / 1000.0, 2),
                }
            )

    if not type or type == "event":
        qe = (
            select(Event, st_distance(Event.longitude, Event.latitude).label("distance"))
            .where(
                Event.status == "published",
                Event.latitude.isnot(None),
                Event.longitude.isnot(None),
                st_distance(Event.longitude, Event.latitude) <= radius * 1000,
            )
            .order_by(text("distance ASC"))
            .offset(offset_val)
            .limit(size)
        )
        result = await db.execute(qe)
        for row in result.all():
            e, dist = row[0], row[1]
            results["events"].append(
                {
                    "id": str(e.id),
                    "title": e.title,
                    "slug": e.slug,
                    "venue": e.venue,
                    "event_date": e.event_date,
                    "latitude": e.latitude,
                    "longitude": e.longitude,
                    "distance_km": round(dist / 1000.0, 2),
                }
            )

    await cache_set(cache_key, results, ttl=120)
    return results
