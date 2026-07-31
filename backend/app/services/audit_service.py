import uuid

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog


async def log_action(
    db: AsyncSession,
    user_id: uuid.UUID | str | None,
    action: str,
    resource_type: str | None = None,
    resource_id: uuid.UUID | str | int | None = None,
    details: dict | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    outcome: str = "success",
) -> AuditLog:
    parsed_user_id: uuid.UUID | None = None
    if isinstance(user_id, uuid.UUID):
        parsed_user_id = user_id
    elif isinstance(user_id, str) and user_id.strip():
        try:
            parsed_user_id = uuid.UUID(user_id)
        except ValueError:
            parsed_user_id = None

    parsed_resource_id: str = ""
    if resource_id is not None:
        parsed_resource_id = str(resource_id)

    log = AuditLog(
        user_id=parsed_user_id,
        action=action,
        resource_type=resource_type,
        resource_id=parsed_resource_id,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
        outcome=outcome,
    )
    db.add(log)
    await db.flush()
    return log


def get_audit_context(request: Request | None) -> tuple[str | None, str | None]:
    if request is None:
        return None, None
    ip = request.client.host if request.client else None
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    ua = request.headers.get("User-Agent")
    return ip, ua
