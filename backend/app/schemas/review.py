from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = None
    image_urls: list[str] = []


class ReviewResponse(BaseModel):
    id: str
    rating: int
    comment: str | None = None
    image_urls: list[str] = []
    status: str = "published"
    is_edited: bool = False
    user_id: str
    user_name: str | None = None
    organization_id: str
    reply: ReviewReplyResponse | None = None
    created_at: datetime | None = None


class ReviewReplyResponse(BaseModel):
    id: str
    content: str
    user_id: str
    created_at: datetime | None = None


class ReviewReplyCreate(BaseModel):
    content: str
