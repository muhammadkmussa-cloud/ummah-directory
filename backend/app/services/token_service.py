import json
from datetime import timedelta

import redis.asyncio as redis

from app.core.config import settings

_redis: redis.Redis | None = None


async def get_redis() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = redis.from_url(settings.redis_url, decode_responses=True, socket_connect_timeout=2)
    return _redis


async def blacklist_token(jti: str, expires_in: timedelta) -> None:
    try:
        r = await get_redis()
        await r.set(f"token_blacklist:{jti}", "revoked", ex=int(expires_in.total_seconds()))
    except Exception:
        pass


async def is_token_blacklisted(jti: str) -> bool:
    try:
        r = await get_redis()
        return await r.exists(f"token_blacklist:{jti}") == 1
    except Exception:
        return False
