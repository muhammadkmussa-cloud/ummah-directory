from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_email_verified, require_permission
from app.models.education import EducationalInstitution
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.education import EducationCreate, EducationResponse, EducationUpdate
from app.services.audit_service import log_action

router = APIRouter()


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-").replace("/", "-")[:200]


@router.get("", response_model=PaginatedResponse)
async def list_institutions(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    institution_type: str | None = None,
    city: str | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(EducationalInstitution).where(EducationalInstitution.status == "approved")
    if institution_type:
        query = query.where(EducationalInstitution.institution_type == institution_type)
    if city:
        query = query.where(EducationalInstitution.city.ilike(f"%{city}%"))
    if search:
        query = query.where(
            or_(EducationalInstitution.name.ilike(f"%{search}%"),
                EducationalInstitution.description.ilike(f"%{search}%"))
        )
    query = query.order_by(EducationalInstitution.created_at.desc())

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)

    return PaginatedResponse(
        items=[{
            "id": str(e.id), "name": e.name, "slug": e.slug,
            "institution_type": e.institution_type, "description": e.description,
            "curriculum": e.curriculum, "city": e.city, "country": e.country,
            "logo_url": e.logo_url, "is_verified": e.is_verified,
            "has_quran_program": e.has_quran_program,
            "created_at": e.created_at,
        } for e in result.scalars().all()],
        total=total, page=page, size=size, pages=(total + size - 1) // size,
    )


@router.get("/{slug}", response_model=EducationResponse)
async def get_institution(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(EducationalInstitution).where(EducationalInstitution.slug == slug)
    )
    e = result.scalar_one_or_none()
    if not e:
        raise HTTPException(status_code=404, detail="Institution not found")
    return EducationResponse(
        id=str(e.id), name=e.name, slug=e.slug,
        institution_type=e.institution_type, description=e.description,
        curriculum=e.curriculum, email=e.email, phone=e.phone,
        website=e.website, address=e.address, city=e.city, country=e.country,
        latitude=e.latitude, longitude=e.longitude,
        logo_url=e.logo_url, cover_image_url=e.cover_image_url,
        is_verified=e.is_verified, status=e.status,
        has_girls_section=e.has_girls_section,
        has_boarding=e.has_boarding,
        has_quran_program=e.has_quran_program,
        created_at=e.created_at,
    )


@router.post("", response_model=EducationResponse, status_code=201)
async def create_institution(
    req: EducationCreate,
    user: User = Depends(get_current_user),
    _email: User = Depends(require_email_verified()),
    _perm: User = Depends(require_permission("education.create")),
    db: AsyncSession = Depends(get_db),
):
    base_slug = slugify(req.name)
    slug = base_slug
    counter = 1
    while True:
        existing = await db.execute(select(EducationalInstitution).where(EducationalInstitution.slug == slug))
        if not existing.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    inst = EducationalInstitution(
        name=req.name, slug=slug, institution_type=req.institution_type,
        description=req.description, curriculum=req.curriculum,
        email=req.email, phone=req.phone, website=req.website,
        address=req.address, city=req.city, country=req.country or "Kenya",
        latitude=req.latitude, longitude=req.longitude,
        has_girls_section=req.has_girls_section,
        has_boarding=req.has_boarding,
        has_quran_program=req.has_quran_program,
        primary_admin_id=user.id, status="pending",
    )
    db.add(inst)
    await db.flush()
    await log_action(db, user.id, "education.create", "education", str(inst.id))

    return EducationResponse(
        id=str(inst.id), name=inst.name, slug=inst.slug,
        institution_type=inst.institution_type,
        description=inst.description, curriculum=inst.curriculum,
        email=inst.email, phone=inst.phone, website=inst.website,
        address=inst.address, city=inst.city, country=inst.country,
        latitude=inst.latitude, longitude=inst.longitude,
        is_verified=inst.is_verified, status=inst.status,
        has_girls_section=inst.has_girls_section,
        has_boarding=inst.has_boarding,
        has_quran_program=inst.has_quran_program,
        created_at=inst.created_at,
    )


@router.put("/{id}", response_model=EducationResponse)
async def update_institution(
    id: str,
    req: EducationUpdate,
    user: User = Depends(get_current_user),
    _email: User = Depends(require_email_verified()),
    _perm: User = Depends(require_permission("education.edit")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(EducationalInstitution).where(EducationalInstitution.id == id))
    inst = result.scalar_one_or_none()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    if str(inst.primary_admin_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(inst, field, value)
    await log_action(db, user.id, "education.update", "education", id)
    return EducationResponse(
        id=str(inst.id), name=inst.name, slug=inst.slug,
        institution_type=inst.institution_type,
        description=inst.description, curriculum=inst.curriculum,
        email=inst.email, phone=inst.phone, website=inst.website,
        address=inst.address, city=inst.city, country=inst.country,
        latitude=inst.latitude, longitude=inst.longitude,
        logo_url=inst.logo_url, cover_image_url=inst.cover_image_url,
        is_verified=inst.is_verified, status=inst.status,
        has_girls_section=inst.has_girls_section,
        has_boarding=inst.has_boarding,
        has_quran_program=inst.has_quran_program,
        created_at=inst.created_at,
    )


@router.delete("/{id}", response_model=MessageResponse)
async def delete_institution(
    id: str,
    user: User = Depends(get_current_user),
    _perm: User = Depends(require_permission("education.delete")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(EducationalInstitution).where(EducationalInstitution.id == id))
    inst = result.scalar_one_or_none()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    is_owner = str(inst.primary_admin_id) == str(user.id)
    is_admin = user.role.name in ("super_admin", "moderator")
    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    inst.soft_delete()
    await log_action(db, user.id, "education.delete", "education", id)
    return {"message": "Institution deleted"}
