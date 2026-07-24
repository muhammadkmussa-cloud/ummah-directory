from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_email_verified, require_permission
from app.core.rate_limit import limiter
from app.models.mosque import Mosque
from app.models.organization import OrganizationManager
from app.models.prayer_subscription import MosquePrayerSubscription
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.mosque import MosqueCreate, MosqueResponse, MosqueUpdate, MosquePrayerTimesUpdate
from app.services.audit_service import log_action
from app.services.notification_service import create_notification

router = APIRouter()


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-").replace("/", "-")[:200]


@router.get("", response_model=PaginatedResponse)
async def list_mosques(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    city: str | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Mosque).where(Mosque.status == "approved")
    if city:
        query = query.where(Mosque.city.ilike(f"%{city}%"))
    if search:
        query = query.where(
            or_(Mosque.name.ilike(f"%{search}%"), Mosque.description.ilike(f"%{search}%"))
        )
    query = query.order_by(Mosque.created_at.desc())

    total_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(total_q)).scalar() or 0
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    mosques = result.scalars().all()

    return PaginatedResponse(
        items=[{
            "id": str(m.id), "name": m.name, "slug": m.slug,
            "description": m.description, "address": m.address,
            "city": m.city, "latitude": m.latitude, "longitude": m.longitude,
            "imam_name": m.imam_name, "is_verified": m.is_verified,
            "has_women_facilities": m.has_women_facilities,
            "has_parking": m.has_parking, "created_at": m.created_at,
        } for m in mosques],
        total=total, page=page, size=size, pages=(total + size - 1) // size,
    )


import uuid

@router.get("/{slug}", response_model=MosqueResponse)
async def get_mosque(slug: str, db: AsyncSession = Depends(get_db)):
    try:
        m_id = uuid.UUID(slug)
        stmt = select(Mosque).where(or_(Mosque.id == m_id, Mosque.slug == slug))
    except ValueError:
        stmt = select(Mosque).where(Mosque.slug == slug)

    result = await db.execute(stmt)
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Mosque not found")
    return MosqueResponse(
        id=str(m.id), name=m.name, slug=m.slug,
        description=m.description, email=m.email,
        phone=m.phone, website=m.website,
        address=m.address, city=m.city, country=m.country,
        latitude=m.latitude, longitude=m.longitude,
        imam_name=m.imam_name, logo_url=m.logo_url,
        cover_image_url=m.cover_image_url,
        is_verified=m.is_verified, status=m.status,
        prayer_times=m.prayer_times, facilities=m.facilities,
        has_women_facilities=m.has_women_facilities,
        has_parking=m.has_parking,
        has_children_facilities=m.has_children_facilities,
        is_wheelchair_accessible=m.is_wheelchair_accessible,
        created_at=m.created_at,
    )


@router.post("", response_model=MosqueResponse, status_code=201)
@limiter.limit("5/minute")
async def create_mosque(
    req: MosqueCreate,
    request: Request,
    user: User = Depends(get_current_user),
    _email: User = Depends(require_email_verified()),
    _perm: User = Depends(require_permission("mosque.create")),
    db: AsyncSession = Depends(get_db),
):
    base_slug = slugify(req.name)
    slug = base_slug
    counter = 1
    while True:
        existing = await db.execute(select(Mosque).where(Mosque.slug == slug))
        if not existing.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    mosque = Mosque(
        name=req.name, slug=slug,
        description=req.description, email=req.email,
        phone=req.phone, website=req.website,
        address=req.address, city=req.city, country=req.country or "Kenya",
        latitude=req.latitude, longitude=req.longitude,
        imam_name=req.imam_name,
        has_women_facilities=req.has_women_facilities,
        has_parking=req.has_parking,
        has_children_facilities=req.has_children_facilities,
        is_wheelchair_accessible=req.is_wheelchair_accessible,
        prayer_times=req.prayer_times, facilities=req.facilities,
        primary_admin_id=user.id, status="pending",
    )
    db.add(mosque)
    await db.flush()
    await log_action(db, user.id, "mosque.create", "mosque", str(mosque.id))

    return MosqueResponse(
        id=str(mosque.id), name=mosque.name, slug=mosque.slug,
        description=mosque.description, email=mosque.email,
        phone=mosque.phone, website=mosque.website,
        address=mosque.address, city=mosque.city, country=mosque.country,
        latitude=mosque.latitude, longitude=mosque.longitude,
        imam_name=mosque.imam_name,
        has_women_facilities=mosque.has_women_facilities,
        has_parking=mosque.has_parking,
        has_children_facilities=mosque.has_children_facilities,
        is_wheelchair_accessible=mosque.is_wheelchair_accessible,
        prayer_times=mosque.prayer_times, facilities=mosque.facilities,
        is_verified=mosque.is_verified, status=mosque.status,
        created_at=mosque.created_at,
    )


@router.put("/{id}", response_model=MosqueResponse)
async def update_mosque(
    id: str,
    req: MosqueUpdate,
    user: User = Depends(get_current_user),
    _email: User = Depends(require_email_verified()),
    _perm: User = Depends(require_permission("mosque.edit")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Mosque).where(Mosque.id == id))
    mosque = result.scalar_one_or_none()
    if not mosque:
        raise HTTPException(status_code=404, detail="Mosque not found")
    if str(mosque.primary_admin_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your mosque")

    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(mosque, field, value)

    await log_action(db, user.id, "mosque.update", "mosque", id)
    return MosqueResponse(
        id=str(mosque.id), name=mosque.name, slug=mosque.slug,
        description=mosque.description, email=mosque.email,
        phone=mosque.phone, website=mosque.website,
        address=mosque.address, city=mosque.city, country=mosque.country,
        latitude=mosque.latitude, longitude=mosque.longitude,
        imam_name=mosque.imam_name, logo_url=mosque.logo_url,
        cover_image_url=mosque.cover_image_url,
        is_verified=mosque.is_verified, status=mosque.status,
        prayer_times=mosque.prayer_times, facilities=mosque.facilities,
        has_women_facilities=mosque.has_women_facilities,
        has_parking=mosque.has_parking,
        has_children_facilities=mosque.has_children_facilities,
        is_wheelchair_accessible=mosque.is_wheelchair_accessible,
        created_at=mosque.created_at,
    )


@router.delete("/{id}", response_model=MessageResponse)
async def delete_mosque(
    id: str,
    user: User = Depends(get_current_user),
    _perm: User = Depends(require_permission("mosque.delete")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Mosque).where(Mosque.id == id))
    mosque = result.scalar_one_or_none()
    if not mosque:
        raise HTTPException(status_code=404, detail="Mosque not found")
    is_owner = str(mosque.primary_admin_id) == str(user.id)
    is_admin = user.role.name in ("super_admin", "moderator")
    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    mosque.soft_delete()
    await log_action(db, user.id, "mosque.delete", "mosque", id)
    return {"message": "Mosque deleted"}


@router.get("/{id}/admins", response_model=list)
async def list_mosque_admins(
    id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrganizationManager).where(OrganizationManager.organization_id == id)
    )
    admins = result.scalars().all()
    return [{"id": str(a.id), "user_id": str(a.user_id), "role": a.role}
            for a in admins]


@router.post("/{id}/admins", response_model=MessageResponse)
async def add_mosque_admin(
    id: str,
    user_id: str,
    user: User = Depends(get_current_user),
    _email: User = Depends(require_email_verified()),
    _perm: User = Depends(require_permission("staff.invite")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Mosque).where(Mosque.id == id))
    mosque = result.scalar_one_or_none()
    if not mosque:
        raise HTTPException(status_code=404, detail="Mosque not found")
    if str(mosque.primary_admin_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Only the primary admin can add admins")

    existing = await db.execute(
        select(OrganizationManager).where(
            OrganizationManager.organization_id == id,
            OrganizationManager.user_id == user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User is already an admin")

    admin = OrganizationManager(organization_id=id, user_id=user_id, role="manager")
    db.add(admin)
    await db.flush()
    await log_action(db, user.id, "mosque.add_admin", "mosque", id, {"new_admin": user_id})
    return {"message": "Admin added"}


@router.delete("/{id}/admins/{admin_id}", response_model=MessageResponse)
async def remove_mosque_admin(
    id: str,
    admin_id: str,
    user: User = Depends(get_current_user),
    _perm: User = Depends(require_permission("staff.remove")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Mosque).where(Mosque.id == id))
    mosque = result.scalar_one_or_none()
    if not mosque:
        raise HTTPException(status_code=404, detail="Mosque not found")
    if str(mosque.primary_admin_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Only the primary admin can remove admins")

    result = await db.execute(
        select(OrganizationManager).where(OrganizationManager.id == admin_id)
    )
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    await db.delete(admin)
    await log_action(db, user.id, "mosque.remove_admin", "mosque", id, {"removed_admin": admin_id})
    return {"message": "Admin removed"}


@router.get("/{id}/subscribe-prayer", response_model=dict)
async def check_prayer_subscription(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Mosque).where(Mosque.id == id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Mosque not found")
        
    existing = await db.execute(
        select(MosquePrayerSubscription).where(
            MosquePrayerSubscription.user_id == user.id,
            MosquePrayerSubscription.mosque_id == id,
        )
    )
    sub = existing.scalar_one_or_none()
    return {"is_subscribed": sub.is_active if sub else False}


@router.post("/{id}/subscribe-prayer", response_model=MessageResponse)
async def toggle_prayer_subscription(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Mosque).where(Mosque.id == id))
    mosque = result.scalar_one_or_none()
    if not mosque:
        raise HTTPException(status_code=404, detail="Mosque not found")

    existing = await db.execute(
        select(MosquePrayerSubscription).where(
            MosquePrayerSubscription.user_id == user.id,
            MosquePrayerSubscription.mosque_id == id,
        )
    )
    sub = existing.scalar_one_or_none()
    if sub:
        sub.is_active = not sub.is_active
        status_text = "subscribed to" if sub.is_active else "unsubscribed from"
        await log_action(db, user.id, f"prayer_subscription.{status_text}", "mosque", id)
        return {"message": f"You have {status_text} prayer time updates for this mosque"}
    else:
        sub = MosquePrayerSubscription(user_id=user.id, mosque_id=id)
        db.add(sub)
        await log_action(db, user.id, "prayer_subscription.subscribed", "mosque", id)
        return {"message": "You have subscribed to prayer time updates for this mosque"}


@router.get("/{id}/subscribers", response_model=list)
async def list_prayer_subscribers(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Mosque).where(Mosque.id == id))
    mosque = result.scalar_one_or_none()
    if not mosque:
        raise HTTPException(status_code=404, detail="Mosque not found")
    if str(mosque.primary_admin_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Only the primary admin can view subscribers")

    subs = await db.execute(
        select(MosquePrayerSubscription).where(
            MosquePrayerSubscription.mosque_id == id,
            MosquePrayerSubscription.is_active,
        )
    )
    return [{"id": str(s.id), "user_id": str(s.user_id)} for s in subs.scalars().all()]


@router.put("/{id}/prayer-times", response_model=MessageResponse)
async def update_prayer_times(
    id: str,
    req: MosquePrayerTimesUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Mosque).where(Mosque.id == id))
    mosque = result.scalar_one_or_none()
    if not mosque:
        raise HTTPException(status_code=404, detail="Mosque not found")
    
    is_owner = str(mosque.primary_admin_id) == str(user.id)
    is_admin = user.role and user.role.name in ("super_admin", "moderator")
    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    mosque.prayer_times = req.prayer_times
    await log_action(db, user.id, "mosque.update_prayer_times", "mosque", id)
    return {"message": "Prayer times updated"}

