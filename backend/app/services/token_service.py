from datetime import timedelta

import structlog

from app.core.cache import get_redis

logger = structlog.get_logger()


async def blacklist_token(jti: str, expires_in: timedelta) -> None:
    try:
        r = await get_redis()
        await r.set(f"token_blacklist:{jti}", "revoked", ex=int(expires_in.total_seconds()))
    except Exception:
        # Fail open for availability: if Redis is unavailable we cannot record
        # the revocation, so the token remains valid until it expires. The short
        # access-token TTL (default 15 minutes) bounds that exposure. We log the
        # failure so it can be alerted on rather than failing silently.
        logger.warning("token.blacklist_failed", jti=jti)


async def is_token_blacklisted(jti: str) -> bool:
    try:
        r = await get_redis()
        return await r.exists(f"token_blacklist:{jti}") == 1
    except Exception:
        # Same availability trade-off as blacklist_token: assume not revoked so
        # a transient Redis outage does not lock out every user.
        logger.warning("token.blacklist_check_failed", jti=jti)
        return False
