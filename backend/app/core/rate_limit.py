from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.responses import JSONResponse

from app.core.config import settings


def _key_func(request):
    return request.client.host if request.client else "unknown"


limiter = Limiter(key_func=_key_func, enabled=settings.app_env != "test")
