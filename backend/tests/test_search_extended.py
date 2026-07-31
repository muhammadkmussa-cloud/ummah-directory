import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_search_empty_query(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/search", params={"q": ""})
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_search_type_filter_mosque(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/search", params={"q": "test", "type": "mosque"})
    assert resp.status_code == 200
    data = resp.json()
    assert "mosques" in data


@pytest.mark.asyncio
async def test_suggestions(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/search/suggestions", params={"q": "te"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_nearby_search_missing_params(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/search/nearby")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_nearby_search_type_filter(api_client: AsyncClient):
    resp = await api_client.get(
        "/api/v1/search/nearby",
        params={"lat": -1.29, "lng": 36.82, "radius": 10, "type": "mosque"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "mosques" in data
