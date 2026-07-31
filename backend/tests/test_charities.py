import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_charities(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/charities")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_create_charity_requires_auth(api_client: AsyncClient):
    resp = await api_client.post(
        "/api/v1/charities",
        json={
            "name": "Test Charity",
        },
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_charity_not_found(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/charities/nonexistent-slug")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_charity(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/charities",
        json={
            "name": "Helping Hands Foundation",
            "description": "A charity helping communities",
            "email": "info@helpinghands.org",
            "city": "Mombasa",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Helping Hands Foundation"
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_list_charities_pagination(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/charities?page=1&size=10")
    assert resp.status_code == 200
    data = resp.json()
    assert data["page"] == 1
    assert data["size"] == 10


@pytest.mark.asyncio
async def test_create_campaign_requires_auth(api_client: AsyncClient):
    resp = await api_client.post(
        "/api/v1/charities/00000000-0000-0000-0000-000000000000/campaigns",
        json={
            "title": "Test Campaign",
            "target_amount": 10000,
        },
    )
    assert resp.status_code == 401
