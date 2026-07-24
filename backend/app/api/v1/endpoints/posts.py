import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_optional_user
from app.models.organization import Organization
from app.models.post import OrganizationPost, PostLike
from app.models.user import User

router = APIRouter()


class PostCreate(BaseModel):
    content: str
    image_url: str | None = None


class PostResponse(BaseModel):
    id: str
    organization_id: str
    organization_name: str
    author_id: str
    author_name: str
    content: str
    image_url: str | None = None
    like_count: int
    is_liked_by_me: bool = False
    created_at: str


@router.get("/organizations/{org_id}/posts")
async def list_org_posts(
    org_id: str,
    user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        target_uuid = uuid.UUID(org_id)
        stmt = select(Organization).where(or_(Organization.id == target_uuid, Organization.slug == org_id))
    except ValueError:
        stmt = select(Organization).where(Organization.slug == org_id)

    org_res = await db.execute(stmt)
    org = org_res.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    posts_res = await db.execute(
        select(OrganizationPost)
        .options(selectinload(OrganizationPost.author))
        .where(OrganizationPost.organization_id == org.id, OrganizationPost.status == "published")
        .order_by(OrganizationPost.created_at.desc())
    )
    posts = posts_res.scalars().all()

    user_liked_post_ids = set()
    if user:
        likes_res = await db.execute(
            select(PostLike.post_id).where(PostLike.user_id == user.id)
        )
        user_liked_post_ids = set(likes_res.scalars().all())

    items = []
    for p in posts:
        items.append({
            "id": str(p.id),
            "organization_id": str(org.id),
            "organization_name": org.name,
            "author_id": str(p.author_id),
            "author_name": p.author.full_name if p.author else "Organization Staff",
            "content": p.content,
            "image_url": p.image_url,
            "like_count": p.like_count,
            "is_liked_by_me": p.id in user_liked_post_ids,
            "created_at": p.created_at.isoformat() if p.created_at else "",
        })

    return items


@router.post("/organizations/{org_id}/posts", status_code=201)
async def create_org_post(
    org_id: str,
    req: PostCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        target_uuid = uuid.UUID(org_id)
        stmt = select(Organization).where(or_(Organization.id == target_uuid, Organization.slug == org_id))
    except ValueError:
        stmt = select(Organization).where(Organization.slug == org_id)

    org_res = await db.execute(stmt)
    org = org_res.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    isAdmin = user.role.name in ("super_admin", "moderator") if user.role else False
    isOwner = org.owner_id == user.id

    if not (isAdmin or isOwner):
        raise HTTPException(status_code=403, detail="Only organization owners or administrators can publish posts")

    post = OrganizationPost(
        organization_id=org.id,
        author_id=user.id,
        content=req.content,
        image_url=req.image_url,
        like_count=0,
        status="published",
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)

    return {
        "id": str(post.id),
        "organization_id": str(org.id),
        "organization_name": org.name,
        "author_id": str(user.id),
        "author_name": user.full_name,
        "content": post.content,
        "image_url": post.image_url,
        "like_count": 0,
        "is_liked_by_me": False,
        "created_at": post.created_at.isoformat() if post.created_at else "",
    }


@router.post("/posts/{post_id}/like")
async def toggle_post_like(
    post_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        p_uuid = uuid.UUID(post_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid post ID format")

    post_res = await db.execute(select(OrganizationPost).where(OrganizationPost.id == p_uuid))
    post = post_res.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing_like = await db.execute(
        select(PostLike).where(PostLike.post_id == p_uuid, PostLike.user_id == user.id)
    )
    like = existing_like.scalar_one_or_none()

    if like:
        await db.delete(like)
        post.like_count = max(0, post.like_count - 1)
        is_liked = False
    else:
        new_like = PostLike(post_id=p_uuid, user_id=user.id)
        db.add(new_like)
        post.like_count = post.like_count + 1
        is_liked = True

    await db.commit()
    await db.refresh(post)

    return {
        "id": str(post.id),
        "like_count": post.like_count,
        "is_liked_by_me": is_liked,
    }


@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        p_uuid = uuid.UUID(post_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid post ID format")

    post_res = await db.execute(select(OrganizationPost).where(OrganizationPost.id == p_uuid))
    post = post_res.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    isAdmin = user.role.name in ("super_admin", "moderator") if user.role else False
    isAuthor = post.author_id == user.id

    if not (isAdmin or isAuthor):
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    await db.delete(post)
    await db.commit()
    return {"message": "Post deleted successfully"}
