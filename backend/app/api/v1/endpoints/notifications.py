from app.schemas.common import MessageResponse
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.notification import Notification, NotificationPreference
from app.models.user import User
from app.schemas.common import PaginatedResponse, MessageResponse
from app.schemas.notification import NotificationPreferenceResponse, NotificationPreferenceUpdate

router = APIRouter()


@router.get("", response_model=PaginatedResponse)
async def list_notifications(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Notification).where(
        Notification.user_id == user.id,
        Notification.deleted_at.is_(None),
    ).order_by(Notification.created_at.desc())

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)

    return PaginatedResponse(
        items=[{
            "id": str(n.id), "type": n.type, "title": n.title,
            "message": n.message, "data": n.data,
            "is_read": n.is_read, "created_at": n.created_at,
        } for n in result.scalars().all()],
        total=total, page=page, size=size, pages=(total + size - 1) // size,
    )


@router.patch("/{id}/read")
async def mark_read(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(Notification.id == id, Notification.user_id == user.id)
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    return {"message": "Marked as read"}


@router.patch("/read-all")
async def mark_all_read(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    return {"message": "All notifications marked as read"}


@router.delete("/{id}", response_model=MessageResponse)
async def delete_notification(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification).where(Notification.id == id, Notification.user_id == user.id)
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    import uuid
    from datetime import datetime, timezone
    notif.deleted_at = datetime.now(timezone.utc)
    return {"message": "Notification deleted"}


@router.get("/preferences", response_model=NotificationPreferenceResponse)
async def get_preferences(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == user.id)
    )
    prefs = result.scalar_one_or_none()
    if not prefs:
        prefs = NotificationPreference(user_id=user.id)
        db.add(prefs)
        await db.flush()
    return NotificationPreferenceResponse(
        email_notifications=prefs.email_notifications,
        in_app_notifications=prefs.in_app_notifications,
        listing_updates=prefs.listing_updates,
        donation_updates=prefs.donation_updates,
        review_updates=prefs.review_updates,
        promotional=prefs.promotional,
        security_alerts=prefs.security_alerts,
    )


@router.put("/preferences", response_model=NotificationPreferenceResponse)
async def update_preferences(
    req: NotificationPreferenceUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == user.id)
    )
    prefs = result.scalar_one_or_none()
    if not prefs:
        prefs = NotificationPreference(user_id=user.id)
        db.add(prefs)
        await db.flush()

    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(prefs, field, value)

    return NotificationPreferenceResponse(
        email_notifications=prefs.email_notifications,
        in_app_notifications=prefs.in_app_notifications,
        listing_updates=prefs.listing_updates,
        donation_updates=prefs.donation_updates,
        review_updates=prefs.review_updates,
        promotional=prefs.promotional,
        security_alerts=prefs.security_alerts,
    )
