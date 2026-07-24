from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.prayer_times import PrayerTimeSettingsUpdate, PrayerTimeSettingsResponse

router = APIRouter()


@router.get("/me", response_model=PrayerTimeSettingsResponse)
async def get_my_prayer_time_settings(
    user: User = Depends(get_current_user)
):
    """
    Get the current user's personal prayer time settings.
    """
    settings = user.prayer_time_settings or {}
    return PrayerTimeSettingsResponse(**settings)


@router.put("/me", response_model=MessageResponse)
async def update_my_prayer_time_settings(
    req: PrayerTimeSettingsUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update the current user's personal prayer time settings.
    """
    settings = req.model_dump(exclude_unset=True)
    
    current_settings = user.prayer_time_settings or {}
    current_settings.update(settings)
    
    user.prayer_time_settings = current_settings
    
    db.add(user)
    await db.flush()
    
    return {"message": "Prayer time settings updated successfully"}
