from datetime import datetime

from pydantic import BaseModel


class MediaResponse(BaseModel):
    id: str
    file_type: str
    file_url: str
    thumbnail_url: str | None = None
    file_size: int | None = None
    mime_type: str | None = None
    alt_text: str | None = None
    sort_order: int = 0
    created_at: datetime | None = None
