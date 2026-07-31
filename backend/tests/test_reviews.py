import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_reviews_requires_business_id(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/reviews/business/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data


@pytest.mark.asyncio
async def test_create_review_requires_auth(api_client: AsyncClient):
    resp = await api_client.post(
        "/api/v1/reviews/business/00000000-0000-0000-0000-000000000000",
        json={
            "rating": 5,
            "comment": "Great place!",
        },
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_review_with_invalid_rating(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/reviews/business/00000000-0000-0000-0000-000000000000",
        json={"rating": 6, "comment": "Too high"},
        headers=auth_headers,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_review_negative_rating(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/reviews/business/00000000-0000-0000-0000-000000000000",
        json={"rating": 0, "comment": "Too low"},
        headers=auth_headers,
    )
    assert resp.status_code == 422
