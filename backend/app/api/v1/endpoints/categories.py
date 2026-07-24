from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.business import Category
from app.schemas.business import CategoryResponse

router = APIRouter()


@router.get("", response_model=list[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    all_cats = await db.execute(
        select(Category)
        .where(Category.is_active)
        .order_by(Category.sort_order)
    )
    cat_rows = all_cats.scalars().all()
    cat_map = {c.id: c for c in cat_rows}
    parent_cats = [c for c in cat_rows if c.parent_id is None]

    def build_subtree(cat) -> CategoryResponse:
        children = [c for c in cat_rows if c.parent_id == cat.id]
        return CategoryResponse(
            id=str(cat.id),
            name=cat.name,
            name_ar=cat.name_ar,
            name_sw=cat.name_sw,
            slug=cat.slug,
            description=cat.description,
            icon=cat.icon,
            parent_id=str(cat.parent_id) if cat.parent_id else None,
            children=[build_subtree(c) for c in children],
        )

    return [build_subtree(c) for c in parent_cats]


@router.get("/{slug}", response_model=CategoryResponse)
async def get_category(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Category).where(Category.slug == slug).options(selectinload(Category.children))
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    return CategoryResponse(
        id=str(cat.id),
        name=cat.name,
        name_ar=cat.name_ar,
        name_sw=cat.name_sw,
        slug=cat.slug,
        description=cat.description,
        icon=cat.icon,
        parent_id=str(cat.parent_id) if cat.parent_id else None,
        children=[CategoryResponse(
            id=str(c.id), name=c.name, name_ar=c.name_ar, name_sw=c.name_sw,
            slug=c.slug, description=c.description, icon=c.icon,
            parent_id=str(c.parent_id) if c.parent_id else None,
        ) for c in cat.children],
    )
