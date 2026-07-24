import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_events(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/events")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_create_event_requires_auth(api_client: AsyncClient):
    resp = await api_client.post("/api/v1/events", json={
        "title": "Test Event",
        "event_date": "2026-12-31T18:00:00Z",
        "organizer_type": "business",
        "organizer_id": "00000000-0000-0000-0000-000000000000",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_event_not_found(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/events/nonexistent-slug")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_event(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post("/api/v1/events", json={
        "title": "Community Iftar",
        "description": "A community iftar event",
        "event_date": "2026-12-31T18:00:00Z",
        "venue": "Main Mosque",
        "category": "community",
        "organizer_type": "mosque",
        "organizer_id": "00000000-0000-0000-0000-000000000000",
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Community Iftar"


@pytest.mark.asyncio
async def test_delete_event_requires_ownership(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.delete(
        "/api/v1/events/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_events_pagination(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/events?page=1&size=10")
    assert resp.status_code == 200
    data = resp.json()
    assert data["page"] == 1
    assert data["size"] == 10


@pytest.mark.asyncio
async def test_list_events_filter_category(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/events?category=community")
    assert resp.status_code == 200
