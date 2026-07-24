import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_education(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/education")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_create_education_requires_auth(api_client: AsyncClient):
    resp = await api_client.post("/api/v1/education", json={
        "name": "Test School",
        "institution_type": "school",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_education_not_found(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/education/nonexistent-slug")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_education(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post("/api/v1/education", json={
        "name": "Al-Noor Academy",
        "institution_type": "school",
        "description": "An Islamic school",
        "city": "Nairobi",
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Al-Noor Academy"
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_list_education_pagination(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/education?page=1&size=10")
    assert resp.status_code == 200
    data = resp.json()
    assert data["page"] == 1
    assert data["size"] == 10


@pytest.mark.asyncio
async def test_list_education_filter_city(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/education?city=Nairobi")
    assert resp.status_code == 200
