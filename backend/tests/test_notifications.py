import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_notifications_requires_auth(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/notifications")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_list_notifications(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.get("/api/v1/notifications", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_mark_read_not_found(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.patch(
        "/api/v1/notifications/00000000-0000-0000-0000-000000000000/read",
        headers=auth_headers,
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_mark_all_read(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.patch("/api/v1/notifications/read-all", headers=auth_headers)
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_get_preferences(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.get("/api/v1/notifications/preferences", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "email_notifications" in data
    assert "in_app_notifications" in data
