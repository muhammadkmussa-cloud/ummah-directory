import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_search_requires_query(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/search", params={"q": ""})
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_search_returns_results_structure(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/search", params={"q": "test"})
    assert resp.status_code == 200
    data = resp.json()
    assert "businesses" in data
    assert "mosques" in data
    assert "charities" in data
    assert "education" in data
    assert "events" in data


@pytest.mark.asyncio
async def test_search_filter_by_type(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/search", params={"q": "test", "type": "business"})
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data["businesses"], list)
    assert isinstance(data["mosques"], list)


@pytest.mark.asyncio
async def test_suggestions_requires_min_length(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/search/suggestions", params={"q": "a"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_nearby_search_validates_coordinates(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/search/nearby", params={"lat": 91, "lng": 0, "radius": 10})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_nearby_search(api_client: AsyncClient):
    resp = await api_client.get(
        "/api/v1/search/nearby", params={"lat": -1.29, "lng": 36.82, "radius": 50}
    )
    assert resp.status_code == 200
