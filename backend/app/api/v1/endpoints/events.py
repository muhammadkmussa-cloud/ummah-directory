from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_email_verified, require_permission
from app.models.event import Event, SavedEvent
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.event import EventCreate, EventResponse, EventUpdate, SavedEventResponse
from app.services.audit_service import log_action

router = APIRouter()


def slugify(title: str) -> str:
    return title.lower().replace(" ", "-").replace("/", "-")[:200]


@router.get("", response_model=PaginatedResponse)
async def list_events(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    category: str | None = None,
    organizer_id: str | None = None,
    upcoming: bool = True,
    db: AsyncSession = Depends(get_db),
):
    query = select(Event).where(Event.status == "published")
    if category:
        query = query.where(Event.category == category)
    if organizer_id:
        query = query.where(Event.organizer_id == organizer_id)
    query = query.order_by(Event.event_date.asc() if upcoming else Event.event_date.desc())

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)

    return PaginatedResponse(
        items=[{
            "id": str(e.id), "title": e.title, "slug": e.slug,
            "description": e.description,
            "event_date": e.event_date, "event_time": e.event_time,
            "venue": e.venue, "latitude": e.latitude, "longitude": e.longitude,
            "registration_link": e.registration_link,
            "cover_image_url": e.cover_image_url,
            "category": e.category,
            "registration_count": e.registration_count,
            "organizer_type": "organization" if e.organization_id else "individual",
            "created_at": e.created_at,
        } for e in result.scalars().all()],
        total=total, page=page, size=size, pages=(total + size - 1) // size,
    )


import uuid
from sqlalchemy import or_

@router.get("/{slug}", response_model=EventResponse)
async def get_event(slug: str, db: AsyncSession = Depends(get_db)):
    try:
        ev_id = uuid.UUID(slug)
        stmt = select(Event).where(or_(Event.id == ev_id, Event.slug == slug))
    except ValueError:
        stmt = select(Event).where(Event.slug == slug)

    result = await db.execute(stmt)
    e = result.scalar_one_or_none()
    if not e:
        raise HTTPException(status_code=404, detail="Event not found")
    return EventResponse(
        id=str(e.id), title=e.title, slug=e.slug,
        description=e.description,
        event_date=e.event_date, event_time=e.event_time,
        venue=e.venue, latitude=e.latitude, longitude=e.longitude,
        registration_link=e.registration_link,
        cover_image_url=e.cover_image_url,
        category=e.category, status=e.status,
        registration_count=e.registration_count,
        organizer_type="organization" if e.organization_id else "individual",
        created_at=e.created_at,
    )


@router.post("", response_model=EventResponse, status_code=201)
async def create_event(
    req: EventCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_email_verified()),
    __: User = Depends(require_permission("event.create")),
):

    base_slug = slugify(req.title)
    slug = base_slug
    counter = 1
    while True:
        existing = await db.execute(select(Event).where(Event.slug == slug))
        if not existing.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    event = Event(
        title=req.title, slug=slug,
        description=req.description,
        event_date=req.event_date, event_time=req.event_time,
        venue=req.venue, latitude=req.latitude, longitude=req.longitude,
        registration_link=req.registration_link,
        category=req.category,
        organizer_type=req.organizer_type, organizer_id=req.organizer_id,
        status="published",
    )
    db.add(event)
    await db.flush()
    await log_action(db, user.id, "event.create", "event", str(event.id))

    return EventResponse(
        id=str(event.id), title=event.title, slug=event.slug,
        description=event.description,
        event_date=event.event_date, event_time=event.event_time,
        venue=event.venue, latitude=event.latitude, longitude=event.longitude,
        registration_link=event.registration_link,
        cover_image_url=event.cover_image_url,
        category=event.category, status=event.status,
        registration_count=event.registration_count,
        organizer_type=event.organization.organization_type if event.organization else None,
        created_at=event.created_at,
    )


# --- Saved Events ---


@router.post("/{id}/save", response_model=MessageResponse)
async def save_event(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        event_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID")

    event = await db.get(Event, event_uuid)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    existing = await db.execute(
        select(SavedEvent).where(
            SavedEvent.user_id == user.id, SavedEvent.event_id == event_uuid
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "Event already saved"}

    db.add(SavedEvent(user_id=user.id, event_id=event_uuid))
    await db.commit()
    return {"message": "Event saved"}


@router.delete("/{id}/save", response_model=MessageResponse)
async def unsave_event(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        event_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID")

    result = await db.execute(
        select(SavedEvent).where(
            SavedEvent.user_id == user.id, SavedEvent.event_id == event_uuid
        )
    )
    saved = result.scalar_one_or_none()
    if not saved:
        raise HTTPException(status_code=404, detail="Event not saved")

    await db.delete(saved)
    await db.commit()
    return {"message": "Event unsaved"}


# --- Registration (RSVP) ---


@router.post("/{id}/register", response_model=MessageResponse)
async def register_for_event(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        event_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID")

    event = await db.get(Event, event_uuid)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.registration_count = (event.registration_count or 0) + 1
    await log_action(db, user.id, "event.register", "event", id)
    await db.commit()
    return {"message": "Registered for event"}


@router.put("/{id}", response_model=EventResponse)
async def update_event(
    id: str,
    req: EventUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_email_verified()),
    __: User = Depends(require_permission("event.edit")),
):
    result = await db.execute(select(Event).where(Event.id == id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if str(event.organizer_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(event, field, value)

    await log_action(db, user.id, "event.update", "event", id)
    return EventResponse(
        id=str(event.id), title=event.title, slug=event.slug,
        description=event.description,
        event_date=event.event_date, event_time=event.event_time,
        venue=event.venue, latitude=event.latitude, longitude=event.longitude,
        registration_link=event.registration_link,
        cover_image_url=event.cover_image_url,
        category=event.category, status=event.status,
        registration_count=event.registration_count,
        organizer_type=event.organization.organization_type if event.organization else None,
        created_at=event.created_at,
    )


@router.delete("/{id}", response_model=MessageResponse)
async def delete_event(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permission("event.delete")),
):
    result = await db.execute(select(Event).where(Event.id == id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    is_owner = str(event.organizer_id) == str(user.id)
    is_admin = user.role.name in ("super_admin", "moderator")
    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    event.soft_delete()
    await log_action(db, user.id, "event.delete", "event", id)
    return {"message": "Event deleted"}


@router.get("/{id}/calendar", response_model=None)
async def download_calendar_ics(
    id: str,
    db: AsyncSession = Depends(get_db),
):
    from fastapi.responses import PlainTextResponse
    try:
        event_uuid = uuid.UUID(id)
        stmt = select(Event).where(Event.id == event_uuid)
    except ValueError:
        stmt = select(Event).where(Event.slug == id)

    result = await db.execute(stmt)
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Build .ics content
    from datetime import timezone

    event_dt = event.event_date.replace(tzinfo=timezone.utc) if event.event_date and not event.event_date.tzinfo else event.event_date
    uid_str = str(event.id)
    now_stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    dt_start = event_dt.strftime("%Y%m%dT%H%M%SZ") if event_dt else ""

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Umma Directory//Events//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        f"UID:{uid_str}@ummadirectory.com",
        f"DTSTAMP:{now_stamp}",
        f"DTSTART:{dt_start}",
        f"SUMMARY:{event.title}",
    ]

    if event.description:
        desc = event.description.replace("\n", "\\n").replace(",", "\\,")
        lines.append(f"DESCRIPTION:{desc}")
    if event.venue:
        lines.append(f"LOCATION:{event.venue}")
    if event.registration_link:
        lines.append(f"URL:{event.registration_link}")

    lines.extend([
        "END:VEVENT",
        "END:VCALENDAR",
    ])

    ics_content = "\r\n".join(lines) + "\r\n"
    return PlainTextResponse(
        content=ics_content,
        media_type="text/calendar",
        headers={"Content-Disposition": f'attachment; filename="{event.slug or event.id}.ics"'},
    )
