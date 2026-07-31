from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_client_info, get_current_user
from app.models.push_subscription import PushSubscription
from app.models.user import User
from app.schemas.common import MessageResponse

router = APIRouter()


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class SubscribeRequest(BaseModel):
    endpoint: str
    keys: PushKeys


@router.get("/vapid-public-key")
async def vapid_public_key(user: User = Depends(get_current_user)):
    if not settings.vapid_public_key:
        raise HTTPException(status_code=503, detail="Push notifications are not configured")
    return {"public_key": settings.vapid_public_key}


@router.post("/subscribe", response_model=MessageResponse)
async def subscribe(
    body: SubscribeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(PushSubscription).where(
            PushSubscription.user_id == user.id,
            PushSubscription.endpoint == body.endpoint,
        )
    )
    sub = existing.scalar_one_or_none()
    if sub:
        # Refresh keys in case the browser rotated them.
        sub.p256dh = body.keys.p256dh
        sub.auth = body.keys.auth
    else:
        ip, ua = get_client_info(None)
        db.add(
            PushSubscription(
                user_id=user.id,
                endpoint=body.endpoint,
                p256dh=body.keys.p256dh,
                auth=body.keys.auth,
                user_agent=ua,
            )
        )
    return {"message": "Subscribed to push notifications"}


@router.post("/unsubscribe", response_model=MessageResponse)
async def unsubscribe(
    body: SubscribeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(PushSubscription).where(
            PushSubscription.user_id == user.id,
            PushSubscription.endpoint == body.endpoint,
        )
    )
    sub = existing.scalar_one_or_none()
    if sub:
        await db.delete(sub)
    return {"message": "Unsubscribed from push notifications"}
