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
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_add_favorite(
    api_client: AsyncClient, auth_headers: dict, sample_category: str
):
    biz = await api_client.post(
        "/api/v1/businesses",
        json={"name": "Favorite Business", "category_id": sample_category},
        headers=auth_headers,
    )
    assert biz.status_code == 201
    org_id = biz.json()["id"]

    resp = await api_client.post(
        "/api/v1/favorites",
        json={"organization_id": org_id},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert "Added" in resp.json()["message"]


@pytest.mark.asyncio
async def test_add_duplicate_favorite(
    api_client: AsyncClient, auth_headers: dict, sample_category: str
):
    biz = await api_client.post(
        "/api/v1/businesses",
        json={"name": "Duplicate Favorite", "category_id": sample_category},
        headers=auth_headers,
    )
    assert biz.status_code == 201
    org_id = biz.json()["id"]

    await api_client.post(
        "/api/v1/favorites",
        json={"organization_id": org_id},
        headers=auth_headers,
    )
    resp = await api_client.post(
        "/api/v1/favorites",
        json={"organization_id": org_id},
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
