from datetime import UTC

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_email_verified, require_permission
from app.core.rate_limit import limiter
from app.models.business import Business
from app.models.review import Review, ReviewReply
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.review import ReviewCreate, ReviewReplyCreate, ReviewReplyResponse, ReviewResponse
from app.services.audit_service import log_action

SPAM_WORDS = [
    "buy now", "click here", "free money", "act now", "limited offer",
    "congratulations", "you won", "casino", "viagra", "cryptocurrency",
    "earn money fast", "work from home", "make money",
]
PROFANITY_WORDS = [
    "fuck", "shit", "damn", "ass", "bitch", "bastard", "crap",
    "dick", "piss", "slut", "whore",
]


def _check_spam_profanity(text: str | None) -> str | None:
    if not text:
        return None
    lower = text.lower()
    for word in SPAM_WORDS:
        if word in lower:
            return "spam"
    for word in PROFANITY_WORDS:
        if word in lower:
            return "profanity"
    return None


router = APIRouter()


@router.get("/organization/{organization_id}")
async def list_reviews(
    organization_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    base_q = select(Review).where(
        Review.organization_id == organization_id,
        Review.status == "published",
        Review.deleted_at.is_(None),
    )
    total = (await db.execute(select(func.count()).select_from(base_q.subquery()))).scalar() or 0
    query = base_q.options(
        selectinload(Review.user),
    ).order_by(Review.created_at.desc()).offset((page - 1) * size).limit(size)
    result = await db.execute(query)

    items = []
    for review in result.scalars().all():
        reply = review.reply
        items.append(ReviewResponse(
            id=str(review.id), rating=review.rating, comment=review.comment,
            image_urls=review.image_urls or [],
            status=review.status, is_edited=review.is_edited,
            user_id=str(review.user_id),
            user_name=review.user.full_name if review.user else None,
            organization_id=str(review.organization_id),
            reply=ReviewReplyResponse(
                id=str(reply.id), content=reply.content,
                user_id=str(reply.user_id), created_at=reply.created_at,
            ) if reply else None,
            created_at=review.created_at,
        ))

    return PaginatedResponse(items=items, total=total, page=page, size=size,
                             pages=(total + size - 1) // size)


@router.post("/organization/{organization_id}", response_model=ReviewResponse, status_code=201)
@limiter.limit("10/minute")
async def create_review(
    organization_id: str,
    req: ReviewCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_email_verified()),
    __: User = Depends(require_permission("review.create")),
):

    existing = await db.execute(
        select(Review).where(
            Review.organization_id == organization_id,
            Review.user_id == user.id,
            Review.deleted_at.is_(None),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You already reviewed this organization")

    from app.models.organization import Organization
    org_result = await db.execute(select(Organization).where(Organization.id == organization_id))
    if not org_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Organization not found")

    if req.comment:
        flag = _check_spam_profanity(req.comment)
        if flag:
            raise HTTPException(
                status_code=400,
                detail=f"Review contains {flag} and cannot be submitted",
            )

    review = Review(
        rating=req.rating, comment=req.comment,
        image_urls=req.image_urls or None,
        user_id=user.id, organization_id=organization_id,
    )
    db.add(review)
    await db.flush()

    avg = await db.execute(
        select(func.avg(Review.rating)).where(
            Review.organization_id == organization_id,
            Review.status == "published",
        )
    )
    avg_rating = float(avg.scalar() or 0)
    count = (await db.execute(
        select(func.count(Review.id)).where(
            Review.organization_id == organization_id,
            Review.status == "published",
        )
    )).scalar() or 0
    from app.models.organization import Organization
    await db.execute(
        update(Organization).where(Organization.id == organization_id).values(
            avg_rating=avg_rating, review_count=count
        )
    )

    await log_action(db, user.id, "review.create", "review", str(review.id))
    return ReviewResponse(
        id=str(review.id), rating=review.rating, comment=review.comment,
        image_urls=review.image_urls or [],
        status=review.status, is_edited=review.is_edited,
        user_id=str(review.user_id),
        user_name=user.full_name,
        organization_id=str(review.organization_id),
        reply=None, created_at=review.created_at,
    )


@router.put("/{id}", response_model=ReviewResponse)
async def update_review(
    id: str,
    req: ReviewCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_email_verified()),
    __: User = Depends(require_permission("review.edit")),
):
    result = await db.execute(select(Review).where(Review.id == id))
    review = result.scalar_one_or_none()
    if not review or str(review.user_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Review not found")

    from datetime import datetime
    now = datetime.now(UTC)
    if review.created_at and (now - review.created_at).total_seconds() > 1800:
        raise HTTPException(status_code=400, detail="Can only edit within 30 minutes")

    review.rating = req.rating
    review.comment = req.comment
    review.image_urls = req.image_urls or None
    review.is_edited = True
    review.edit_count = (review.edit_count or 0) + 1

    return ReviewResponse(
        id=str(review.id), rating=review.rating, comment=review.comment,
        image_urls=review.image_urls or [],
        status=review.status, is_edited=review.is_edited,
        user_id=str(review.user_id),
        organization_id=str(review.organization_id),
        reply=None, created_at=review.created_at,
    )


@router.post("/{id}/reply", response_model=ReviewResponse)
async def reply_to_review(
    id: str,
    req: ReviewReplyCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_email_verified()),
    __: User = Depends(require_permission("review.respond")),
):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Review).where(Review.id == id)
        .options(selectinload(Review.organization))
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if str(review.organization.owner_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your organization")

    if review.reply:
        raise HTTPException(status_code=400, detail="Already replied")

    reply = ReviewReply(content=req.content, review_id=id, user_id=user.id)
    db.add(reply)
    await db.flush()

    return ReviewResponse(
        id=str(review.id), rating=review.rating, comment=review.comment,
        image_urls=review.image_urls or [],
        status=review.status, is_edited=review.is_edited,
        user_id=str(review.user_id),
        organization_id=str(review.organization_id),
        reply=ReviewReplyResponse(
            id=str(reply.id), content=reply.content,
            user_id=str(reply.user_id), created_at=reply.created_at,
        ),
        created_at=review.created_at,
    )


@router.delete("/{id}", response_model=MessageResponse)
async def delete_review(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Review).where(Review.id == id, Review.deleted_at.is_(None)))
    review = result.scalar_one_or_none()
    if not review or str(review.user_id) != str(user.id):
        raise HTTPException(status_code=404, detail="Review not found")

    from datetime import datetime
    now = datetime.now(UTC)
    if review.created_at and (now - review.created_at).total_seconds() > 86400:
        raise HTTPException(status_code=400, detail="Can only delete within 24 hours")

    review.soft_delete()
    await log_action(db, user.id, "review.delete", "review", str(review.id))
    return {"message": "Review deleted successfully"}
