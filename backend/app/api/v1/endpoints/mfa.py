import pyotp
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_client_info, get_current_user
from app.core.security import verify_password
from app.models.mfa import MFAConfig
from app.models.user import User
from app.schemas.common import MessageResponse
from app.services.audit_service import log_action

router = APIRouter()


@router.post("/setup", response_model=dict)
async def setup_mfa(
    password: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid password")

    result = await db.execute(select(MFAConfig).where(MFAConfig.user_id == user.id))
    config = result.scalar_one_or_none()
    if config and config.is_enabled:
        raise HTTPException(status_code=400, detail="MFA already enabled")

    secret = pyotp.random_base32()
    if not config:
        config = MFAConfig(user_id=user.id, secret=secret)
        db.add(config)
    else:
        config.secret = secret
    await db.flush()

    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=user.email, issuer_name="Umma Directory")
    return {"secret": secret, "provisioning_uri": provisioning_uri}


@router.post("/verify", response_model=MessageResponse)
async def verify_mfa(
    password: str,
    code: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid password")

    result = await db.execute(select(MFAConfig).where(MFAConfig.user_id == user.id))
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=400, detail="MFA not set up")

    totp = pyotp.TOTP(config.secret)
    if not totp.verify(code):
        raise HTTPException(status_code=400, detail="Invalid code")

    config.is_enabled = True
    await db.flush()
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "mfa.enable", "user", str(user.id), ip_address=ip, user_agent=ua)
    return {"message": "MFA enabled successfully"}


@router.post("/disable", response_model=MessageResponse)
async def disable_mfa(
    password: str,
    code: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid password")

    result = await db.execute(select(MFAConfig).where(MFAConfig.user_id == user.id))
    config = result.scalar_one_or_none()
    if not config or not config.is_enabled:
        raise HTTPException(status_code=400, detail="MFA not enabled")

    totp = pyotp.TOTP(config.secret)
    if not totp.verify(code):
        raise HTTPException(status_code=400, detail="Invalid code")

    config.is_enabled = False
    await db.flush()
    ip, ua = get_client_info(None)
    await log_action(db, user.id, "mfa.disable", "user", str(user.id), ip_address=ip, user_agent=ua)
    return {"message": "MFA disabled"}


@router.get("/status", response_model=dict)
async def mfa_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(MFAConfig).where(MFAConfig.user_id == user.id))
    config = result.scalar_one_or_none()
    return {"mfa_enabled": config.is_enabled if config else False}
