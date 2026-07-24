from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class FavoriteCreate(BaseModel):
    organization_id: str


class FavoriteResponse(BaseModel):
    id: str
    organization_id: str
    organization_name: str
    organization_type: str
    organization_slug: str
    logo_url: str | None = None
    cover_image_url: str | None = None
    city: str | None = None
    created_at: datetime | None = None


class FavoriteListResponse(BaseModel):
    items: list[FavoriteResponse]
    total: int


class FeedPostResponse(BaseModel):
    id: str
    organization_id: str
    organization_name: str
    organization_type: str
    organization_slug: str
    logo_url: str | None = None
    cover_image_url: str | None = None
    content: str
    image_url: str | None = None
    like_count: int = 0
    is_premier: bool = False
    is_verified: bool = False
    created_at: datetime | None = None


class FeedFavoritesResponse(BaseModel):
    items: list[FeedPostResponse]
    total: int
    page: int
    size: int
    pages: int
