from __future__ import annotations

import asyncio
import json

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.push_subscription import PushSubscription

logger = structlog.get_logger()

# Web Push is an optional capability: the app must keep running even when the
# `pywebpush` package or VAPID keys are not configured.
try:
    from pywebpush import WebPushException, webpush  # type: ignore[import-untyped]

    _PYWEBPUSH_AVAILABLE = True
except ImportError:  # pragma: no cover
    WebPushException = Exception  # type: ignore[misc,assignment]
    webpush = None  # type: ignore[assignment]
    _PYWEBPUSH_AVAILABLE = False


def push_configured() -> bool:
    return _PYWEBPUSH_AVAILABLE and bool(settings.vapid_public_key and settings.vapid_private_key)


def _vapid_claims() -> dict:
    return {"sub": f"mailto:{settings.vapid_subject_email or 'noreply@example.com'}"}


async def send_to_user(db: AsyncSession, user_id: str, payload: dict) -> int:
    """Deliver a push notification to every active subscription for ``user_id``.

    Returns the number of subscriptions delivered to. Stale/invalid
    subscriptions (HTTP 410/404) are removed so we don't keep retrying.
    """
    if not push_configured():
        return 0

    result = await db.execute(select(PushSubscription).where(PushSubscription.user_id == user_id))
    subscriptions = result.scalars().all()
    if not subscriptions:
        return 0

    delivered = 0
    for sub in subscriptions:
        if await _deliver(sub, payload):
            delivered += 1
        else:
            await db.delete(sub)
    return delivered


async def _deliver(subscription: PushSubscription, payload: dict) -> bool:
    data = json.dumps(payload)
    try:
        await asyncio.to_thread(
            webpush,
            subscription_info={
                "endpoint": subscription.endpoint,
                "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
            },
            data=data,
            vapid_private_key=settings.vapid_private_key,
            vapid_claims=_vapid_claims(),
            ttl=86400,
        )
        return True
    except WebPushException as exc:
        status = getattr(exc, "response", None)
        code = getattr(status, "status_code", None) if status is not None else None
        logger.info("push.delivery_failed", code=code, endpoint=subscription.endpoint[:48])
        return False
    except Exception:
        logger.exception("push.unexpected_error")
        return False
