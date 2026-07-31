import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, with_polymorphic

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_permission
from app.core.rate_limit import limiter
from app.models.business import OwnershipClaim
from app.models.media import MediaFile
from app.models.organization import Organization, OrganizationManager
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.media import MediaResponse
from app.schemas.organization import (
    ManagerAssignRequest,
    OrganizationCreate,
    OrganizationManagerResponse,
    OrganizationResponse,
    OrganizationUpdate,
)
from app.services.audit_service import log_action
from app.services.notification_service import create_notification
from app.utils.crypto import generate_random_token

router = APIRouter()


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-").replace("/", "-")[:200]


@router.get("", response_model=PaginatedResponse)
async def list_organizations(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    organization_type: str | None = None,
    city: str | None = None,
    country: str | None = None,
    verified: bool | None = None,
    search: str | None = None,
    sort: str = "newest",
    db: AsyncSession = Depends(get_db),
):
    org_polymorphic = with_polymorphic(Organization, "*")
    query = select(org_polymorphic).where(Organization.status == "approved")

    if organization_type:
        query = query.where(Organization.organization_type == organization_type)
    if city:
        query = query.where(Organization.city.ilike(f"%{city}%"))
    if country:
        query = query.where(Organization.country == country)
    if verified is not None:
        query = query.where(Organization.is_verified == verified)
    if search:
        query = query.where(
            or_(
                Organization.name.ilike(f"%{search}%"),
                Organization.description.ilike(f"%{search}%"),
            )
        )

    if sort == "newest":
        query = query.order_by(Organization.created_at.desc())
    elif sort == "oldest":
        query = query.order_by(Organization.created_at.asc())
    elif sort == "rating":
        query = query.order_by(Organization.avg_rating.desc())
    elif sort == "views":
        query = query.order_by(Organization.view_count.desc())

    # Need total count
    from sqlalchemy import func

    total_q = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(total_q)
    total = total_result.scalar() or 0

    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    organizations = result.scalars().all()

    return PaginatedResponse(
        items=[OrganizationResponse.model_validate(org) for org in organizations],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size,
    )


@router.get("/{slug}", response_model=OrganizationResponse)
async def get_organization(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    org_polymorphic = with_polymorphic(Organization, "*")
    result = await db.execute(select(org_polymorphic).where(Organization.slug == slug))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    await db.execute(
        update(Organization)
        .where(Organization.id == org.id)
        .values(view_count=Organization.view_count + 1)
    )
    await db.refresh(org)

    return OrganizationResponse.model_validate(org)


@router.put("/{id}", response_model=OrganizationResponse)
async def update_organization(
    id: uuid.UUID,
    req: OrganizationUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Organization)
        .where(Organization.id == id)
        .options(selectinload(Organization.managers))
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    is_owner = str(org.owner_id) == str(user.id)
    is_manager = any(
        str(m.user_id) == str(user.id) and m.role in ("manager", "editor") for m in org.managers
    )

    if not (is_owner or is_manager):
        raise HTTPException(status_code=403, detail="Not authorized to update this organization")

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(org, field, value)

    await log_action(db, user.id, "organization.update", "organization", str(id))
    await db.flush()

    return OrganizationResponse.model_validate(org)


@router.delete("/{id}", response_model=MessageResponse)
async def delete_organization(
    id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if str(org.owner_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Only the owner can delete this organization")

    await db.delete(org)
    await log_action(db, user.id, "organization.delete", "organization", str(id))
    return {"message": "Organization deleted"}


# --- Media ---


@router.get("/{id}/media")
async def list_organization_media(
    id: uuid.UUID,
    file_type: str | None = Query(None, pattern="^(image|document)$"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    org = await db.get(Organization, id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    base_q = (
        select(MediaFile)
        .where(MediaFile.organization_id == id)
        .order_by(MediaFile.sort_order, MediaFile.created_at.desc())
    )
    if file_type:
        base_q = base_q.where(MediaFile.file_type == file_type)

    from sqlalchemy import func

    total = (await db.execute(select(func.count()).select_from(base_q.subquery()))).scalar() or 0
    result = await db.execute(base_q.offset((page - 1) * size).limit(size))
    items = [
        MediaResponse(
            id=str(m.id),
            file_type=m.file_type,
            file_url=m.file_url,
            thumbnail_url=m.thumbnail_url,
            file_size=m.file_size,
            mime_type=m.mime_type,
            alt_text=m.alt_text,
            sort_order=m.sort_order,
            created_at=m.created_at,
        )
        for m in result.scalars().all()
    ]
    return PaginatedResponse(
        items=items, total=total, page=page, size=size, pages=(total + size - 1) // size
    )


# --- Managers ---


@router.get("/{id}/manager", response_model=OrganizationManagerResponse)
async def get_manager(
    id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Organization)
        .where(Organization.id == id)
        .options(selectinload(Organization.managers))
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    is_owner = str(org.owner_id) == str(user.id)
    is_manager = any(str(m.user_id) == str(user.id) for m in org.managers)

    if not (
        is_owner or is_manager or (user.role and user.role.name in {"super_admin", "moderator"})
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    manager = next(iter(org.managers), None)
    if not manager:
        raise HTTPException(status_code=404, detail="No manager assigned")

    return OrganizationManagerResponse.model_validate(manager)


@router.post("/{id}/manager", response_model=OrganizationManagerResponse)
async def assign_manager(
    id: uuid.UUID,
    req: ManagerAssignRequest,
    user: User = Depends(get_current_user),
    _perm: User = Depends(require_permission("staff.invite")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Organization)
        .where(Organization.id == id)
        .options(selectinload(Organization.managers))
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if str(org.owner_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Only the owner can assign a manager")

    # Find the target user by email
    target_user_result = await db.execute(select(User).where(User.email == req.email))
    target_user = target_user_result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User with this email is not registered")

    if str(target_user.id) == str(org.owner_id):
        raise HTTPException(status_code=400, detail="The owner cannot be assigned as a manager")

    # If a manager already exists, remove them
    for m in org.managers:
        await db.delete(m)

    # Assign new manager
    new_manager = OrganizationManager(organization_id=id, user_id=target_user.id, role="manager")
    db.add(new_manager)
    await db.flush()

    await log_action(
        db,
        user.id,
        "organization.manager_assigned",
        "organization",
        str(id),
        details={"new_manager_id": str(target_user.id)},
    )

    await create_notification(
        db,
        str(target_user.id),
        "organization.manager_assigned",
        "Assigned as Manager",
        f"You have been assigned as the manager for '{org.name}'.",
    )

    return OrganizationManagerResponse.model_validate(new_manager)


@router.delete("/{id}/manager", response_model=MessageResponse)
async def remove_manager(
    id: uuid.UUID,
    user: User = Depends(get_current_user),
    _perm: User = Depends(require_permission("staff.remove")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Organization)
        .where(Organization.id == id)
        .options(selectinload(Organization.managers))
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if str(org.owner_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Only the owner can remove the manager")

    if not org.managers:
        raise HTTPException(status_code=400, detail="No manager assigned")

    for m in org.managers:
        await db.delete(m)

    await log_action(db, user.id, "organization.manager_removed", "organization", str(id))

    return {"message": "Manager removed successfully"}


@router.post("/{id}/claim", response_model=MessageResponse)
async def claim_organization(
    id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email first")

    org = await db.get(Organization, id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    if str(org.owner_id) == str(user.id):
        raise HTTPException(status_code=400, detail="You already own this organization")

    existing = await db.execute(
        select(OwnershipClaim).where(
            OwnershipClaim.organization_id == id,
            OwnershipClaim.claimant_id == user.id,
            OwnershipClaim.status == "pending",
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Claim already submitted")

    claim = OwnershipClaim(
        organization_id=id,
        organization_type=org.organization_type,
        claimant_id=user.id,
    )
    db.add(claim)
    await log_action(db, user.id, "organization.claim", "organization", str(id))
    return {"message": "Ownership claim submitted for review"}
