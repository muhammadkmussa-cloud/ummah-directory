import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_favorites_requires_auth(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/favorites")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_list_favorites_empty(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.get("/api/v1/favorites", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_add_favorite(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/favorites",
        params={"resource_type": "business", "resource_id": "00000000-0000-0000-0000-000000000001"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert "Added" in resp.json()["message"]


@pytest.mark.asyncio
async def test_add_duplicate_favorite(api_client: AsyncClient, auth_headers: dict):
    await api_client.post(
        "/api/v1/favorites",
        params={"resource_type": "business", "resource_id": "00000000-0000-0000-0000-000000000001"},
        headers=auth_headers,
    )
    resp = await api_client.post(
        "/api/v1/favorites",
        params={"resource_type": "business", "resource_id": "00000000-0000-0000-0000-000000000001"},
        headers=auth_headers,
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_remove_favorite_not_found(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.delete(
        "/api/v1/favorites/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
    )
    assert resp.status_code == 404
