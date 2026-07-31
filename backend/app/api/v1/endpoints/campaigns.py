from __future__ import annotations

from datetime import UTC, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_email_verified, require_permission
from app.models.ad_analytics import AdAnalytics
from app.models.ad_campaign import AdCampaign
from app.models.organization import Organization
from app.models.user import User
from app.schemas.ad_campaign import (
    AdFeedItem,
    AdFeedResponse,
    AdSpotlightResponse,
    CampaignCreate,
    CampaignListResponse,
    CampaignPayRequest,
    CampaignResponse,
    CampaignSubmitResponse,
    CampaignUpdate,
)

router = APIRouter()


async def _verify_org_owner(org_id: str, user: User, db: AsyncSession) -> Organization:
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org or org.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


def _campaign_to_response(c: AdCampaign) -> CampaignResponse:
    return CampaignResponse(
        id=str(c.id),
        name=c.name,
        campaign_type=c.campaign_type,
        status=c.status,
        organization_id=str(c.organization_id) if c.organization_id else None,
        organization_name=c.organization.name if c.organization else None,
        organization_slug=c.organization.slug if c.organization else None,
        headline=c.headline,
        description=c.description,
        cta_type=c.cta_type,
        media_url=c.media_url,
        destination_url=c.destination_url,
        budget_type=c.budget_type,
        budget_amount=c.budget_amount,
        spent=c.spent,
        start_date=c.start_date,
        end_date=c.end_date,
        target_country=c.target_country,
        target_city=c.target_city,
        target_categories=c.target_categories.get("categories") if c.target_categories else None,
        impressions=c.impressions,
        clicks=c.clicks,
        rejection_reason=c.rejection_reason,
        created_at=c.created_at,
    )


@router.get("/organizations/{org_id}/campaigns", response_model=CampaignListResponse)
async def list_campaigns(
    org_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _verify_org_owner(org_id, user, db)
    result = await db.execute(
        select(AdCampaign)
        .where(AdCampaign.organization_id == org_id)
        .order_by(AdCampaign.created_at.desc())
    )
    campaigns = result.scalars().all()
    return CampaignListResponse(
        items=[_campaign_to_response(c) for c in campaigns],
        total=len(campaigns),
    )


@router.get("/owner/campaigns", response_model=CampaignListResponse)
async def list_owner_campaigns(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_ids = select(Organization.id).where(Organization.owner_id == user.id)
    result = await db.execute(
        select(AdCampaign)
        .options(selectinload(AdCampaign.organization))
        .where(AdCampaign.organization_id.in_(org_ids))
        .order_by(AdCampaign.created_at.desc())
    )
    campaigns = result.scalars().all()
    return CampaignListResponse(
        items=[_campaign_to_response(c) for c in campaigns],
        total=len(campaigns),
    )


@router.post("/organizations/{org_id}/campaigns", response_model=CampaignResponse, status_code=201)
async def create_campaign(
    org_id: str,
    body: CampaignCreate,
    user: User = Depends(get_current_user),
    _email: User = Depends(require_email_verified()),
    _perm: User = Depends(require_permission("campaign.create")),
    db: AsyncSession = Depends(get_db),
):
    org = await _verify_org_owner(org_id, user, db)

    if body.start_date >= body.end_date:
        raise HTTPException(status_code=422, detail="start_date must be before end_date")

    if body.campaign_type == "featured_listing":
        existing = await db.execute(
            select(AdCampaign).where(
                AdCampaign.organization_id == org_id,
                AdCampaign.campaign_type == "featured_listing",
                AdCampaign.status.in_(["pending_review", "active"]),
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=409,
                detail="Organization already has an active or pending featured listing campaign",
            )

    campaign = AdCampaign(
        name=body.name,
        campaign_type=body.campaign_type,
        status="draft",
        organization_id=org.id,
        advertiser_id=user.id,
        headline=body.headline,
        description=body.description,
        cta_type=body.cta_type,
        media_url=body.media_url,
        destination_url=body.destination_url,
        budget_type=body.budget_type,
        budget_amount=body.budget_amount,
        start_date=body.start_date,
        end_date=body.end_date,
        target_country=body.target_country,
        target_city=body.target_city,
        target_categories={"categories": body.target_categories}
        if body.target_categories
        else None,
        placement_config={"category_id": body.target_categories[0]}
        if body.campaign_type == "category_spotlight" and body.target_categories
        else None,
    )
    db.add(campaign)
    await db.flush()
    # Load organization for response
    campaign.organization = org
    return _campaign_to_response(campaign)


@router.get("/campaigns/{id}", response_model=CampaignResponse)
async def get_campaign(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AdCampaign).options(selectinload(AdCampaign.organization)).where(AdCampaign.id == id)
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    org = await db.execute(select(Organization).where(Organization.id == campaign.organization_id))
    org_record = org.scalar_one_or_none()
    if not org_record or (org_record.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Campaign not found")

    return _campaign_to_response(campaign)


@router.put("/campaigns/{id}", response_model=CampaignResponse)
async def update_campaign(
    id: str,
    body: CampaignUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AdCampaign).options(selectinload(AdCampaign.organization)).where(AdCampaign.id == id)
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    org = await db.execute(select(Organization).where(Organization.id == campaign.organization_id))
    org_record = org.scalar_one_or_none()
    if not org_record or org_record.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status != "draft":
        raise HTTPException(status_code=422, detail="Only draft campaigns can be edited")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "target_categories" and value is not None:
            setattr(campaign, field, {"categories": value})
        else:
            setattr(campaign, field, value)

    return _campaign_to_response(campaign)


@router.post("/campaigns/{id}/submit", response_model=CampaignSubmitResponse)
async def submit_campaign(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AdCampaign).where(AdCampaign.id == id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    org = await db.execute(select(Organization).where(Organization.id == campaign.organization_id))
    org_record = org.scalar_one_or_none()
    if not org_record or org_record.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status != "draft":
        raise HTTPException(
            status_code=422, detail=f"Cannot submit campaign in status '{campaign.status}'"
        )

    campaign.status = "pending_review"
    return CampaignSubmitResponse(
        message="Campaign submitted for review",
        campaign_id=str(campaign.id),
        status=campaign.status,
    )


@router.post("/campaigns/{id}/pay", response_model=dict)
async def pay_campaign(
    id: str,
    body: CampaignPayRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AdCampaign).where(AdCampaign.id == id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    org = await db.execute(select(Organization).where(Organization.id == campaign.organization_id))
    org_record = org.scalar_one_or_none()
    if not org_record or org_record.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status not in ("pending_review", "draft"):
        raise HTTPException(
            status_code=422, detail=f"Cannot pay for campaign in status '{campaign.status}'"
        )

    from app.models.payment import Payment

    payment = Payment(
        amount=campaign.budget_amount,
        currency=body.currency or "KES",
        gateway=body.payment_gateway,
        status="pending",
        reference_type="ad_campaign",
        reference_id=str(campaign.id),
        user_id=user.id,
    )
    db.add(payment)
    await db.flush()

    if campaign.status == "draft":
        campaign.status = "pending_review"

    return {
        "message": "Payment initiated",
        "payment_id": str(payment.id),
        "amount": str(campaign.budget_amount),
        "currency": body.currency or "KES",
        "gateway": body.payment_gateway,
    }


@router.post("/campaigns/{id}/activate", response_model=CampaignSubmitResponse)
async def activate_campaign(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AdCampaign).where(AdCampaign.id == id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    org = await db.execute(select(Organization).where(Organization.id == campaign.organization_id))
    org_record = org.scalar_one_or_none()
    if not org_record or org_record.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Campaign not found")

    from sqlalchemy import and_

    from app.models.payment import Payment

    payment_result = await db.execute(
        select(Payment).where(
            and_(
                Payment.reference_type == "ad_campaign",
                Payment.reference_id == str(campaign.id),
                Payment.status == "succeeded",
            )
        )
    )
    payment = payment_result.scalar_one_or_none()
    if not payment:
        raise HTTPException(
            status_code=402, detail="Payment required. Complete payment before activating."
        )

    if campaign.status not in ("pending_review", "draft"):
        raise HTTPException(
            status_code=422, detail=f"Cannot activate campaign in status '{campaign.status}'"
        )

    campaign.status = "active"
    return CampaignSubmitResponse(
        message="Campaign activated", campaign_id=str(campaign.id), status=campaign.status
    )


@router.post("/campaigns/{id}/cancel", response_model=CampaignSubmitResponse)
async def cancel_campaign(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AdCampaign).where(AdCampaign.id == id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    org = await db.execute(select(Organization).where(Organization.id == campaign.organization_id))
    org_record = org.scalar_one_or_none()
    if not org_record or org_record.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status not in ("active", "paused", "pending_review"):
        raise HTTPException(
            status_code=422, detail=f"Cannot cancel campaign in status '{campaign.status}'"
        )

    campaign.status = "cancelled"
    return CampaignSubmitResponse(
        message="Campaign cancelled", campaign_id=str(campaign.id), status=campaign.status
    )


@router.delete("/campaigns/{id}", response_model=dict)
async def delete_campaign(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AdCampaign).where(AdCampaign.id == id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    org = await db.execute(select(Organization).where(Organization.id == campaign.organization_id))
    org_record = org.scalar_one_or_none()
    if not org_record or org_record.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status != "draft":
        raise HTTPException(status_code=422, detail="Only draft campaigns can be deleted")

    await db.delete(campaign)
    return {"message": "Campaign deleted"}


@router.get("/ads/feed", response_model=AdFeedResponse)
async def get_feed_ads(
    size: int = 5,
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(UTC)
    result = await db.execute(
        select(AdCampaign)
        .options(selectinload(AdCampaign.organization))
        .where(
            AdCampaign.campaign_type == "feed_ad",
            AdCampaign.status == "active",
            AdCampaign.start_date <= now,
            AdCampaign.end_date >= now,
            AdCampaign.deleted_at.is_(None),
        )
        .order_by(func.random())
        .limit(size)
    )
    campaigns = result.scalars().all()
    return AdFeedResponse(
        items=[
            AdFeedItem(
                id=str(c.id),
                headline=c.headline or c.name,
                description=c.description,
                cta_type=c.cta_type,
                media_url=c.media_url,
                destination_url=c.destination_url,
                organization_id=str(c.organization_id) if c.organization_id else None,
                organization_name=c.organization.name if c.organization else None,
                organization_slug=c.organization.slug if c.organization else None,
            )
            for c in campaigns
        ]
    )


@router.get("/ads/spotlight", response_model=AdSpotlightResponse | None)
async def get_category_spotlight(
    category_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(UTC)
    query = (
        select(AdCampaign)
        .options(selectinload(AdCampaign.organization))
        .where(
            AdCampaign.campaign_type == "category_spotlight",
            AdCampaign.status == "active",
            AdCampaign.start_date <= now,
            AdCampaign.end_date >= now,
            AdCampaign.deleted_at.is_(None),
        )
    )
    if category_id:
        query = query.where(AdCampaign.placement_config["category_id"].as_string() == category_id)
    query = query.order_by(func.random()).limit(1)
    result = await db.execute(query)
    c = result.scalar_one_or_none()
    if not c:
        return None
    return {
        "id": str(c.id),
        "headline": c.headline or c.name,
        "description": c.description,
        "cta_type": c.cta_type,
        "media_url": c.media_url,
        "destination_url": c.destination_url,
        "organization_id": str(c.organization_id) if c.organization_id else None,
        "organization_name": c.organization.name if c.organization else None,
        "organization_slug": c.organization.slug if c.organization else None,
    }


@router.post("/campaigns/{id}/impression")
async def track_impression(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AdCampaign).where(AdCampaign.id == id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign.impressions += 1

    today = func.current_date()
    analytics = await db.execute(
        select(AdAnalytics).where(
            AdAnalytics.campaign_id == id,
            AdAnalytics.date == today,
        )
    )
    row = analytics.scalar_one_or_none()
    if row:
        row.impressions += 1
    else:
        db.add(AdAnalytics(campaign_id=id, date=today, impressions=1))
    return {"message": "Tracked"}


@router.post("/campaigns/{id}/click")
async def track_click(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AdCampaign).where(AdCampaign.id == id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign.clicks += 1

    today = func.current_date()
    analytics = await db.execute(
        select(AdAnalytics).where(
            AdAnalytics.campaign_id == id,
            AdAnalytics.date == today,
        )
    )
    row = analytics.scalar_one_or_none()
    if row:
        row.clicks += 1
    else:
        db.add(AdAnalytics(campaign_id=id, date=today, clicks=1))
    return {"message": "Tracked"}


@router.post("/campaigns/{id}/pause", response_model=CampaignSubmitResponse)
async def pause_campaign(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AdCampaign).where(AdCampaign.id == id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    org = await db.execute(select(Organization).where(Organization.id == campaign.organization_id))
    org_record = org.scalar_one_or_none()
    if not org_record or org_record.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status != "active":
        raise HTTPException(
            status_code=422,
            detail=f"Can only pause active campaigns, current status: {campaign.status}",
        )

    campaign.status = "paused"
    return CampaignSubmitResponse(
        message="Campaign paused", campaign_id=str(campaign.id), status=campaign.status
    )


@router.post("/campaigns/{id}/resume", response_model=CampaignSubmitResponse)
async def resume_campaign(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AdCampaign).where(AdCampaign.id == id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    org = await db.execute(select(Organization).where(Organization.id == campaign.organization_id))
    org_record = org.scalar_one_or_none()
    if not org_record or org_record.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status != "paused":
        raise HTTPException(
            status_code=422,
            detail=f"Can only resume paused campaigns, current status: {campaign.status}",
        )

    if campaign.end_date and campaign.end_date < datetime.now(UTC):
        raise HTTPException(
            status_code=422, detail="Campaign end date has passed, please renew instead"
        )

    campaign.status = "active"
    return CampaignSubmitResponse(
        message="Campaign resumed", campaign_id=str(campaign.id), status=campaign.status
    )


@router.post("/campaigns/{id}/renew", response_model=dict)
async def renew_campaign(
    id: str,
    days: int = 30,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AdCampaign).where(AdCampaign.id == id))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    org = await db.execute(select(Organization).where(Organization.id == campaign.organization_id))
    org_record = org.scalar_one_or_none()
    if not org_record or org_record.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status not in ("active", "completed", "paused"):
        raise HTTPException(
            status_code=422, detail=f"Cannot renew campaign in status: {campaign.status}"
        )

    from datetime import timedelta

    now = datetime.now(UTC)
    new_end = max(campaign.end_date or now, now) + timedelta(days=days)

    campaign.end_date = new_end
    if campaign.status in ("completed", "paused"):
        campaign.status = "pending_review"

    return {
        "message": f"Campaign renewed for {days} days",
        "campaign_id": str(campaign.id),
        "status": campaign.status,
        "end_date": new_end.isoformat(),
    }
