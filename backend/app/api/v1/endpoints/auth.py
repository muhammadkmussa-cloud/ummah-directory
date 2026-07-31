from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_client_info, get_current_user
from app.core.rate_limit import limiter
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.notification import NotificationPreference
from app.models.user import Role, User
from app.schemas.auth import (
    EmailVerificationRequest,
    ForgotPasswordRequest,
    LoginRequest,
    PhoneVerificationConfirmRequest,
    PhoneVerificationRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.common import MessageResponse
from app.schemas.user import UserResponse
from app.services.audit_service import log_action
from app.services.email_service import render_email_template, send_email
from app.services.token_service import blacklist_token

router = APIRouter()
serializer = URLSafeTimedSerializer(settings.app_secret_key)

FRONTEND_URL = "https://ummadirectory.com"


@router.post("/register", response_model=MessageResponse, status_code=201)
@limiter.limit("5/minute")
async def register(req: RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Registration failed. Please check your details.")

    if req.phone:
        existing_phone = await db.execute(select(User).where(User.phone == req.phone))
        if existing_phone.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Registration failed. Please check your details.")

    role_result = await db.execute(select(Role).where(Role.name == "registered_user"))
    role = role_result.scalar_one_or_none()
    if not role:
        role = Role(name="registered_user")
        db.add(role)
        await db.flush()

    user = User(
        email=req.email,
        full_name=req.full_name,
        phone=req.phone,
        password_hash=hash_password(req.password),
        role_id=role.id,
    )
    db.add(user)
    await db.flush()

    prefs = NotificationPreference(user_id=user.id)
    db.add(prefs)

    token = serializer.dumps(user.email, salt="email-verify")
    verify_link = f"{FRONTEND_URL}/verify-email?token={token}"
    html = render_email_template("verify_email", link=verify_link)
    await send_email(user.email, "Verify your email", html)
    await log_action(db, user.id, "user.register", "user", str(user.id))

    return {"message": "Registration successful. Please check your email to verify."}


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(req: EmailVerificationRequest, db: AsyncSession = Depends(get_db)):
    try:
        email = serializer.loads(req.token, salt="email-verify", max_age=86400)
    except SignatureExpired:
        raise HTTPException(status_code=400, detail="Verification link expired")
    except BadSignature:
        raise HTTPException(status_code=400, detail="Invalid verification link")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or user.is_email_verified:
        message = "Email already verified" if user else "Verification failed"
        return {"message": message}
    user.is_email_verified = True
    await log_action(db, user.id, "user.verify_email", "user", str(user.id))
    return {"message": "Email verified successfully"}


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user:
        return {"message": "If the email exists, a verification link has been sent"}
    if user.is_email_verified:
        return {"message": "Email already verified"}

    token = serializer.dumps(user.email, salt="email-verify")
    verify_link = f"{FRONTEND_URL}/verify-email?token={token}"
    html = render_email_template("verify_email", link=verify_link)
    await send_email(user.email, "Verify your email", html)
    return {"message": "Verification email sent"}


from app.core.cache import get_redis

MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(req: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    ip, ua = get_client_info(request)

    lockout_key = f"login_lockout:{req.email}"
    attempts_key = f"login_attempts:{req.email}"

    try:
        redis = await get_redis()
        if await redis.get(lockout_key):
            raise HTTPException(
                status_code=429,
                detail=f"Account locked due to multiple failed login attempts. Try again in {LOCKOUT_MINUTES} minutes."
            )
    except HTTPException:
        raise
    except Exception:
        redis = None

    result = await db.execute(
        select(User).options(
            selectinload(User.role).selectinload(Role.permissions)
        ).where(User.email == req.email)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.password_hash):
        if redis:
            try:
                attempts = await redis.incr(attempts_key)
                if attempts == 1:
                    await redis.expire(attempts_key, 3600)

                if attempts >= MAX_LOGIN_ATTEMPTS:
                    await redis.setex(lockout_key, LOCKOUT_MINUTES * 60, "1")
                    await redis.delete(attempts_key)
            except Exception:
                pass

        await log_action(db, None, "user.login_failed", "user", req.email,
                         ip_address=ip, user_agent=ua, outcome="failure")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=401, detail="Account is inactive")

    if redis:
        try:
            await redis.delete(attempts_key)
        except Exception:
            pass

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    payload = decode_token(refresh_token)
    if payload and "jti" in payload and redis:
        try:
            sessions_key = f"active_sessions:{user.id}"
            session_data = {
                "jti": payload["jti"],
                "ip": ip or "unknown",
                "user_agent": ua or "unknown",
                "logged_in_at": datetime.now(UTC).isoformat(),
            }
            import json
            await redis.lpush(sessions_key, json.dumps(session_data))
            await redis.ltrim(sessions_key, 0, 4)
        except Exception:
            pass

    await log_action(db, user.id, "user.login", "user", str(user.id), ip_address=ip, user_agent=ua)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            profile_photo_url=user.profile_photo_url,
            cover_photo_url=user.cover_photo_url,
            bio=user.bio,
            city=user.city,
            country=user.country,
            preferred_language=user.preferred_language,
            is_email_verified=user.is_email_verified,
            role=user.role.name if user.role else "registered_user",
            permissions=[p.codename for p in user.role.permissions] if user.role else [],
            created_at=user.created_at,
        ),
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("10/minute")
async def refresh_token(req: RefreshRequest, request: Request, db: AsyncSession = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    jti = payload.get("jti")
    user_id = payload.get("sub")
    if jti:
        from app.services.token_service import is_token_blacklisted
        if await is_token_blacklisted(jti):
            raise HTTPException(status_code=401, detail="Token has been revoked")

        if user_id:
            try:
                from app.core.cache import get_redis
                r_cli = await get_redis()
                sessions_key = f"active_sessions:{user_id}"
                valid_sessions = await r_cli.lrange(sessions_key, 0, -1)
                valid_sessions_decoded = [s if isinstance(s, str) else s.decode("utf-8") for s in valid_sessions]
                if valid_sessions_decoded and jti not in valid_sessions_decoded:
                    raise HTTPException(status_code=401, detail="Session revoked due to concurrent login limit")
            except HTTPException:
                raise
            except Exception:
                pass

    result = await db.execute(
        select(User).options(
            selectinload(User.role).selectinload(Role.permissions)
        ).where(User.id == user_id, User.is_active)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    exp = payload.get("exp")
    jti = payload.get("jti")
    if exp and isinstance(jti, str):
        from datetime import UTC, datetime
        remaining = datetime.fromtimestamp(exp, tz=UTC) - datetime.now(UTC)
        if remaining > timedelta(0):
            await blacklist_token(jti, remaining)

    access_token = create_access_token({"sub": str(user.id)})
    new_refresh_token = create_refresh_token({"sub": str(user.id)})

    new_payload = decode_token(new_refresh_token)
    if new_payload and "jti" in new_payload and jti:
        try:
            from app.core.cache import get_redis
            r_cli = await get_redis()
            sessions_key = f"active_sessions:{user.id}"
            await r_cli.lrem(sessions_key, 0, jti)
            await r_cli.lpush(sessions_key, new_payload["jti"])
            await r_cli.ltrim(sessions_key, 0, 4)
        except Exception:
            pass

    ip, ua = get_client_info(request)
    await log_action(db, user.id, "user.refresh", "user", str(user.id), ip_address=ip, user_agent=ua)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            profile_photo_url=user.profile_photo_url,
            cover_photo_url=user.cover_photo_url,
            bio=user.bio,
            city=user.city,
            country=user.country,
            preferred_language=user.preferred_language,
            is_email_verified=user.is_email_verified,
            role=user.role.name if user.role else "registered_user",
            permissions=[p.codename for p in user.role.permissions] if user.role else [],
            created_at=user.created_at,
        ),
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        payload = decode_token(auth[7:])
        if payload and payload.get("jti"):
            exp = payload.get("exp")
            if exp:
                from datetime import UTC, datetime
                remaining = datetime.fromtimestamp(exp, tz=UTC) - datetime.now(UTC)
                if remaining > timedelta(0):
                    await blacklist_token(payload["jti"], remaining)

                user_id = payload.get("sub")
                if user_id:
                    try:
                        from app.core.cache import get_redis
                        r_cli = await get_redis()
                        sessions_key = f"active_sessions:{user_id}"
                        import json
                        sessions = await r_cli.lrange(sessions_key, 0, -1)
                        for s in sessions:
                            s_str = s.decode("utf-8") if isinstance(s, bytes) else str(s)
                            try:
                                data = json.loads(s_str)
                                if data.get("jti") == payload.get("jti"):
                                    await r_cli.lrem(sessions_key, 0, s_str)
                                    break
                            except (json.JSONDecodeError, TypeError):
                                await r_cli.lrem(sessions_key, 0, s_str)
                    except Exception:
                        pass

    ip, ua = get_client_info(request)
    await log_action(db, user.id, "user.logout", "user", str(user.id), ip_address=ip, user_agent=ua)
    return {"message": "Logged out successfully"}


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("3/minute")
async def forgot_password(req: ForgotPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user:
        return {"message": "If the email exists, a reset link has been sent"}

    token = serializer.dumps({"email": user.email, "id": str(user.id)}, salt="password-reset")
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    html = render_email_template("password_reset", link=reset_link)
    await send_email(user.email, "Reset your password", html)
    return {"message": "Password reset email sent"}


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def reset_password(req: ResetPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    try:
        data = serializer.loads(req.token, salt="password-reset", max_age=3600)
        if not isinstance(data, dict) or "email" not in data:
            raise BadSignature("Invalid token format")
        email = data["email"]
    except SignatureExpired:
        raise HTTPException(status_code=400, detail="Reset link expired")
    except BadSignature:
        raise HTTPException(status_code=400, detail="Invalid reset link")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return {"message": "Password reset successfully"}

    user.password_hash = hash_password(req.password)
    ip, ua = get_client_info(request)
    await log_action(db, user.id, "user.password_reset", "user", str(user.id), ip_address=ip, user_agent=ua)
    return {"message": "Password reset successfully"}


@router.post("/send-phone-verification", response_model=MessageResponse)
@limiter.limit("3/minute")
async def send_phone_verification(
    req: PhoneVerificationRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.is_phone_verified:
        raise HTTPException(status_code=400, detail="Phone already verified")

    if user.phone and user.phone != req.phone:
        existing = await db.execute(select(User).where(User.phone == req.phone, User.id != user.id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Phone number already in use")

    import random
    code = "".join(random.choices("0123456789", k=6))

    from app.core.cache import get_redis
    redis = await get_redis()
    cache_key = f"phone_verify:{user.id}"
    await redis.setex(cache_key, 300, f"{req.phone}:{code}")

    message = f"Your Umma Directory verification code is: {code}"
    from app.services.sms_service import send_sms
    sent = await send_sms(req.phone, message)
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send verification code. Please try again.")

    return {"message": "Verification code sent"}


@router.post("/verify-phone", response_model=MessageResponse)
@limiter.limit("5/minute")
async def verify_phone(
    req: PhoneVerificationConfirmRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.is_phone_verified:
        return {"message": "Phone already verified"}

    from app.core.cache import get_redis
    redis = await get_redis()
    cache_key = f"phone_verify:{user.id}"
    stored = await redis.get(cache_key)
    if not stored:
        raise HTTPException(status_code=400, detail="Verification code expired. Request a new one.")

    stored_data = stored.decode() if isinstance(stored, bytes) else stored
    stored_phone, stored_code = stored_data.split(":", 1)

    if stored_phone != req.phone:
        raise HTTPException(status_code=400, detail="Phone number mismatch")
    if stored_code != req.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    user.phone = req.phone
    user.is_phone_verified = True
    await redis.delete(cache_key)
    await log_action(db, user.id, "user.phone_verified", "user", str(user.id))
    return {"message": "Phone verified successfully"}
