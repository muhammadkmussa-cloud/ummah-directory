import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    get_client_info,
    get_current_user,
    get_current_user_allow_inactive,
    require_role,
)
from app.models.appeal import Appeal
from app.models.organization import Organization
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.services.audit_service import log_action
from app.services.notification_service import create_notification

router = APIRouter()

VALID_TARGET_TYPES = {"user", "organization"}
OPEN_STATUSES = {"pending", "escalated"}


class AppealSubmitRequest(BaseModel):
    target_type: str  # user | organization
    target_id: str | None = None
    reason: str


class AppealDecisionRequest(BaseModel):
    notes: str | None = None


def _serialize(a: Appeal) -> dict:
    return {
        "id": str(a.id),
        "target_type": a.target_type,
        "target_id": str(a.target_id),
        "submitted_by_id": str(a.submitted_by_id),
        "reason": a.reason,
        "status": a.status,
        "moderator_id": str(a.moderator_id) if a.moderator_id else None,
        "moderator_notes": a.moderator_notes,
        "created_at": a.created_at,
        "updated_at": a.updated_at,
    }


@router.post("", response_model=dict)
async def submit_appeal(
    body: AppealSubmitRequest,
    user: User = Depends(get_current_user_allow_inactive),
    db: AsyncSession = Depends(get_db),
):
    if body.target_type not in VALID_TARGET_TYPES:
        raise HTTPException(
            status_code=400,
            detail="target_type must be one of: user, organization",
        )
    if not body.reason or not body.reason.strip():
        raise HTTPException(status_code=400, detail="A reason is required")

    if body.target_type == "user":
        # A user appeals their own suspension.
        if user.is_active:
            raise HTTPException(status_code=400, detail="Your account is not suspended")
        target_id = user.id
    else:
        # An owner appeals the suspension of an organization they own.
        if not body.target_id:
            raise HTTPException(
                status_code=400, detail="target_id is required for organization appeals"
            )
        try:
            target_id = uuid.UUID(body.target_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid target_id format") from None
        org = await db.get(Organization, target_id)
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        if str(org.owner_id) != str(user.id):
            raise HTTPException(status_code=403, detail="Only the organization owner can appeal")
        if org.status != "suspended":
            raise HTTPException(status_code=400, detail="This organization is not suspended")

    # Prevent duplicate open appeals for the same target.
    dup = await db.execute(
        select(Appeal).where(
            Appeal.target_type == body.target_type,
            Appeal.target_id == target_id,
            Appeal.status.in_(OPEN_STATUSES),
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An appeal for this is already under review")

    appeal = Appeal(
        target_type=body.target_type,
        target_id=target_id,
        submitted_by_id=user.id,
        reason=body.reason.strip(),
        status="pending",
    )
    db.add(appeal)
    await db.flush()
    ip, ua = get_client_info(None)
    await log_action(
        db, user.id, "appeal.submit", body.target_type, str(target_id), ip_address=ip, user_agent=ua
    )
    return {
        "id": str(appeal.id),
        "status": "pending",
        "message": "Appeal submitted for review",
    }


@router.get("/mine", response_model=PaginatedResponse)
async def my_appeals(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    base_q = select(Appeal).where(Appeal.submitted_by_id == user.id)
    total = (await db.execute(select(func.count()).select_from(base_q.subquery()))).scalar() or 0
    result = await db.execute(
        base_q.order_by(Appeal.created_at.desc()).offset((page - 1) * size).limit(size)
    )
    return PaginatedResponse(
        items=[_serialize(a) for a in result.scalars().all()],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size,
    )


@router.get("", response_model=PaginatedResponse)
async def list_appeals(
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _mod: User = Depends(require_role("moderator")),
    db: AsyncSession = Depends(get_db),
):
    base_q = select(Appeal)
    if status_filter:
        base_q = base_q.where(Appeal.status == status_filter)
    total = (await db.execute(select(func.count()).select_from(base_q.subquery()))).scalar() or 0
    result = await db.execute(
        base_q.order_by(Appeal.created_at.desc()).offset((page - 1) * size).limit(size)
    )
    return PaginatedResponse(
        items=[_serialize(a) for a in result.scalars().all()],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size,
    )


@router.get("/{appeal_id}", response_model=dict)
async def get_appeal(
    appeal_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    appeal = await db.get(Appeal, uuid.UUID(appeal_id))
    if not appeal:
        raise HTTPException(status_code=404, detail="Appeal not found")
    is_moderator = user.role and user.role.name in {"moderator", "super_admin"}
    if not is_moderator and str(appeal.submitted_by_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view this appeal")
    return _serialize(appeal)


@router.post("/{appeal_id}/approve", response_model=MessageResponse)
async def approve_appeal(
    appeal_id: str,
    body: AppealDecisionRequest | None = None,
    user: User = Depends(require_role("moderator")),
    db: AsyncSession = Depends(get_db),
):
    appeal = await db.get(Appeal, uuid.UUID(appeal_id))
    if not appeal:
        raise HTTPException(status_code=404, detail="Appeal not found")
    if appeal.status not in OPEN_STATUSES:
        raise HTTPException(status_code=400, detail="This appeal has already been decided")

    # Reactivate the suspended target.
    if appeal.target_type == "user":
        target = await db.get(User, appeal.target_id)
        if target:
            target.is_active = True
    else:
        org = await db.get(Organization, appeal.target_id)
        if org:
            org.status = "approved"

    appeal.status = "approved"
    appeal.moderator_id = user.id
    appeal.moderator_notes = body.notes if body else None

    await log_action(db, user.id, "appeal.approve", "appeal", str(appeal.id))
    await create_notification(
        db,
        str(appeal.submitted_by_id),
        "appeal.approved",
        "Appeal approved",
        "Your appeal has been approved and your access restored.",
    )
    return {"message": "Appeal approved"}


@router.post("/{appeal_id}/reject", response_model=MessageResponse)
async def reject_appeal(
    appeal_id: str,
    body: AppealDecisionRequest | None = None,
    user: User = Depends(require_role("moderator")),
    db: AsyncSession = Depends(get_db),
):
    appeal = await db.get(Appeal, uuid.UUID(appeal_id))
    if not appeal:
        raise HTTPException(status_code=404, detail="Appeal not found")
    if appeal.status not in OPEN_STATUSES:
        raise HTTPException(status_code=400, detail="This appeal has already been decided")

    appeal.status = "rejected"
    appeal.moderator_id = user.id
    appeal.moderator_notes = body.notes if body else None

    await log_action(db, user.id, "appeal.reject", "appeal", str(appeal.id))
    await create_notification(
        db,
        str(appeal.submitted_by_id),
        "appeal.rejected",
        "Appeal rejected",
        "Your appeal has been reviewed and was not approved.",
    )
    return {"message": "Appeal rejected"}


@router.post("/{appeal_id}/escalate", response_model=MessageResponse)
async def escalate_appeal(
    appeal_id: str,
    user: User = Depends(require_role("moderator")),
    db: AsyncSession = Depends(get_db),
):
    appeal = await db.get(Appeal, uuid.UUID(appeal_id))
    if not appeal:
        raise HTTPException(status_code=404, detail="Appeal not found")
    if appeal.status not in OPEN_STATUSES:
        raise HTTPException(status_code=400, detail="This appeal has already been decided")

    appeal.status = "escalated"
    appeal.moderator_id = user.id

    await log_action(db, user.id, "appeal.escalate", "appeal", str(appeal.id))
    await create_notification(
        db,
        str(appeal.submitted_by_id),
        "appeal.escalated",
        "Appeal escalated",
        "Your appeal has been escalated for further review.",
    )
    return {"message": "Appeal escalated"}
