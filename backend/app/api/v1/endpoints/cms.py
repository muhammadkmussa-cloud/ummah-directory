from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.cms import BlogPost, CMSBanner, CMSPage

router = APIRouter()


@router.get("/pages/{slug}")
async def get_page(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CMSPage).where(CMSPage.slug == slug, CMSPage.is_published)
    )
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return {
        "id": str(page.id), "slug": page.slug, "title": page.title,
        "content": page.content, "meta_title": page.meta_title,
        "meta_description": page.meta_description,
    }


@router.get("/banners")
async def list_banners(placement: str | None = None, db: AsyncSession = Depends(get_db)):
    query = select(CMSBanner).where(CMSBanner.is_active)
    if placement:
        query = query.where(CMSBanner.placement == placement)
    query = query.order_by(CMSBanner.sort_order)
    result = await db.execute(query)
    return [{
        "id": str(b.id), "title": b.title, "subtitle": b.subtitle,
        "image_url": b.image_url, "link_url": b.link_url,
        "placement": b.placement,
    } for b in result.scalars().all()]


@router.get("/blog")
async def list_blog_posts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BlogPost).where(BlogPost.is_published).order_by(BlogPost.published_at.desc())
    )
    return [{
        "id": str(p.id), "slug": p.slug, "title": p.title,
        "excerpt": p.excerpt, "cover_image_url": p.cover_image_url,
        "published_at": p.published_at,
    } for p in result.scalars().all()]


@router.get("/blog/{slug}")
async def get_blog_post(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BlogPost).where(BlogPost.slug == slug, BlogPost.is_published)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return {
        "id": str(post.id), "slug": post.slug, "title": post.title,
        "content": post.content, "excerpt": post.excerpt,
        "cover_image_url": post.cover_image_url,
        "published_at": post.published_at,
    }
