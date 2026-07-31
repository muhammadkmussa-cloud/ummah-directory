import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_track_click_requires_auth(api_client: AsyncClient):
    resp = await api_client.post(
        "/api/v1/analytics/track/click/00000000-0000-0000-0000-000000000001"
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_track_click_invalid_type(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/analytics/track/click/00000000-0000-0000-0000-000000000001",
        params={"click_type": "invalid"},
        headers=auth_headers,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_track_directions(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/analytics/track/directions/00000000-0000-0000-0000-000000000001",
        headers=auth_headers,
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_track_search(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/analytics/track/search",
        params={"query": "test query", "result_count": 5},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert "Tracked" in resp.json()["message"]


@pytest.mark.asyncio
async def test_business_analytics_not_found(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.get(
        "/api/v1/analytics/business/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
    )
    assert resp.status_code == 404
