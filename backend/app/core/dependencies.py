from __future__ import annotations

from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import decode_token
from app.models.mfa import MFAConfig
from app.models.permission import Permission
from app.models.user import Role, User
from app.services.token_service import is_token_blacklisted

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    jti = payload.get("jti")
    if jti and await is_token_blacklisted(jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    result = await db.execute(
        select(User).options(
            selectinload(User.role).selectinload(Role.permissions)
        ).where(User.id == user_id, User.is_active)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    result = await db.execute(select(User).where(User.id == user_id, User.is_active))
    return result.scalar_one_or_none()


def require_role(role_name: str):
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if not user.role or (user.role.name != role_name and user.role.name != "super_admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user
    return role_checker


def require_permission(permission_codename: str):
    async def permission_checker(
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        result = await db.execute(
            select(User).where(User.id == user.id).options(
                selectinload(User.role).selectinload(Role.permissions)
            )
        )
        user_with_perms = result.scalar_one_or_none()
        if not user_with_perms or not user_with_perms.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no role assigned",
            )
        perm_codenames = {p.codename for p in user_with_perms.role.permissions}
        if permission_codename not in perm_codenames and "super_admin" not in perm_codenames:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user
    return permission_checker


def require_email_verified():
    async def check(user: User = Depends(get_current_user)) -> User:
        if not user.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email first",
            )
        return user
    return check


ADMIN_ROLES = {"super_admin", "moderator"}


async def require_mfa_if_admin(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role and user.role.name in ADMIN_ROLES:
        result = await db.execute(select(MFAConfig).where(MFAConfig.user_id == user.id))
        config = result.scalar_one_or_none()
        if not config or not config.is_enabled:
            any_admin_mfa = await db.execute(
                select(MFAConfig).where(MFAConfig.is_enabled).limit(1)
            )
            if any_admin_mfa.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="MFA is required for admin accounts. Please enable MFA first.",
                )
    return user


def get_client_info(request: Request | None) -> tuple[str | None, str | None]:
    if request is None:
        return None, None
    ip = request.client.host if request.client else None
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    ua = request.headers.get("User-Agent")
    return ip, ua

def require_org_access(required_owner: bool = False):
    async def access_checker(
        org_id: str,
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        import uuid
        from app.models.organization import Organization, OrganizationManager
        try:
            org_uuid = uuid.UUID(org_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid organization ID")

        # Admin bypass
        if user.role and user.role.name in {"super_admin"}:
            return user
            
        org = await db.scalar(select(Organization).where(Organization.id == org_uuid))
        if not org:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

        if org.owner_id == user.id:
            return user
            
        if required_owner:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the Primary Owner can perform this action")
            
        manager = await db.scalar(
            select(OrganizationManager).where(
                OrganizationManager.organization_id == org_uuid,
                OrganizationManager.user_id == user.id,
                OrganizationManager.is_active == True
            )
        )
        if manager:
            return user
            
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions for this organization")
    return access_checker
