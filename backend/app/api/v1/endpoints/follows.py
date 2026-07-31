import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_optional_user
from app.core.rate_limit import limiter
from app.models.follow import OrganizationFollow
from app.models.organization import Organization
from app.models.post import OrganizationPost
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.services.audit_service import log_action

router = APIRouter()


class FollowStatusResponse(BaseModel):
    is_following: bool
    follower_count: int


class FollowingItem(BaseModel):
    organization_id: str
    organization_name: str
    organization_slug: str
    organization_type: str
    logo_url: str | None = None
    followed_at: str


class FeedPostResponse(BaseModel):
    id: str
    organization_id: str
    organization_name: str
    organization_slug: str
    author_name: str
    content: str
    image_url: str | None = None
    like_count: int
    created_at: str


async def _follower_count(db: AsyncSession, org_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(OrganizationFollow)
        .where(OrganizationFollow.organization_id == org_id)
    )
    return result.scalar() or 0


@router.post("/{organization_id}", response_model=FollowStatusResponse)
@limiter.limit("30/minute")
async def follow_organization(
    organization_id: str,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        org_uuid = uuid.UUID(organization_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid organization_id format") from None

    org = await db.get(Organization, org_uuid)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    existing = await db.execute(
        select(OrganizationFollow).where(
            OrganizationFollow.follower_id == user.id,
            OrganizationFollow.organization_id == org_uuid,
        )
    )
    if not existing.scalar_one_or_none():
        db.add(OrganizationFollow(follower_id=user.id, organization_id=org_uuid))
        await log_action(db, user.id, "organization.follow", "organization", str(org_uuid))

    count = await _follower_count(db, org_uuid)
    return FollowStatusResponse(is_following=True, follower_count=count)


@router.delete("/{organization_id}", response_model=FollowStatusResponse)
@limiter.limit("30/minute")
async def unfollow_organization(
    organization_id: str,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        org_uuid = uuid.UUID(organization_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid organization_id format") from None

    existing = await db.execute(
        select(OrganizationFollow).where(
            OrganizationFollow.follower_id == user.id,
            OrganizationFollow.organization_id == org_uuid,
        )
    )
    follow = existing.scalar_one_or_none()
    if follow:
        await db.delete(follow)
        await log_action(db, user.id, "organization.unfollow", "organization", str(org_uuid))

    count = await _follower_count(db, org_uuid)
    return FollowStatusResponse(is_following=False, follower_count=count)


@router.get("/{organization_id}/status", response_model=FollowStatusResponse)
async def follow_status(
    organization_id: str,
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        org_uuid = uuid.UUID(organization_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid organization_id format") from None

    is_following = False
    if user:
        existing = await db.execute(
            select(OrganizationFollow).where(
                OrganizationFollow.follower_id == user.id,
                OrganizationFollow.organization_id == org_uuid,
            )
        )
        is_following = existing.scalar_one_or_none() is not None

    count = await _follower_count(db, org_uuid)
    return FollowStatusResponse(is_following=is_following, follower_count=count)


@router.get("/following", response_model=PaginatedResponse)
async def list_following(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    base_q = (
        select(OrganizationFollow)
        .where(OrganizationFollow.follower_id == user.id)
        .options(selectinload(OrganizationFollow.organization))
    )
    total = (await db.execute(select(func.count()).select_from(base_q.subquery()))).scalar() or 0

    result = await db.execute(
        base_q.order_by(OrganizationFollow.created_at.desc()).offset((page - 1) * size).limit(size)
    )
    items = [
        FollowingItem(
            organization_id=str(f.organization_id),
            organization_name=f.organization.name if f.organization else "Unknown",
            organization_slug=f.organization.slug if f.organization else "",
            organization_type=f.organization.organization_type if f.organization else "unknown",
            logo_url=f.organization.logo_url if f.organization else None,
            followed_at=f.created_at.isoformat() if f.created_at else "",
        )
        for f in result.scalars().all()
    ]
    return PaginatedResponse(
        items=items, total=total, page=page, size=size, pages=(total + size - 1) // size
    )


@router.get("/feed", response_model=PaginatedResponse)
async def followed_feed(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Home Feed: published posts from organizations the current user follows."""
    followed_orgs = select(OrganizationFollow.organization_id).where(
        OrganizationFollow.follower_id == user.id
    )

    base_q = (
        select(OrganizationPost)
        .join(Organization, OrganizationPost.organization_id == Organization.id)
        .where(
            OrganizationPost.organization_id.in_(followed_orgs),
            OrganizationPost.status == "published",
        )
        .options(
            selectinload(OrganizationPost.author),
            selectinload(OrganizationPost.organization),
        )
    )
    total = (await db.execute(select(func.count()).select_from(base_q.subquery()))).scalar() or 0

    result = await db.execute(
        base_q.order_by(OrganizationPost.created_at.desc()).offset((page - 1) * size).limit(size)
    )

    items = [
        FeedPostResponse(
            id=str(p.id),
            organization_id=str(p.organization_id),
            organization_name=p.organization.name if p.organization else "",
            organization_slug=p.organization.slug if p.organization else "",
            author_name=p.author.full_name if p.author else "",
            content=p.content,
            image_url=p.image_url,
            like_count=p.like_count,
            created_at=p.created_at.isoformat() if p.created_at else "",
        )
        for p in result.scalars().all()
    ]
    return PaginatedResponse(
        items=items, total=total, page=page, size=size, pages=(total + size - 1) // size
    )
