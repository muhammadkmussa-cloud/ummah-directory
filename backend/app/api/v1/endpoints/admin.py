from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_client_info, require_mfa_if_admin, require_role
from app.models.ad_campaign import AdCampaign
from app.models.ad_analytics import AdAnalytics
from app.models.advertisement import Advertisement
from app.models.audit import AuditLog
from app.models.business import Business, Category, OwnershipClaim
from app.models.charity import Charity
from app.models.cms import CMSPage
from app.models.cms import CMSBanner
from app.models.education import EducationalInstitution
from app.models.mosque import Mosque
from app.models.organization import Organization
from app.models.payment import PaymentProvider
from app.models.report import Report
from app.models.review import Review
from app.models.user import User
from app.models.verification import VerificationDocument
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.admin import (
    ReasonRequest, UserRoleRequest, ResolveReportRequest, 
    CategoryCreateRequest, CategoryUpdateRequest, 
    CMSPageCreateRequest, CMSPageUpdateRequest
)
from app.services.audit_service import log_action
from app.services.notification_service import create_notification

ALLOWED_ACTIONS = {"dismissed", "warning", "content_removed", "user_suspended", "escalated"}


def sanitize_text(text: str, max_length: int = 500) -> str:
    import html
    return html.escape(text.strip())[:max_length]


router = APIRouter(dependencies=[Depends(require_mfa_if_admin)])


@router.get("/dashboard")
async def admin_dashboard(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    def count(model):
        return select(func.count()).select_from(model)

    counts = {}
    for key, model in [
        ("total_users", User), ("total_businesses", Business),
        ("total_mosques", Mosque), ("total_charities", Charity),
        ("total_education", EducationalInstitution),
    ]:
        r = await db.execute(count(model))
        counts[key] = r.scalar() or 0

    pending = {}
    for key, model, status_col in [
        ("pending_businesses", Business, Business.status),
        ("pending_mosques", Mosque, Mosque.status),
        ("pending_charities", Charity, Charity.status),
        ("pending_education", EducationalInstitution, EducationalInstitution.status),
    ]:
        col = status_col
        r = await db.execute(count(model).where(col == "pending"))
        pending[key] = r.scalar() or 0

    r = await db.execute(count(Report).where(Report.status == "pending"))
    pending_reports = r.scalar() or 0

    r = await db.execute(count(OwnershipClaim).where(OwnershipClaim.status == "pending"))
    pending_claims = r.scalar() or 0

    return {
        **counts,
        **pending,
        "pending_reports": pending_reports,
        "pending_claims": pending_claims,
    }


@router.get("/users", response_model=list)
async def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("super_admin")),
):
    query = select(User).options(selectinload(User.role)).offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    users = result.scalars().all()
    return [{"id": str(u.id), "email": u.email, "full_name": u.full_name,
             "is_active": u.is_active, "is_email_verified": u.is_email_verified,
             "role": u.role.name if u.role else None} for u in users]


@router.post("/users/{id}/suspend", response_model=MessageResponse)
async def toggle_user_suspend(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("super_admin")),
):
    result = await db.execute(select(User).where(User.id == id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.is_active = not target.is_active
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "user.suspend" if not target.is_active else "user.unsuspend",
                     "user", id, ip_address=ip, user_agent=ua)
    return {"message": "User updated"}


@router.put("/users/{id}/role", response_model=MessageResponse)
async def change_user_role(
    id: str,
    req: UserRoleRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("super_admin")),
):
    from sqlalchemy import select as sel

    from app.models.user import Role
    result = await db.execute(sel(User).where(User.id == id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    role_name = req.role_name
    role_result = await db.execute(sel(Role).where(Role.name == role_name))
    role = role_result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=400, detail=f"Role '{role_name}' not found")
    target.role_id = role.id
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "user.role_change", "user", id,
                     details={"new_role": role_name}, ip_address=ip, user_agent=ua)
    return {"message": f"User role changed to {role_name}"}


@router.get("/organizations", response_model=list)
async def list_all_organizations(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("moderator")),
    status: str | None = None
):
    query = select(Organization).limit(500)
    if status:
        query = query.where(Organization.status == status)
    result = await db.execute(query)
    return [{"id": str(o.id), "name": o.name, "slug": o.slug,
             "organization_type": o.organization_type, "city": o.city, "status": o.status} for o in result.scalars().all()]

@router.get("/organizations/pending", response_model=list)
async def list_pending_organizations(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("moderator")),
):
    result = await db.execute(
        select(Organization).where(Organization.status == "pending").limit(100)
    )
    return [{"id": str(o.id), "name": o.name, "slug": o.slug,
             "organization_type": o.organization_type, "city": o.city} for o in result.scalars().all()]


@router.post("/organizations/{id}/approve", response_model=MessageResponse)
async def approve_organization(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    result = await db.execute(select(Organization).where(Organization.id == id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    org.status = "approved"
    ip, ua = get_client_info(None)
    await log_action(db, user.id, f"{org.organization_type}.approve", "organization", id, ip_address=ip, user_agent=ua)
    await create_notification(
        db, str(org.owner_id), f"{org.organization_type}.approved",
        "Organization approved",
        f"Your {org.organization_type} '{org.name}' has been approved.",
    )
    return {"message": "Organization approved"}


@router.post("/organizations/{id}/reject", response_model=MessageResponse)
async def reject_organization(
    id: str,
    req: ReasonRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    reason = req.reason
    result = await db.execute(select(Organization).where(Organization.id == id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    org.status = "rejected"
    ip, ua = get_client_info(None)
    await log_action(db, user.id, f"{org.organization_type}.reject", "organization", id,
                     details={"reason": sanitize_text(reason)}, ip_address=ip, user_agent=ua)
    await create_notification(
        db, str(org.owner_id), f"{org.organization_type}.rejected",
        "Organization rejected",
        f"Your {org.organization_type} '{org.name}' has been rejected.{' Reason: ' + sanitize_text(reason) if reason else ''}",
    )
    return {"message": "Organization rejected"}


@router.post("/organizations/{id}/suspend", response_model=MessageResponse)
async def suspend_organization(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    result = await db.execute(select(Organization).where(Organization.id == id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    org.status = "suspended"
    ip, ua = get_client_info(None)
    await log_action(db, user.id, f"{org.organization_type}.suspend", "organization", id, ip_address=ip, user_agent=ua)
    return {"message": "Organization suspended"}


@router.post("/organizations/{id}/restore", response_model=MessageResponse)
async def restore_organization(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    result = await db.execute(select(Organization).where(Organization.id == id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    org.status = "approved"
    ip, ua = get_client_info(None)
    await log_action(db, user.id, f"{org.organization_type}.restore", "organization", id, ip_address=ip, user_agent=ua)
    return {"message": "Organization restored"}


@router.get("/businesses/pending-edits", response_model=list)
async def list_pending_edits(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("moderator")),
):
    result = await db.execute(
        select(Business).where(Business.status == "pending_changes").limit(50)
    )
    return [{
        "id": str(b.id), "name": b.name, "slug": b.slug,
        "pending_edit": b.pending_edit,
        "created_at": b.created_at,
    } for b in result.scalars().all()]


@router.post("/businesses/{id}/approve-edit", response_model=MessageResponse)
async def approve_business_edit(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    result = await db.execute(select(Business).where(Business.id == id))
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    if business.status != "pending_changes" or not business.pending_edit:
        raise HTTPException(status_code=400, detail="No pending edits")

    for field, value in business.pending_edit.items():
        setattr(business, field, value)
    business.pending_edit = None
    business.status = "approved"
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "business.edit_approved", "business", id,
                     ip_address=ip, user_agent=ua)
    return {"message": "Pending edits approved and applied"}


@router.post("/businesses/{id}/reject-edit", response_model=MessageResponse)
async def reject_business_edit(
    id: str,
    req: ReasonRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    reason = req.reason
    result = await db.execute(select(Business).where(Business.id == id))
    business = result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    if business.status != "pending_changes":
        raise HTTPException(status_code=400, detail="No pending edits")

    business.pending_edit = None
    business.status = "approved"
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "business.edit_rejected", "business", id,
                     details={"reason": sanitize_text(reason)}, ip_address=ip, user_agent=ua)
    return {"message": "Pending edits rejected"}


@router.get("/verification-documents", response_model=list)
async def list_verification_documents(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("moderator")),
):
    result = await db.execute(
        select(VerificationDocument)
        .options(
            selectinload(VerificationDocument.organization),
            selectinload(VerificationDocument.user),
        )
        .where(VerificationDocument.status == "pending")
        .limit(50)
    )
    docs = result.scalars().all()
    return [{
        "id": str(d.id), "document_type": d.document_type,
        "file_url": d.file_url, "status": d.status,
        "organization_id": str(d.organization_id),
        "organization_name": d.organization.name if d.organization else None,
        "user_name": d.user.full_name,
        "created_at": d.created_at,
    } for d in docs]


@router.post("/verification-documents/{id}/approve", response_model=MessageResponse)
async def approve_verification_document(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    result = await db.execute(
        select(VerificationDocument).options(selectinload(VerificationDocument.organization))
        .where(VerificationDocument.id == id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.status = "approved"
    doc.reviewed_by = user.id
    if doc.organization:
        doc.organization.is_verified = True
    ip, ua = get_client_info(None)
    await log_action(
        db, user.id, "organization.verification_approved", "organization", str(doc.organization_id),
        ip_address=ip, user_agent=ua,
    )
    await create_notification(
        db, str(doc.user_id), "verification.approved",
        "Verification approved",
        f"Your verification documents have been approved.",
    )
    return {"message": "Verification documents approved, organization is now verified"}


@router.post("/verification-documents/{id}/reject", response_model=MessageResponse)
async def reject_verification_document(
    id: str,
    req: ReasonRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    reason = req.reason
    result = await db.execute(
        select(VerificationDocument).options(selectinload(VerificationDocument.organization))
        .where(VerificationDocument.id == id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.status = "rejected"
    doc.reviewed_by = user.id
    doc.notes = sanitize_text(reason)
    ip, ua = get_client_info(None)
    await log_action(
        db, user.id, "organization.verification_rejected", "organization", str(doc.organization_id),
        details={"reason": sanitize_text(reason)}, ip_address=ip, user_agent=ua,
    )
    await create_notification(
        db, str(doc.user_id), "verification.rejected",
        "Verification rejected",
        f"Your verification documents have been rejected.{' Reason: ' + sanitize_text(reason) if reason else ''}",
    )
    return {"message": "Verification documents rejected"}



@router.get("/reviews", response_model=list)
async def list_all_reviews(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    result = await db.execute(select(Review).limit(500))
    return [{"id": str(r.id), "rating": r.rating, "comment": r.comment, "status": r.status} for r in result.scalars().all()]

@router.get("/payment-providers", response_model=list)
async def list_payment_providers(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("super_admin")),
):
    result = await db.execute(select(PaymentProvider))
    return [{"id": str(p.id), "name": p.name, "is_active": p.is_active, "credentials": p.credentials} for p in result.scalars().all()]

from pydantic import BaseModel
class PaymentProviderCreate(BaseModel):
    name: str
    is_active: bool = True
    credentials: dict | None = None

@router.post("/payment-providers", response_model=dict)
async def save_payment_provider(
    data: PaymentProviderCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("super_admin")),
):
    result = await db.execute(select(PaymentProvider).where(PaymentProvider.name == data.name))
    provider = result.scalar_one_or_none()
    if provider:
        provider.is_active = data.is_active
        provider.credentials = data.credentials
    else:
        provider = PaymentProvider(name=data.name, is_active=data.is_active, credentials=data.credentials)
        db.add(provider)
    await db.flush()
    return {"id": str(provider.id), "name": provider.name, "is_active": provider.is_active}

@router.post("/reviews/{id}/remove", response_model=MessageResponse)
async def remove_review(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    result = await db.execute(select(Review).where(Review.id == id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.status = "removed"
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "review.remove", "review", id, ip_address=ip, user_agent=ua)
    return {"message": "Review removed"}


@router.post("/reviews/{id}/restore", response_model=MessageResponse)
async def restore_review(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    result = await db.execute(select(Review).where(Review.id == id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.status = "published"
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "review.restore", "review", id, ip_address=ip, user_agent=ua)
    return {"message": "Review restored"}


@router.get("/claims", response_model=list)
async def list_claims(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    result = await db.execute(
        select(OwnershipClaim)
        .options(selectinload(OwnershipClaim.claimant), selectinload(OwnershipClaim.business))
        .where(OwnershipClaim.status == "pending")
        .limit(50)
    )
    claims = result.scalars().all()
    return [{
        "id": str(c.id),
        "business_id": str(c.business_id),
        "business_name": c.business.name,
        "claimant_id": str(c.claimant_id),
        "claimant_name": c.claimant.full_name,
        "status": c.status,
        "created_at": c.created_at,
    } for c in claims]


@router.post("/claims/{id}/approve", response_model=MessageResponse)
async def approve_claim(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    result = await db.execute(
        select(OwnershipClaim).options(selectinload(OwnershipClaim.business))
        .where(OwnershipClaim.id == id)
    )
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status != "pending":
        raise HTTPException(status_code=400, detail="Claim already processed")

    claim.status = "approved"
    claim.reviewed_by = user.id
    claim.business.owner_id = claim.claimant_id
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "claim.approve", "claim", id, ip_address=ip, user_agent=ua)
    await create_notification(
        db, str(claim.claimant_id), "claim.approved",
        "Ownership claim approved",
        f"Your claim for '{claim.business.name}' has been approved. You are now the owner.",
    )
    return {"message": "Claim approved, ownership transferred"}


@router.post("/claims/{id}/reject", response_model=MessageResponse)
async def reject_claim(
    id: str,
    req: ReasonRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    reason = req.reason
    result = await db.execute(select(OwnershipClaim).where(OwnershipClaim.id == id))
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status != "pending":
        raise HTTPException(status_code=400, detail="Claim already processed")

    claim.status = "rejected"
    claim.reviewed_by = user.id
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "claim.reject", "claim", id,
                     details={"reason": sanitize_text(reason)}, ip_address=ip, user_agent=ua)
    await create_notification(
        db, str(claim.claimant_id), "claim.rejected",
        "Ownership claim rejected",
        f"Your claim for '{claim.business.name}' has been rejected.{' Reason: ' + sanitize_text(reason) if reason else ''}",
    )
    return {"message": "Claim rejected"}


@router.get("/reports", response_model=list)
async def list_reports(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    result = await db.execute(
        select(Report).where(Report.status == "pending")
        .options(selectinload(Report.user), selectinload(Report.resolver))
        .offset((page - 1) * size).limit(size)
    )
    reports = result.scalars().all()
    return [{
        "id": str(r.id), "resource_type": r.resource_type,
        "resource_id": r.resource_id, "category": r.category,
        "description": r.description,
        "reporter_name": r.user.full_name if r.user else None,
        "created_at": r.created_at,
    } for r in reports]


@router.post("/reports/{id}/resolve", response_model=MessageResponse)
async def resolve_report(
    id: str,
    req: ResolveReportRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    action_taken = req.action_taken
    result = await db.execute(select(Report).where(Report.id == id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if action_taken not in ALLOWED_ACTIONS:
        raise HTTPException(status_code=400, detail=f"Invalid action. Must be one of: {ALLOWED_ACTIONS}")
    report.status = "resolved"
    report.resolved_by = user.id
    ip, ua = get_client_info(None)
    await log_action(db, user.id, f"report.resolve.{action_taken}", "report", id,
                     ip_address=ip, user_agent=ua)
    return {"message": f"Report resolved ({action_taken})"}


@router.get("/audit-logs", response_model=list)
async def list_audit_logs(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("super_admin")),
):
    result = await db.execute(
        select(AuditLog)
        .options(selectinload(AuditLog.user))
        .order_by(AuditLog.created_at.desc())
        .offset((page - 1) * size).limit(size)
    )
    logs = result.scalars().all()
    return [{
        "id": str(l.id), "action": l.action,
        "resource_type": l.resource_type, "resource_id": l.resource_id,
        "details": l.details, "ip_address": l.ip_address,
        "user_agent": l.user_agent, "outcome": l.outcome,
        "user_name": l.user.full_name if l.user else None,
        "created_at": l.created_at,
    } for l in logs]


@router.get("/categories", response_model=list)
async def admin_list_categories(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    result = await db.execute(select(Category).order_by(Category.sort_order))
    return [{"id": str(c.id), "name": c.name, "slug": c.slug,
             "parent_id": str(c.parent_id) if c.parent_id else None,
             "is_active": c.is_active, "sort_order": c.sort_order} for c in result.scalars().all()]


@router.post("/categories", response_model=MessageResponse)
async def admin_create_category(
    req: CategoryCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    category = Category(name=req.name, slug=req.slug, parent_id=req.parent_id)
    db.add(category)
    await db.flush()
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "category.create", "category", str(category.id),
                     ip_address=ip, user_agent=ua)
    return {"message": "Category created"}


@router.put("/categories/{id}", response_model=MessageResponse)
async def admin_update_category(
    id: str, req: CategoryUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    result = await db.execute(select(Category).where(Category.id == id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if req.name is not None:
        category.name = req.name
    if req.is_active is not None:
        category.is_active = req.is_active
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "category.update", "category", id, ip_address=ip, user_agent=ua)
    return {"message": "Category updated"}


@router.delete("/categories/{id}", response_model=MessageResponse)
async def admin_delete_category(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("super_admin")),
):
    result = await db.execute(select(Category).where(Category.id == id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    category.soft_delete()
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "category.delete", "category", id, ip_address=ip, user_agent=ua)
    return {"message": "Category deleted"}


@router.get("/cms-pages", response_model=list)
async def admin_list_cms_pages(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    result = await db.execute(select(CMSPage).order_by(CMSPage.title))
    return [{"id": str(p.id), "title": p.title, "slug": p.slug,
             "is_published": p.is_published} for p in result.scalars().all()]


@router.post("/cms-pages", response_model=MessageResponse)
async def admin_create_cms_page(
    req: CMSPageCreateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    page = CMSPage(title=req.title, slug=req.slug, content=req.content)
    db.add(page)
    await db.flush()
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "cms.create", "cms_page", str(page.id), ip_address=ip, user_agent=ua)
    return {"message": "CMS page created"}


@router.put("/cms-pages/{id}", response_model=MessageResponse)
async def admin_update_cms_page(
    id: str,
    req: CMSPageUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    result = await db.execute(select(CMSPage).where(CMSPage.id == id))
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="CMS page not found")
    if req.title is not None:
        page.title = req.title
    if req.content is not None:
        page.content = req.content
    if req.is_published is not None:
        page.is_published = req.is_published
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "cms.update", "cms_page", id, ip_address=ip, user_agent=ua)
    return {"message": "CMS page updated"}


@router.delete("/cms-pages/{id}", response_model=MessageResponse)
async def admin_delete_cms_page(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("super_admin")),
):
    result = await db.execute(select(CMSPage).where(CMSPage.id == id))
    page = result.scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="CMS page not found")
    page.soft_delete()
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "cms.delete", "cms_page", id, ip_address=ip, user_agent=ua)
    return {"message": "CMS page deleted"}


@router.get("/advertisements/pending", response_model=list)
async def list_pending_ads(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("moderator")),
):
    result = await db.execute(
        select(Advertisement).where(Advertisement.status == "pending").limit(50)
    )
    return [{"id": str(a.id), "title": a.title, "ad_type": a.ad_type,
             "placement": a.placement} for a in result.scalars().all()]


@router.post("/advertisements/{id}/approve", response_model=MessageResponse)
async def approve_ad(
    id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    result = await db.execute(select(Advertisement).where(Advertisement.id == id))
    ad = result.scalar_one_or_none()
    if not ad:
        raise HTTPException(status_code=404, detail="Ad not found")
    ad.status = "approved"
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "advertisement.approve", "advertisement", id, ip_address=ip, user_agent=ua)
    await create_notification(
        db, str(ad.advertiser_id), "advertisement.approved",
        "Ad approved",
        f"Your advertisement '{ad.title}' has been approved.",
    )
    return {"message": "Ad approved"}


@router.post("/advertisements/{id}/reject", response_model=MessageResponse)
async def reject_ad(
    id: str,
    req: ReasonRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    reason = req.reason
    result = await db.execute(select(Advertisement).where(Advertisement.id == id))
    ad = result.scalar_one_or_none()
    if not ad:
        raise HTTPException(status_code=404, detail="Ad not found")
    ad.status = "rejected"
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "advertisement.reject", "advertisement", id,
                     details={"reason": sanitize_text(reason)}, ip_address=ip, user_agent=ua)
    await create_notification(
        db, str(ad.advertiser_id), "advertisement.rejected",
        "Ad rejected",
        f"Your advertisement '{ad.title}' has been rejected.{' Reason: ' + sanitize_text(reason) if reason else ''}",
    )
    return {"message": "Ad rejected"}


@router.get("/campaigns")
async def admin_list_campaigns(
    status: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    query = select(AdCampaign).options(
        selectinload(AdCampaign.organization),
    ).order_by(AdCampaign.created_at.desc())
    if status:
        query = query.where(AdCampaign.status == status)
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar()
    items = (await db.execute(query.offset((page - 1) * size).limit(size))).scalars().all()
    return {
        "items": [{
            "id": c.id,
            "name": c.name,
            "campaign_type": c.campaign_type,
            "status": c.status,
            "organization_name": c.organization.name if c.organization else None,
            "budget_amount": c.budget_amount,
            "budget_type": c.budget_type,
            "start_date": c.start_date.isoformat(),
            "end_date": c.end_date.isoformat(),
            "created_at": c.created_at.isoformat(),
        } for c in items],
        "total": total,
        "page": page,
        "size": size,
    }


@router.post("/campaigns/{id}/approve")
async def admin_approve_campaign(
    id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    campaign = (await db.execute(
        select(AdCampaign).where(AdCampaign.id == id).options(selectinload(AdCampaign.organization))
    )).scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.status != "pending_review":
        raise HTTPException(status_code=400, detail="Campaign is not pending review")
    campaign.status = "active"
    campaign.approved_at = func.now()
    campaign.approved_by = user.id
    await db.commit()
    org_name = campaign.organization.name if campaign.organization else "Unknown"
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "campaign.approve", "ad_campaign", id,
                     details={"campaign_name": campaign.name}, ip_address=ip, user_agent=ua)
    await create_notification(
        db, str(campaign.organization.owner_id), "campaign.approved",
        "Campaign Approved",
        f"Your campaign '{campaign.name}' has been approved and is now active.",
    )
    return {"message": "Campaign approved"}


@router.post("/campaigns/{id}/reject")
async def admin_reject_campaign(
    id: int,
    body: ReasonRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("moderator")),
):
    campaign = (await db.execute(
        select(AdCampaign).where(AdCampaign.id == id).options(selectinload(AdCampaign.organization))
    )).scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.status != "pending_review":
        raise HTTPException(status_code=400, detail="Campaign is not pending review")
    campaign.status = "rejected"
    await db.commit()
    org_name = campaign.organization.name if campaign.organization else "Unknown"
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "campaign.reject", "ad_campaign", id,
                     details={"campaign_name": campaign.name, "reason": body.reason}, ip_address=ip, user_agent=ua)
    await create_notification(
        db, str(campaign.organization.owner_id), "campaign.rejected",
        "Campaign Rejected",
        f"Your campaign '{campaign.name}' has been rejected.{' Reason: ' + body.reason if body.reason else ''}",
    )
    return {"message": "Campaign rejected"}
