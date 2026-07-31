import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.models.favorite import Favorite, FavoriteCollection
from app.models.organization import Organization
from app.models.post import OrganizationPost
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.favorite import (
    FavoriteCreate,
    FavoriteListResponse,
    FavoriteResponse,
    FeedFavoritesResponse,
    FeedPostResponse,
)

router = APIRouter()


@router.get("")
async def list_favorites(
    page: int | None = Query(None, ge=1),
    size: int = Query(20, ge=1, le=200),
    q: str | None = Query(None, description="Search by organization name"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    base_q = select(Favorite).where(Favorite.user_id == user.id)

    if q:
        base_q = base_q.join(Favorite.organization).where(Organization.name.ilike(f"%{q}%"))

    total_q = select(func.count()).select_from(base_q.subquery())
    total = (await db.execute(total_q)).scalar() or 0

    base_q = base_q.options(selectinload(Favorite.organization))

    if page is not None:
        base_q = base_q.offset((page - 1) * size).limit(size)

    result = await db.execute(base_q)
    favorites = result.scalars().all()

    return FavoriteListResponse(
        items=[
            FavoriteResponse(
                id=str(f.id),
                organization_id=str(f.organization_id),
                organization_name=f.organization.name if f.organization else "Unknown",
                organization_type=f.organization.organization_type if f.organization else "unknown",
                organization_slug=f.organization.slug if f.organization else "",
                logo_url=f.organization.logo_url if f.organization else None,
                cover_image_url=f.organization.cover_image_url if f.organization else None,
                city=f.organization.city if f.organization else None,
                created_at=f.created_at,
            )
            for f in favorites
        ],
        total=total,
    )


@router.post("", response_model=MessageResponse)
async def add_favorite(
    body: FavoriteCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permission("favorite.create")),
):
    try:
        org_uuid = uuid.UUID(body.organization_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid organization_id format") from None

    org = await db.get(Organization, org_uuid)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    existing = await db.execute(
        select(Favorite).where(
            Favorite.user_id == user.id,
            Favorite.organization_id == org_uuid,
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "Already favorited"}

    fav = Favorite(organization_id=org_uuid, user_id=user.id)
    db.add(fav)
    await db.commit()
    return {"message": "Added to favorites"}


@router.delete("/{id}", response_model=MessageResponse)
async def remove_favorite(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_permission("favorite.delete")),
):
    try:
        fav_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid favorite ID format") from None

    result = await db.execute(
        select(Favorite).where(Favorite.id == fav_uuid, Favorite.user_id == user.id)
    )
    fav = result.scalar_one_or_none()
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")
    await db.delete(fav)
    await db.commit()
    return {"message": "Removed from favorites"}


@router.get("/feed", response_model=FeedFavoritesResponse)
async def feed_favorites(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    favorited_org_ids = (
        select(Favorite.organization_id).where(Favorite.user_id == user.id).scalar_subquery()
    )

    base_q = (
        select(OrganizationPost)
        .options(
            selectinload(OrganizationPost.organization),
        )
        .where(
            OrganizationPost.organization_id.in_(favorited_org_ids),
            OrganizationPost.status == "published",
        )
    )

    total_q = select(func.count()).select_from(base_q.subquery())
    total = (await db.execute(total_q)).scalar() or 0

    result = await db.execute(
        base_q.order_by(OrganizationPost.created_at.desc()).offset((page - 1) * size).limit(size)
    )
    posts = result.scalars().all()

    return FeedFavoritesResponse(
        items=[
            FeedPostResponse(
                id=str(p.id),
                organization_id=str(p.organization_id),
                organization_name=p.organization.name if p.organization else "Unknown",
                organization_type=p.organization.organization_type if p.organization else "unknown",
                organization_slug=p.organization.slug if p.organization else "",
                logo_url=p.organization.logo_url if p.organization else None,
                cover_image_url=p.organization.cover_image_url if p.organization else None,
                content=p.content,
                image_url=p.image_url,
                like_count=p.like_count,
                is_premier=False,
                is_verified=p.organization.is_verified if p.organization else False,
                created_at=p.created_at,
            )
            for p in posts
        ],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size if total > 0 else 0,
    )


# --- Collections ---


@router.get("/collections")
async def list_collections(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FavoriteCollection)
        .where(FavoriteCollection.user_id == user.id)
        .options(selectinload(FavoriteCollection.favorites))
        .order_by(FavoriteCollection.name.asc())
    )
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "count": len(c.favorites),
            "created_at": c.created_at,
        }
        for c in result.scalars().all()
    ]


@router.post("/collections")
async def create_collection(
    name: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    name = name.strip()[:100]
    if not name:
        raise HTTPException(status_code=400, detail="Collection name is required")
    coll = FavoriteCollection(name=name, user_id=user.id)
    db.add(coll)
    await db.flush()
    return {"id": str(coll.id), "name": coll.name, "count": 0, "created_at": coll.created_at}


@router.delete("/collections/{id}", response_model=MessageResponse)
async def delete_collection(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FavoriteCollection).where(
            FavoriteCollection.id == id, FavoriteCollection.user_id == user.id
        )
    )
    coll = result.scalar_one_or_none()
    if not coll:
        raise HTTPException(status_code=404, detail="Collection not found")
    await db.delete(coll)
    return {"message": "Collection deleted"}


@router.post("/{id}/move", response_model=MessageResponse)
async def move_favorite(
    id: str,
    collection_id: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Find the favorite
    result = await db.execute(
        select(Favorite).where(Favorite.id == id, Favorite.user_id == user.id)
    )
    fav = result.scalar_one_or_none()
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")

    if collection_id is not None and collection_id != "":
        # Verify collection belongs to user
        coll_result = await db.execute(
            select(FavoriteCollection).where(
                FavoriteCollection.id == collection_id, FavoriteCollection.user_id == user.id
            )
        )
        if not coll_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Collection not found")
        fav.collection_id = (
            uuid.UUID(collection_id) if isinstance(collection_id, str) else collection_id
        )
    else:
        fav.collection_id = None  # Remove from collection

    return {"message": "Favorite moved"}
