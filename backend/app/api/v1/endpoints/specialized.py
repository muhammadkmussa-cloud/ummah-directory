"""Create endpoints for the Hospital, Hotel and Restaurant organization subtypes
(workflows.md #15/#16). Listing and detail are handled by the generic, polymorphic
``/organizations`` endpoints, so only creation is needed here.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_email_verified
from app.core.rate_limit import limiter
from app.models.organization import Organization
from app.models.specialized_orgs import Hospital, Hotel, Restaurant
from app.models.user import User
from app.services.audit_service import log_action

router = APIRouter()


class SpecializedCreate(BaseModel):
    name: str
    description: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    logo_url: str | None = None
    cover_image_url: str | None = None
    # Hospital
    departments: list | None = None
    services_offered: list | None = None
    emergency_contacts: list | None = None
    has_emergency_room: bool = False
    # Hotel
    rooms: list | None = None
    star_rating: int | None = None
    # Shared hospitality
    facilities: list | None = None
    operating_hours: dict | None = None
    # Restaurant
    menu: list | None = None
    cuisine_type: str | None = None
    is_halal_certified: bool = False


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-").replace("/", "-")[:200]


async def _unique_slug(db: AsyncSession, name: str) -> str:
    base = slugify(name)
    slug = base
    counter = 1
    while True:
        existing = await db.execute(select(Organization).where(Organization.slug == slug))
        if not existing.scalar_one_or_none():
            return slug
        slug = f"{base}-{counter}"
        counter += 1


def _base_kwargs(req: SpecializedCreate) -> dict:
    return {
        "name": req.name,
        "description": req.description,
        "email": req.email,
        "phone": req.phone,
        "website": req.website,
        "address": req.address,
        "city": req.city,
        "country": req.country or "Kenya",
        "latitude": req.latitude,
        "longitude": req.longitude,
        "logo_url": req.logo_url,
        "cover_image_url": req.cover_image_url,
        "status": "pending",
    }


def _serialize(org: Organization) -> dict:
    return {
        "id": str(org.id),
        "organization_type": org.organization_type,
        "name": org.name,
        "slug": org.slug,
        "status": org.status,
        "city": org.city,
        "country": org.country,
    }


@router.post("/hospitals")
@limiter.limit("5/minute")
async def create_hospital(
    req: SpecializedCreate,
    request: Request,
    user: User = Depends(get_current_user),
    _email: User = Depends(require_email_verified()),
    db: AsyncSession = Depends(get_db),
):
    slug = await _unique_slug(db, req.name)
    hospital = Hospital(
        slug=slug,
        owner_id=user.id,
        **_base_kwargs(req),
        departments=req.departments,
        services_offered=req.services_offered,
        emergency_contacts=req.emergency_contacts,
        operating_hours=req.operating_hours,
        has_emergency_room=req.has_emergency_room,
    )
    db.add(hospital)
    await db.flush()
    await log_action(db, user.id, "hospital.create", "organization", str(hospital.id))
    return _serialize(hospital)


@router.post("/hotels")
@limiter.limit("5/minute")
async def create_hotel(
    req: SpecializedCreate,
    request: Request,
    user: User = Depends(get_current_user),
    _email: User = Depends(require_email_verified()),
    db: AsyncSession = Depends(get_db),
):
    slug = await _unique_slug(db, req.name)
    hotel = Hotel(
        slug=slug,
        owner_id=user.id,
        **_base_kwargs(req),
        rooms=req.rooms,
        facilities=req.facilities,
        star_rating=req.star_rating,
        operating_hours=req.operating_hours,
    )
    db.add(hotel)
    await db.flush()
    await log_action(db, user.id, "hotel.create", "organization", str(hotel.id))
    return _serialize(hotel)


@router.post("/restaurants")
@limiter.limit("5/minute")
async def create_restaurant(
    req: SpecializedCreate,
    request: Request,
    user: User = Depends(get_current_user),
    _email: User = Depends(require_email_verified()),
    db: AsyncSession = Depends(get_db),
):
    slug = await _unique_slug(db, req.name)
    restaurant = Restaurant(
        slug=slug,
        owner_id=user.id,
        **_base_kwargs(req),
        menu=req.menu,
        cuisine_type=req.cuisine_type,
        facilities=req.facilities,
        operating_hours=req.operating_hours,
        is_halal_certified=req.is_halal_certified,
    )
    db.add(restaurant)
    await db.flush()
    await log_action(db, user.id, "restaurant.create", "organization", str(restaurant.id))
    return _serialize(restaurant)
