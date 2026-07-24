from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_email_verified, require_permission
from app.core.rate_limit import limiter
from app.models.charity import Charity, CharityCampaign
from app.models.user import User
from app.schemas.charity import (
    CampaignCreate, CampaignResponse, CampaignUpdate,
    CharityCreate, CharityResponse, CharityUpdate,
)
from app.schemas.common import MessageResponse, PaginatedResponse
from app.services.audit_service import log_action

router = APIRouter()


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-").replace("/", "-")[:200]


@router.get("", response_model=PaginatedResponse)
async def list_charities(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    verified: bool | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Charity).where(Charity.status == "approved")
    if verified is not None:
        query = query.where(Charity.is_verified == verified)
    if search:
        query = query.where(
            or_(Charity.name.ilike(f"%{search}%"), Charity.description.ilike(f"%{search}%"))
        )
    query = query.order_by(Charity.created_at.desc())
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)

    return PaginatedResponse(
        items=[{
            "id": str(c.id), "name": c.name, "slug": c.slug,
            "mission_statement": c.mission_statement,
            "city": c.city, "country": c.country,
            "logo_url": c.logo_url, "is_verified": c.is_verified,
            "created_at": c.created_at,
        } for c in result.scalars().all()],
        total=total, page=page, size=size, pages=(total + size - 1) // size,
    )


@router.get("/{slug}", response_model=CharityResponse)
async def get_charity(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Charity).where(Charity.slug == slug)
        .options(selectinload(Charity.campaigns))
    )
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Charity not found")
    return CharityResponse(
        id=str(c.id), name=c.name, slug=c.slug,
        registration_number=c.registration_number,
        description=c.description, mission_statement=c.mission_statement,
        email=c.email, phone=c.phone, website=c.website,
        address=c.address, city=c.city, country=c.country,
        logo_url=c.logo_url, cover_image_url=c.cover_image_url,
        is_verified=c.is_verified, status=c.status,
        created_at=c.created_at,
    )


@router.post("", response_model=CharityResponse, status_code=201)
@limiter.limit("5/minute")
async def create_charity(
    req: CharityCreate,
    request: Request,
    user: User = Depends(get_current_user),
    _email: User = Depends(require_email_verified()),
    _perm: User = Depends(require_permission("charity.create")),
    db: AsyncSession = Depends(get_db),
):
    base_slug = slugify(req.name)
    slug = base_slug
    counter = 1
    while True:
        existing = await db.execute(select(Charity).where(Charity.slug == slug))
        if not existing.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    charity = Charity(
        name=req.name, slug=slug,
        registration_number=req.registration_number,
        description=req.description, mission_statement=req.mission_statement,
        email=req.email, phone=req.phone, website=req.website,
        address=req.address, city=req.city, country=req.country or "Kenya",
        primary_admin_id=user.id, status="pending",
    )
    db.add(charity)
    await db.flush()
    await log_action(db, user.id, "charity.create", "charity", str(charity.id))

    return CharityResponse(
        id=str(charity.id), name=charity.name, slug=charity.slug,
        registration_number=charity.registration_number,
        description=charity.description, mission_statement=charity.mission_statement,
        email=charity.email, phone=charity.phone, website=charity.website,
        address=charity.address, city=charity.city, country=charity.country,
        is_verified=charity.is_verified, status=charity.status,
        created_at=charity.created_at,
    )


@router.put("/{id}", response_model=CharityResponse)
async def update_charity(
    id: str,
    req: CharityUpdate,
    user: User = Depends(get_current_user),
    _email: User = Depends(require_email_verified()),
    _perm: User = Depends(require_permission("charity.edit")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Charity).where(Charity.id == id))
    charity = result.scalar_one_or_none()
    if not charity:
        raise HTTPException(status_code=404, detail="Charity not found")
    if str(charity.primary_admin_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your charity")

    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(charity, field, value)

    await log_action(db, user.id, "charity.update", "charity", id)
    return CharityResponse(
        id=str(charity.id), name=charity.name, slug=charity.slug,
        registration_number=charity.registration_number,
        description=charity.description, mission_statement=charity.mission_statement,
        email=charity.email, phone=charity.phone, website=charity.website,
        address=charity.address, city=charity.city, country=charity.country,
        logo_url=charity.logo_url, cover_image_url=charity.cover_image_url,
        is_verified=charity.is_verified, status=charity.status,
        created_at=charity.created_at,
    )


@router.delete("/{id}", response_model=MessageResponse)
async def delete_charity(
    id: str,
    user: User = Depends(get_current_user),
    _perm: User = Depends(require_permission("charity.delete")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Charity).where(Charity.id == id))
    charity = result.scalar_one_or_none()
    if not charity:
        raise HTTPException(status_code=404, detail="Charity not found")
    is_owner = str(charity.primary_admin_id) == str(user.id)
    is_admin = user.role.name in ("super_admin", "moderator")
    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    charity.soft_delete()
    await log_action(db, user.id, "charity.delete", "charity", id)
    return {"message": "Charity deleted"}


# --- Campaign CRUD ---

@router.get("/{charity_id}/campaigns", response_model=list[CampaignResponse])
async def list_campaigns(
    charity_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CharityCampaign).where(CharityCampaign.charity_id == charity_id)
        .order_by(CharityCampaign.created_at.desc())
    )
    campaigns = result.scalars().all()
    return [CampaignResponse(
        id=str(c.id), title=c.title, description=c.description,
        target_amount=str(c.target_amount), amount_raised=str(c.amount_raised),
        currency=c.currency, deadline=c.deadline, status=c.status,
        is_featured=c.is_featured, category=c.category,
        charity_id=str(c.charity_id), created_at=c.created_at,
    ) for c in campaigns]


@router.post("/{charity_id}/campaigns", response_model=CampaignResponse, status_code=201)
async def create_campaign(
    charity_id: str,
    req: CampaignCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email first")
    result = await db.execute(select(Charity).where(Charity.id == charity_id))
    charity = result.scalar_one_or_none()
    if not charity:
        raise HTTPException(status_code=404, detail="Charity not found")
    if str(charity.primary_admin_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your charity")

    campaign = CharityCampaign(
        title=req.title, description=req.description,
        target_amount=Decimal(str(req.target_amount)),
        currency=req.currency, deadline=req.deadline,
        category=req.category, beneficiary_info=req.beneficiary_info,
        charity_id=charity_id,
    )
    db.add(campaign)
    await db.flush()
    await log_action(db, user.id, "campaign.create", "campaign", str(campaign.id))

    return CampaignResponse(
        id=str(campaign.id), title=campaign.title, description=campaign.description,
        target_amount=str(campaign.target_amount), amount_raised=str(campaign.amount_raised),
        currency=campaign.currency, deadline=campaign.deadline, status=campaign.status,
        is_featured=campaign.is_featured, category=campaign.category,
        charity_id=str(campaign.charity_id), created_at=campaign.created_at,
    )


@router.put("/{charity_id}/campaigns/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    charity_id: str,
    campaign_id: str,
    req: CampaignUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email first")
    result = await db.execute(
        select(CharityCampaign).where(
            CharityCampaign.id == campaign_id,
            CharityCampaign.charity_id == charity_id,
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    charity_result = await db.execute(select(Charity).where(Charity.id == charity_id))
    charity = charity_result.scalar_one_or_none()
    if not charity or str(charity.primary_admin_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = req.model_dump(exclude_unset=True)
    if "target_amount" in update_data and update_data["target_amount"] is not None:
        update_data["target_amount"] = Decimal(str(update_data["target_amount"]))
    for field, value in update_data.items():
        setattr(campaign, field, value)

    return CampaignResponse(
        id=str(campaign.id), title=campaign.title, description=campaign.description,
        target_amount=str(campaign.target_amount), amount_raised=str(campaign.amount_raised),
        currency=campaign.currency, deadline=campaign.deadline, status=campaign.status,
        is_featured=campaign.is_featured, category=campaign.category,
        charity_id=str(campaign.charity_id), created_at=campaign.created_at,
    )


@router.delete("/{charity_id}/campaigns/{campaign_id}", response_model=MessageResponse)
async def delete_campaign(
    charity_id: str,
    campaign_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CharityCampaign).where(
            CharityCampaign.id == campaign_id,
            CharityCampaign.charity_id == charity_id,
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    charity_result = await db.execute(select(Charity).where(Charity.id == charity_id))
    charity = charity_result.scalar_one_or_none()
    if not charity or str(charity.primary_admin_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    campaign.soft_delete()
    await log_action(db, user.id, "campaign.delete", "campaign", campaign_id)
    return {"message": "Campaign deleted"}


@router.post("/{charity_id}/campaigns/{campaign_id}/pause", response_model=MessageResponse)
async def pause_campaign(
    charity_id: str,
    campaign_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email first")
    campaign = await _get_campaign(db, charity_id, campaign_id)
    await _check_charity_admin(db, charity_id, user)
    campaign.status = "paused"
    await log_action(db, user.id, "campaign.pause", "campaign", campaign_id)
    return {"message": "Campaign paused"}


@router.post("/{charity_id}/campaigns/{campaign_id}/complete", response_model=MessageResponse)
async def complete_campaign(
    charity_id: str,
    campaign_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email first")
    campaign = await _get_campaign(db, charity_id, campaign_id)
    await _check_charity_admin(db, charity_id, user)
    campaign.status = "completed"
    await log_action(db, user.id, "campaign.complete", "campaign", campaign_id)
    return {"message": "Campaign completed"}


async def _get_campaign(db, charity_id, campaign_id):
    result = await db.execute(
        select(CharityCampaign).where(
            CharityCampaign.id == campaign_id,
            CharityCampaign.charity_id == charity_id,
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


async def _check_charity_admin(db, charity_id, user):
    result = await db.execute(select(Charity).where(Charity.id == charity_id))
    charity = result.scalar_one_or_none()
    if not charity or str(charity.primary_admin_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
