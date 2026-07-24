import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_me(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.get("/api/v1/users/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "email" in data
    assert "full_name" in data
    assert "role" in data
    assert "password_hash" not in data


@pytest.mark.asyncio
async def test_get_me_requires_auth(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/users/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_update_me(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.patch("/api/v1/users/me", json={
        "full_name": "Updated Name",
    }, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_change_password(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post("/api/v1/users/change-password", json={
        "current_password": "StrongPass1234!",
        "new_password": "NewStrongPass123!",
    }, headers=auth_headers)
    assert resp.status_code == 200
    assert "Password changed" in resp.json()["message"]


@pytest.mark.asyncio
async def test_change_password_wrong_current(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post("/api/v1/users/change-password", json={
        "current_password": "WrongPass1234!",
        "new_password": "NewStrongPass123!",
    }, headers=auth_headers)
    assert resp.status_code == 400
    assert "incorrect" in resp.json()["detail"].lower()
