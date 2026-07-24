from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable
from typing import TypeVar
from functools import wraps

T = TypeVar("T")

logger = logging.getLogger(__name__)


async def retry_async(
    func: Callable[..., Awaitable[T]],
    *args,
    max_attempts: int = 3,
    base_delay: float = 1.0,
    backoff: float = 2.0,
    exceptions: tuple[type[Exception], ...] = (Exception,),
    **kwargs,
) -> T:
    last_exc = None
    for attempt in range(max_attempts):
        try:
            return await func(*args, **kwargs)
        except exceptions as e:
            last_exc = e
            if attempt < max_attempts - 1:
                delay = base_delay * (backoff ** attempt)
                logger.warning(
                    "Retry attempt %d/%d for %s after error: %s",
                    attempt + 1, max_attempts, func.__name__, e,
                )
                await asyncio.sleep(delay)
    raise last_exc  # type: ignore


def with_retry(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    backoff: float = 2.0,
    exceptions: tuple[type[Exception], ...] = (Exception,),
):
    def decorator(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await retry_async(
                func, *args,
                max_attempts=max_attempts,
                base_delay=base_delay,
                backoff=backoff,
                exceptions=exceptions,
                **kwargs,
            )
        return wrapper
    return decorator
