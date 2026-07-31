from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from itsdangerous import URLSafeTimedSerializer
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import decode_token, hash_password, verify_password
from app.models.business import OwnershipClaim
from app.models.donation import Donation
from app.models.event import SavedEvent
from app.models.favorite import Favorite
from app.models.notification import Notification
from app.models.organization import Organization
from app.models.review import Review
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.user import ChangePasswordRequest, UserResponse, UserUpdateRequest
from app.services.audit_service import log_action
from app.services.email_service import render_email_template, send_email
from app.services.token_service import blacklist_token

router = APIRouter()
serializer = URLSafeTimedSerializer(settings.app_secret_key)
FRONTEND_URL = "https://ummadirectory.com"


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return UserResponse(
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
    )


@router.patch("/me", response_model=UserResponse)
async def update_me(
    req: UserUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.full_name is not None:
        user.full_name = req.full_name
    if req.phone is not None:
        existing = await db.execute(select(User).where(User.phone == req.phone, User.id != user.id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Phone already in use")
        user.phone = req.phone
    if req.email is not None and req.email != user.email:
        existing = await db.execute(select(User).where(User.email == req.email, User.id != user.id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = req.email
        user.is_email_verified = False
        token = serializer.dumps(user.email, salt="email-verify")
        verify_link = f"{FRONTEND_URL}/verify-email?token={token}"
        html = render_email_template("verify_email", link=verify_link)
        await send_email(user.email, "Verify your new email", html)
    if req.preferred_language is not None:
        user.preferred_language = req.preferred_language
    if req.profile_photo_url is not None:
        user.profile_photo_url = req.profile_photo_url
    if req.cover_photo_url is not None:
        user.cover_photo_url = req.cover_photo_url
    if req.bio is not None:
        user.bio = req.bio
    if req.city is not None:
        user.city = req.city
    if req.country is not None:
        user.country = req.country

    await log_action(db, user.id, "user.profile_update", "user", str(user.id))
    return UserResponse(
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
    )


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    req: ChangePasswordRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(req.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.password_hash = hash_password(req.new_password)

    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        payload = decode_token(auth[7:])
        if payload and payload.get("jti"):
            exp = payload.get("exp")
            if exp:
                remaining = datetime.fromtimestamp(exp, tz=UTC) - datetime.now(UTC)
                if remaining > timedelta(0):
                    await blacklist_token(payload["jti"], remaining)

    await log_action(db, user.id, "user.password_change", "user", str(user.id))
    return {"message": "Password changed successfully"}


@router.get("/dashboard")
async def user_dashboard(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import func

    fav_count = await db.execute(select(func.count(Favorite.id)).where(Favorite.user_id == user.id))
    review_count = await db.execute(select(func.count(Review.id)).where(Review.user_id == user.id))
    donation_count = await db.execute(
        select(func.count(Donation.id)).where(Donation.donor_id == user.id)
    )
    organization_count = await db.execute(
        select(func.count(Organization.id)).where(Organization.owner_id == user.id)
    )
    unread_notif = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == user.id,
            Notification.is_read == False,  # noqa: E712
        )
    )
    claim_count = await db.execute(
        select(func.count(OwnershipClaim.id)).where(OwnershipClaim.claimant_id == user.id)
    )
    pending_org_count = await db.execute(
        select(func.count(Organization.id)).where(
            Organization.owner_id == user.id, Organization.status == "pending"
        )
    )
    claim_pending_count = await db.execute(
        select(func.count(OwnershipClaim.id)).where(
            OwnershipClaim.claimant_id == user.id, OwnershipClaim.status == "pending"
        )
    )

    from sqlalchemy import or_

    from app.models.ad_campaign import AdCampaign

    org_ids_subq = select(Organization.id).where(Organization.owner_id == user.id)
    active_campaign_count = await db.execute(
        select(func.count(AdCampaign.id)).where(
            AdCampaign.organization_id.in_(org_ids_subq),
            AdCampaign.status == "active",
            AdCampaign.deleted_at.is_(None),
        )
    )
    total_campaign_count = await db.execute(
        select(func.count(AdCampaign.id)).where(
            AdCampaign.organization_id.in_(org_ids_subq),
            AdCampaign.deleted_at.is_(None),
        )
    )

    recent_notifs = await db.execute(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(5)
    )
    recent_donations = await db.execute(
        select(Donation)
        .where(Donation.donor_id == user.id)
        .order_by(Donation.created_at.desc())
        .limit(5)
    )
    user_organizations = await db.execute(
        select(Organization)
        .where(Organization.owner_id == user.id)
        .order_by(Organization.created_at.desc())
        .limit(10)
    )

    return {
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "profile_photo_url": user.profile_photo_url,
            "cover_photo_url": user.cover_photo_url,
            "bio": user.bio,
            "city": user.city,
            "country": user.country,
            "preferred_language": user.preferred_language,
            "is_email_verified": user.is_email_verified,
            "role": user.role.name if user.role else "registered_user",
            "created_at": user.created_at,
        },
        "stats": {
            "favorites": fav_count.scalar() or 0,
            "reviews": review_count.scalar() or 0,
            "donations": donation_count.scalar() or 0,
            "organizations": organization_count.scalar() or 0,
            "unread_notifications": unread_notif.scalar() or 0,
            "ownership_claims": claim_count.scalar() or 0,
            "pending_organizations": pending_org_count.scalar() or 0,
            "pending_claims": claim_pending_count.scalar() or 0,
            "active_campaigns": active_campaign_count.scalar() or 0,
            "total_campaigns": total_campaign_count.scalar() or 0,
        },
        "organizations": [
            {
                "id": str(o.id),
                "name": o.name,
                "slug": o.slug,
                "status": o.status,
                "is_verified": o.is_verified,
                "organization_type": o.organization_type,
            }
            for o in user_organizations.scalars().all()
        ],
        "notifications": [
            {
                "id": str(n.id),
                "type": n.type,
                "title": n.title,
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at,
            }
            for n in recent_notifs.scalars().all()
        ],
        "recent_donations": [
            {
                "id": str(d.id),
                "amount": str(d.amount),
                "currency": d.currency,
                "status": d.status,
                "receipt_number": d.receipt_number,
                "created_at": d.created_at,
            }
            for d in recent_donations.scalars().all()
        ],
    }


@router.post("/me/deactivate", response_model=MessageResponse)
async def deactivate_account(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is already deactivated")
    user.is_active = False
    await log_action(db, user.id, "user.deactivate", "user", str(user.id))
    return {"message": "Account deactivated successfully"}


@router.get("/me/sessions")
async def get_active_sessions(
    user: User = Depends(get_current_user),
):
    try:
        import json

        from app.core.cache import get_redis

        redis = await get_redis()
        sessions_key = f"active_sessions:{user.id}"
        raw = await redis.lrange(sessions_key, 0, -1)
        sessions = []
        for s in raw:
            try:
                data = json.loads(s)
            except (json.JSONDecodeError, TypeError):
                continue
            is_current = False
            sessions.append(
                {
                    "jti": data.get("jti"),
                    "ip_address": data.get("ip"),
                    "user_agent": data.get("user_agent"),
                    "logged_in_at": data.get("logged_in_at"),
                    "is_current": is_current,
                }
            )
        return {"sessions": sessions}
    except Exception:
        return {"sessions": []}


@router.post("/me/sessions/logout-all", response_model=MessageResponse)
async def logout_all_sessions(
    user: User = Depends(get_current_user),
    request: Request = None,  # type: ignore[assignment]
    db: AsyncSession = Depends(get_db),
):
    try:
        import json

        from app.core.cache import get_redis

        redis = await get_redis()
        sessions_key = f"active_sessions:{user.id}"
        raw = await redis.lrange(sessions_key, 0, -1)
        current_jti = None
        auth = request.headers.get("Authorization", "") if request else ""
        if auth.startswith("Bearer "):
            from app.core.security import decode_token

            payload = decode_token(auth[7:])
            if payload:
                current_jti = payload.get("jti")

        for s in raw:
            try:
                data = json.loads(s)
                jti = data.get("jti")
                if jti and jti != current_jti:
                    from datetime import timedelta

                    from app.services.token_service import blacklist_token

                    await blacklist_token(jti, timedelta(hours=24))
            except (json.JSONDecodeError, TypeError):
                pass

        await redis.delete(sessions_key)
        if current_jti:
            session_data = {
                "jti": current_jti,
                "ip": "current",
                "user_agent": "current",
                "logged_in_at": datetime.now(UTC).isoformat(),
            }
            await redis.lpush(sessions_key, json.dumps(session_data))

        await log_action(db, user.id, "user.logout_all_sessions", "user", str(user.id))
        return {"message": "All other sessions logged out"}
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to log out sessions") from None


@router.get("/me/login-history")
async def get_login_history(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.audit import AuditLog

    base_q = (
        select(AuditLog)
        .where(
            AuditLog.user_id == user.id,
            AuditLog.action == "user.login",
        )
        .order_by(AuditLog.created_at.desc())
    )

    total = (await db.execute(select(func.count()).select_from(base_q.subquery()))).scalar() or 0
    result = await db.execute(base_q.offset((page - 1) * size).limit(size))

    return {
        "items": [
            {
                "id": str(log.id),
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "created_at": log.created_at,
            }
            for log in result.scalars().all()
        ],
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size if total > 0 else 0,
    }


@router.get("/me/saved-events")
async def get_saved_events(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavedEvent)
        .where(SavedEvent.user_id == user.id)
        .options(selectinload(SavedEvent.event))
        .order_by(SavedEvent.created_at.desc())
    )
    items = []
    for s in result.scalars().all():
        e = s.event
        items.append(
            {
                "id": str(s.id),
                "event_id": str(e.id),
                "event_title": e.title,
                "event_slug": e.slug,
                "event_date": e.event_date,
                "event_time": e.event_time,
                "venue": e.venue,
                "cover_image_url": e.cover_image_url,
                "category": e.category,
                "created_at": s.created_at,
            }
        )
    return {"items": items}


@router.get("/me/organizations")
async def get_my_organizations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.organization import OrganizationManager

    # Organizations owned by the user
    owned = await db.execute(select(Organization).where(Organization.owner_id == user.id))

    # Organizations managed by the user
    managed = await db.execute(
        select(Organization).join(OrganizationManager).where(OrganizationManager.user_id == user.id)
    )

    def format_org(o, role="owner"):
        return {
            "id": str(o.id),
            "name": o.name,
            "slug": o.slug,
            "organization_type": o.organization_type,
            "logo_url": o.logo_url,
            "is_verified": o.is_verified,
            "status": o.status,
            "role": role,
        }

    orgs = [format_org(o, "owner") for o in owned.scalars().all()]
    orgs.extend([format_org(o, "manager") for o in managed.scalars().all()])

    # Deduplicate in case owner is also a manager somehow
    seen = set()
    result = []
    for org in orgs:
        if org["id"] not in seen:
            seen.add(org["id"])
            result.append(org)

    return {"organizations": result}
