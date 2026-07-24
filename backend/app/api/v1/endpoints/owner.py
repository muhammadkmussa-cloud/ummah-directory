from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.business import Business
from app.models.user import User

router = APIRouter()


@router.get("/dashboard/stats", response_model=dict)
async def get_owner_dashboard_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email first")

    # Aggregate stats for businesses owned by the user
    query = select(
        func.count(Business.id).label("total_businesses"),
        func.sum(Business.view_count).label("total_views"),
        func.sum(Business.review_count).label("total_reviews"),
        func.avg(Business.avg_rating).label("average_rating"),
    ).where(Business.owner_id == user.id)

    result = await db.execute(query)
    stats = result.first()

    return {
        "total_businesses": stats.total_businesses or 0,
        "total_views": stats.total_views or 0,
        "total_reviews": stats.total_reviews or 0,
        "average_rating": float(stats.average_rating or 0.0),
    }
