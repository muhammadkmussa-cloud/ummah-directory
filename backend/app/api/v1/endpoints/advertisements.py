from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.advertisement import Advertisement
from app.models.user import User
from app.services.audit_service import log_action

router = APIRouter()


@router.get("")
async def list_active_ads(
    placement: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Advertisement).where(
        Advertisement.is_active,
        Advertisement.status == "approved",
    )
    if placement:
        query = query.where(Advertisement.placement == placement)
    query = query.order_by(Advertisement.created_at.desc())
    result = await db.execute(query)

    return [
        {
            "id": str(a.id),
            "ad_type": a.ad_type,
            "title": a.title,
            "image_url": a.image_url,
            "destination_url": a.destination_url,
            "placement": a.placement,
        }
        for a in result.scalars().all()
    ]


@router.post("")
async def create_ad(
    ad_type: str,
    title: str,
    placement: str,
    image_url: str | None = None,
    destination_url: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email first")
    ad = Advertisement(
        ad_type=ad_type,
        title=title,
        image_url=image_url,
        destination_url=destination_url,
        placement=placement,
        start_date=start_date,
        end_date=end_date,
        advertiser_id=user.id,
        status="pending",
    )
    db.add(ad)
    return {"message": "Ad created", "id": str(ad.id)}


@router.post("/{id}/impression")
async def track_impression(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Advertisement).where(Advertisement.id == id))
    ad = result.scalar_one_or_none()
    if ad:
        ad.impressions = (ad.impressions or 0) + 1
    return {"message": "Tracked"}


@router.post("/{id}/click")
async def track_click(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Advertisement).where(Advertisement.id == id))
    ad = result.scalar_one_or_none()
    if ad:
        ad.clicks = (ad.clicks or 0) + 1
    return {"message": "Tracked"}
