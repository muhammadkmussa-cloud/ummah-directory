from datetime import UTC, datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_email_verified, require_permission
from app.core.rate_limit import limiter
from app.models.ad_campaign import AdCampaign
from app.models.business import Business, BusinessBranch, OwnershipClaim
from app.models.media import MediaFile
from app.models.payment import Payment
from app.models.premier import PremierSubscription
from app.models.user import User
from app.models.verification import VerificationDocument
from app.payments import get_gateway
from app.schemas.business import (
    BranchCreate,
    BranchResponse,
    BusinessCreate,
    BusinessResponse,
    BusinessUpdate,
)
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.premier import PremierPurchase, PremierResponse
from app.services.audit_service import log_action
from app.services.notification_service import create_notification

router = APIRouter()


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-").replace("/", "-")[:200]


@router.get("", response_model=PaginatedResponse)
async def list_businesses(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    category: str | None = None,
    city: str | None = None,
    country: str | None = None,
    verified: bool | None = None,
    halal_certified: bool | None = None,
    premier: bool | None = None,
    search: str | None = None,
    sort: str = "newest",
    lat: float | None = None,
    lng: float | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Business).where(
        Business.status == "approved",
    )

    if category:
        query = query.where(Business.category_id == category)
    if city:
        query = query.where(Business.city.ilike(f"%{city}%"))
    if country:
        query = query.where(Business.country == country)
    if verified is not None:
        query = query.where(Business.is_verified == verified)
    if halal_certified is not None:
        query = query.where(Business.is_halal_certified == halal_certified)
    if premier is not None:
        query = query.where(Business.is_premier == premier)
    if search:
        query = query.where(
            or_(
                Business.name.ilike(f"%{search}%"),
                Business.description.ilike(f"%{search}%"),
            )
        )

    if sort == "newest":
        query = query.order_by(Business.created_at.desc())
    elif sort == "oldest":
        query = query.order_by(Business.created_at.asc())
    elif sort == "rating":
        query = query.order_by(Business.avg_rating.desc())
    elif sort == "views":
        query = query.order_by(Business.view_count.desc())
    elif sort == "premier":
        query = query.order_by(Business.is_premier.desc(), Business.created_at.desc())

    total_q = select(func.count(Business.id)).where(Business.status == "approved")
    if category:
        total_q = total_q.where(Business.category_id == category)
    if city:
        total_q = total_q.where(Business.city.ilike(f"%{city}%"))
    if country:
        total_q = total_q.where(Business.country == country)
    if verified is not None:
        total_q = total_q.where(Business.is_verified == verified)
    if halal_certified is not None:
        total_q = total_q.where(Business.is_halal_certified == halal_certified)
    if premier is not None:
        total_q = total_q.where(Business.is_premier == premier)
    if search:
        total_q = total_q.where(
            or_(
                Business.name.ilike(f"%{search}%"),
                Business.description.ilike(f"%{search}%"),
            )
        )
    total_result = await db.execute(total_q)
    total = total_result.scalar() or 0

    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    businesses = result.scalars().all()

    featured_org_ids: set[str] = set()
    if businesses:
        biz_ids = [b.id for b in businesses]
        now = datetime.now(UTC)
        featured_result = await db.execute(
            select(AdCampaign.organization_id).where(
                AdCampaign.organization_id.in_(biz_ids),
                AdCampaign.campaign_type == "featured_listing",
                AdCampaign.status == "active",
                AdCampaign.start_date <= now,
                AdCampaign.end_date >= now,
                AdCampaign.deleted_at.is_(None),
            )
        )
        featured_org_ids = {str(row[0]) for row in featured_result.all() if row[0]}

    return PaginatedResponse(
        items=[
            BusinessResponse(
                id=str(b.id),
                name=b.name,
                slug=b.slug,
                description=b.description,
                email=b.email,
                phone=b.phone,
                whatsapp=b.whatsapp,
                website=b.website,
                address=b.address,
                city=b.city,
                country=b.country,
                latitude=b.latitude,
                longitude=b.longitude,
                logo_url=b.logo_url,
                cover_image_url=b.cover_image_url,
                avg_rating=b.avg_rating,
                review_count=b.review_count,
                is_verified=b.is_verified,
                is_premier=b.is_premier,
                is_featured=str(b.id) in featured_org_ids,
                status=b.status,
                category_id=str(b.category_id),
                created_at=b.created_at,
            )
            for b in businesses
        ],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size,
    )


import uuid

from sqlalchemy import update


@router.get("/{slug}", response_model=BusinessResponse)
async def get_business(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    try:
        biz_id = uuid.UUID(slug)
        stmt = select(Business).where(or_(Business.id == biz_id, Business.slug == slug))
    except ValueError:
        stmt = select(Business).where(Business.slug == slug)

    result = await db.execute(stmt)
    b = result.scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail="Business not found")

    from app.models.organization import Organization

    await db.execute(
        update(Organization)
        .where(Organization.id == b.id)
        .values(view_count=Organization.view_count + 1)
    )
    await db.commit()
    b.view_count = (b.view_count or 0) + 1

    return BusinessResponse(
        id=str(b.id),
        name=b.name,
        slug=b.slug,
        description=b.description,
        email=b.email,
        phone=b.phone,
        whatsapp=b.whatsapp,
        website=b.website,
        address=b.address,
        city=b.city,
        country=b.country,
        latitude=b.latitude,
        longitude=b.longitude,
        logo_url=b.logo_url,
        cover_image_url=b.cover_image_url,
        avg_rating=b.avg_rating,
        review_count=b.review_count,
        is_verified=b.is_verified,
        is_premier=b.is_premier,
        status=b.status,
        category_id=str(b.category_id),
        created_at=b.created_at,
    )


@router.post("", response_model=BusinessResponse, status_code=201)
@limiter.limit("5/minute")
async def create_business(
    req: BusinessCreate,
    request: Request,
    user: User = Depends(get_current_user),
    _email: User = Depends(require_email_verified()),
    _perm: User = Depends(require_permission("business.create")),
    db: AsyncSession = Depends(get_db),
):
    base_slug = slugify(req.name)
    slug = base_slug
    counter = 1
    while True:
        existing = await db.execute(select(Business).where(Business.slug == slug))
        if not existing.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    business = Business(
        name=req.name,
        slug=slug,
        description=req.description,
        email=req.email,
        phone=req.phone,
        whatsapp=req.whatsapp,
        website=req.website,
        address=req.address,
        city=req.city,
        country=req.country or "Kenya",
        latitude=req.latitude,
        longitude=req.longitude,
        category_id=req.category_id,
        operating_hours=req.operating_hours,
        social_media=req.social_media,
        owner_id=user.id,
        status="pending",
    )
    db.add(business)
    await db.flush()
    await log_action(db, user.id, "business.create", "business", str(business.id))

    return BusinessResponse(
        id=str(business.id),
        name=business.name,
        slug=business.slug,
        description=business.description,
        email=business.email,
        phone=business.phone,
        whatsapp=business.whatsapp,
        website=business.website,
        address=business.address,
        city=business.city,
        country=business.country,
        latitude=business.latitude,
        longitude=business.longitude,
        logo_url=business.logo_url,
        cover_image_url=business.cover_image_url,
        avg_rating=business.avg_rating,
        review_count=business.review_count,
        is_verified=business.is_verified,
        is_premier=business.is_premier,
        status=business.status,
        category_id=str(business.category_id),
        created_at=business.created_at,
    )


MAJOR_FIELDS = {
    "name",
    "description",
    "email",
    "phone",
    "whatsapp",
    "website",
    "address",
    "city",
    "country",
    "category_id",
    "latitude",
    "longitude",
    "operating_hours",
}


@router.put("/{id}", response_model=BusinessResponse)
async def update_business(
    id: str,
    req: BusinessUpdate,
    user: User = Depends(get_current_user),
    _perm: User = Depends(require_permission("business.edit")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Business).where(Business.id == id))
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    if str(business.owner_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your business")

    update_data = req.model_dump(exclude_unset=True)
    changed_major = MAJOR_FIELDS & set(update_data.keys())

    if changed_major and business.status == "approved":
        business.pending_edit = update_data
        business.status = "pending_changes"
        await log_action(
            db,
            user.id,
            "business.major_edit_pending",
            "business",
            id,
            details={"changed_fields": list(changed_major)},
        )
    else:
        for field, value in update_data.items():
            setattr(business, field, value)
        await log_action(db, user.id, "business.update", "business", id)

    return BusinessResponse(
        id=str(business.id),
        name=business.name,
        slug=business.slug,
        description=business.description,
        email=business.email,
        phone=business.phone,
        whatsapp=business.whatsapp,
        website=business.website,
        address=business.address,
        city=business.city,
        country=business.country,
        latitude=business.latitude,
        longitude=business.longitude,
        logo_url=business.logo_url,
        cover_image_url=business.cover_image_url,
        avg_rating=business.avg_rating,
        review_count=business.review_count,
        is_verified=business.is_verified,
        is_premier=business.is_premier,
        status=business.status,
        category_id=str(business.category_id),
        created_at=business.created_at,
    )


@router.get("/{id}/branches", response_model=list[BranchResponse])
async def list_branches(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(BusinessBranch).where(
            BusinessBranch.business_id == id,
            BusinessBranch.is_active,
        )
    )
    branches = result.scalars().all()
    return [
        BranchResponse(
            id=str(b.id),
            name=b.name,
            address=b.address,
            latitude=b.latitude,
            longitude=b.longitude,
            phone=b.phone,
            operating_hours=b.operating_hours,
            manager_name=b.manager_name,
            is_active=b.is_active,
        )
        for b in branches
    ]


@router.post("/{id}/branches", response_model=BranchResponse, status_code=201)
async def create_branch(
    id: str,
    req: BranchCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Business).where(Business.id == id))
    business = result.scalar_one_or_none()
    if not business or str(business.owner_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    branch = BusinessBranch(
        business_id=id,
        name=req.name,
        address=req.address,
        latitude=req.latitude,
        longitude=req.longitude,
        phone=req.phone,
        operating_hours=req.operating_hours,
        manager_name=req.manager_name,
    )
    db.add(branch)
    await db.flush()

    return BranchResponse(
        id=str(branch.id),
        name=branch.name,
        address=branch.address,
        latitude=branch.latitude,
        longitude=branch.longitude,
        phone=branch.phone,
        operating_hours=branch.operating_hours,
        manager_name=branch.manager_name,
        is_active=branch.is_active,
    )


@router.post("/{id}/claim", response_model=MessageResponse)
async def claim_business(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email first")
    result = await db.execute(select(Business).where(Business.id == id))
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    existing = await db.execute(
        select(OwnershipClaim).where(
            OwnershipClaim.organization_id == id,
            OwnershipClaim.claimant_id == user.id,
            OwnershipClaim.status == "pending",
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Claim already submitted")

    claim = OwnershipClaim(organization_id=id, organization_type="business", claimant_id=user.id)
    db.add(claim)
    await log_action(db, user.id, "business.claim", "business", id)
    return {"message": "Ownership claim submitted for review"}


PREMIER_PRICE = Decimal("999.00")


@router.post("/{id}/verification-documents", response_model=dict)
async def upload_verification_document(
    id: str,
    document_type: str,
    file_url: str,
    user: User = Depends(get_current_user),
    _email: User = Depends(require_email_verified()),
    _perm: User = Depends(require_permission("verification.submit")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Business).where(Business.id == id))
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    if str(business.owner_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your business")

    valid_types = {"business_license", "tax_certificate", "id_document", "other"}
    if document_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid document type. Must be one of: {valid_types}",
        )

    existing = await db.execute(
        select(VerificationDocument).where(
            VerificationDocument.organization_id == id,
            VerificationDocument.status == "pending",
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Pending verification documents already exist")

    media = MediaFile(
        file_type="document",
        file_url=file_url,
        organization_id=uuid.UUID(id) if isinstance(id, str) else id,
        user_id=user.id,
    )
    db.add(media)
    await db.flush()

    doc = VerificationDocument(
        document_type=document_type,
        file_url=file_url,
        status="pending",
        organization_id=uuid.UUID(id) if isinstance(id, str) else id,
        user_id=user.id,
    )
    db.add(doc)
    await db.flush()
    await log_action(db, user.id, "business.verification_upload", "business", id)

    return {
        "document_id": str(doc.id),
        "document_type": document_type,
        "status": "pending",
        "message": "Verification documents submitted for review",
    }


@router.get("/{id}/verification-status", response_model=dict)
async def get_verification_status(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Business).where(Business.id == id))
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    if str(business.owner_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your business")

    doc_result = await db.execute(
        select(VerificationDocument)
        .where(
            VerificationDocument.organization_id == id,
        )
        .order_by(VerificationDocument.created_at.desc())
        .limit(5)
    )
    docs = doc_result.scalars().all()

    return {
        "is_verified": business.is_verified,
        "documents": [
            {
                "id": str(d.id),
                "document_type": d.document_type,
                "status": d.status,
                "notes": d.notes,
                "created_at": d.created_at,
            }
            for d in docs
        ],
    }


@router.post("/{id}/premier", response_model=dict)
async def purchase_premier(
    id: str,
    req: PremierPurchase,
    user: User = Depends(get_current_user),
    _email: User = Depends(require_email_verified()),
    _perm: User = Depends(require_permission("subscription.manage")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Business).where(Business.id == id))
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    if str(business.owner_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your business")
    if business.status != "approved":
        raise HTTPException(status_code=400, detail="Business must be approved first")
    if (
        business.is_premier
        and business.premier_expires_at
        and business.premier_expires_at > datetime.now(UTC)
    ):
        raise HTTPException(status_code=400, detail="Business is already premier")

    if req.amount != PREMIER_PRICE:
        raise HTTPException(status_code=400, detail=f"Invalid amount. Expected {PREMIER_PRICE}")

    existing_pending = await db.execute(
        select(PremierSubscription).where(
            PremierSubscription.organization_id == id,
            PremierSubscription.status == "pending",
        )
    )
    if existing_pending.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Pending subscription already exists")

    try:
        gw = get_gateway(req.payment_gateway)
        intent = await gw.create_payment(
            req.amount,
            req.currency,
            {"purpose": "premier", "business_id": id},
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported gateway: {req.payment_gateway}",
        ) from None

    payment = Payment(
        amount=req.amount,
        currency=req.currency,
        gateway=req.payment_gateway,
        gateway_payment_id=intent.gateway_payment_id,
        status="pending",
        user_id=user.id,
    )
    db.add(payment)
    await db.flush()

    subscription = PremierSubscription(
        amount=req.amount,
        currency=req.currency,
        status="pending",
        organization_id=uuid.UUID(id) if isinstance(id, str) else id,
        user_id=user.id,
        payment_id=payment.id,
    )
    db.add(subscription)
    await db.flush()
    await log_action(db, user.id, "premier.purchase", "business", id)

    return {
        "subscription_id": str(subscription.id),
        "payment_id": str(payment.id),
        "gateway_payment_id": intent.gateway_payment_id,
        "client_secret": intent.client_secret,
        "approval_url": intent.approval_url,
        "status": "pending",
    }


@router.post("/{id}/premier/confirm", response_model=MessageResponse)
async def confirm_premier(
    id: str,
    user: User = Depends(get_current_user),
    _perm: User = Depends(require_permission("subscription.manage")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Business).where(Business.id == id))
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    if str(business.owner_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your business")

    sub_result = await db.execute(
        select(PremierSubscription)
        .where(
            PremierSubscription.organization_id == id,
            PremierSubscription.status == "pending",
        )
        .order_by(PremierSubscription.created_at.desc())
    )
    subscription = sub_result.scalar_one_or_none()
    if not subscription:
        raise HTTPException(status_code=400, detail="No pending subscription found")

    payment_result = await db.execute(select(Payment).where(Payment.id == subscription.payment_id))
    payment = payment_result.scalar_one_or_none()

    if payment and payment.status == "succeeded":
        now = datetime.now(UTC)
        subscription.status = "active"
        subscription.start_date = now
        subscription.end_date = now + timedelta(days=30)

        business.is_premier = True
        business.premier_expires_at = subscription.end_date

        await log_action(db, user.id, "premier.activate", "business", id)
        await create_notification(
            db,
            str(user.id),
            "premier.activated",
            "Premier Listing Activated",
            f"Your business '{business.name}' is now a Premier listing for 30 days.",
        )
        return {"message": "Premier subscription activated for 30 days"}

    return {"message": "Payment not yet confirmed", "status": subscription.status}


@router.post("/{id}/deactivate", response_model=MessageResponse)
async def deactivate_business(
    id: str,
    user: User = Depends(get_current_user),
    _perm: User = Depends(require_permission("business.delete")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Business).where(Business.id == id))
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    if str(business.owner_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your business")

    if business.status == "suspended":
        raise HTTPException(status_code=400, detail="Business is already deactivated")

    business.status = "suspended"
    await log_action(db, user.id, "business.deactivate", "business", id)

    return {"message": "Business successfully deactivated"}
