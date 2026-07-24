import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_active_ads(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/advertisements")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_list_active_ads_by_placement(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/advertisements?placement=sidebar")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_create_ad_requires_auth(api_client: AsyncClient):
    resp = await api_client.post(
        "/api/v1/advertisements?ad_type=banner&title=Test+Ad&placement=sidebar",
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_ad(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/advertisements?ad_type=banner&title=Ramadan+Special&placement=homepage",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert data["message"] == "Ad created"


@pytest.mark.asyncio
async def test_track_impression(api_client: AsyncClient):
    resp = await api_client.post("/api/v1/advertisements/00000000-0000-0000-0000-000000000000/impression")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_track_click(api_client: AsyncClient):
    resp = await api_client.post("/api/v1/advertisements/00000000-0000-0000-0000-000000000000/click")
    assert resp.status_code == 200
