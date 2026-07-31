from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_email_verified, require_permission
from app.core.rate_limit import limiter
from app.models.report import Report
from app.models.user import User
from app.services.audit_service import log_action

router = APIRouter()


import html

ALLOWED_RESOURCE_TYPES = {"business", "mosque", "charity", "education", "event", "review"}
ALLOWED_CATEGORIES = {
    "spam",
    "offensive",
    "incorrect",
    "duplicate",
    "other",
    "fraud",
    "closed",
    "scam",
}


@router.post("")
@limiter.limit("10/minute")
async def create_report(
    resource_type: str,
    resource_id: str,
    category: str,
    request: Request,
    description: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_email_verified()),
    __: User = Depends(require_permission("report.create")),
):
    if resource_type not in ALLOWED_RESOURCE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid resource type. Must be one of: {ALLOWED_RESOURCE_TYPES}",
        )
    if category not in ALLOWED_CATEGORIES:
        raise HTTPException(
            status_code=400, detail=f"Invalid category. Must be one of: {ALLOWED_CATEGORIES}"
        )
    sanitized_desc = html.escape(description.strip())[:1000] if description else None
    report = Report(
        resource_type=resource_type,
        resource_id=resource_id,
        category=category,
        description=sanitized_desc,
        user_id=user.id,
    )
    db.add(report)
    await db.flush()
    await log_action(
        db,
        user.id,
        "report.create",
        resource_type,
        resource_id,
        details={"category": category, "report_id": str(report.id)},
    )
    return {"message": "Report submitted", "id": str(report.id)}
