import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_businesses(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/businesses")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_create_business_requires_auth(api_client: AsyncClient):
    resp = await api_client.post("/api/v1/businesses", json={
        "name": "Test Business",
        "description": "A test business",
        "category_id": "00000000-0000-0000-0000-000000000001",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_business(api_client: AsyncClient, auth_headers: dict, sample_category: str):
    resp = await api_client.post("/api/v1/businesses", json={
        "name": "Test Business",
        "description": "A test business",
        "category_id": sample_category,
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Business"


@pytest.mark.asyncio
async def test_get_business_not_found(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/businesses/nonexistent-slug")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_businesses_pagination(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/businesses?page=1&size=10")
    assert resp.status_code == 200
    data = resp.json()
    assert data["page"] == 1
    assert data["size"] == 10
