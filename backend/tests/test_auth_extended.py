import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_refresh_token(api_client: AsyncClient):
    reg = await api_client.post("/api/v1/auth/register", json={
        "email": "refresh@example.org",
        "password": "StrongPass1234!",
        "full_name": "Refresh Test",
    })
    assert reg.status_code == 201

    login = await api_client.post("/api/v1/auth/login", json={
        "email": "refresh@example.org",
        "password": "StrongPass1234!",
    })
    assert login.status_code == 200
    refresh_token = login.json()["refresh_token"]

    resp = await api_client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_refresh_with_invalid_token(api_client: AsyncClient):
    resp = await api_client.post("/api/v1/auth/refresh", json={
        "refresh_token": "invalid-token",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_logout(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post("/api/v1/auth/logout", headers=auth_headers)
    assert resp.status_code == 200
    assert "Logged out" in resp.json()["message"]


@pytest.mark.asyncio
async def test_logout_without_token(api_client: AsyncClient):
    resp = await api_client.post("/api/v1/auth/logout")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_forgot_password(api_client: AsyncClient):
    resp = await api_client.post("/api/v1/auth/forgot-password", json={
        "email": "nonexistent@example.org",
    })
    assert resp.status_code == 200
    assert "email" in resp.json()["message"].lower()


@pytest.mark.asyncio
async def test_forgot_password_existing_user(api_client: AsyncClient):
    await api_client.post("/api/v1/auth/register", json={
        "email": "forgot@example.org",
        "password": "StrongPass1234!",
        "full_name": "Forgot Test",
    })
    resp = await api_client.post("/api/v1/auth/forgot-password", json={
        "email": "forgot@example.org",
    })
    assert resp.status_code == 200
    assert "email" in resp.json()["message"].lower()


@pytest.mark.asyncio
async def test_reset_password_invalid_token(api_client: AsyncClient):
    resp = await api_client.post("/api/v1/auth/reset-password", json={
        "token": "bad-token",
        "password": "NewStrongPass123!",
    })
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_resend_verification(api_client: AsyncClient):
    resp = await api_client.post("/api/v1/auth/resend-verification", json={
        "email": "nobody@example.org",
    })
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_verify_email_invalid_token(api_client: AsyncClient):
    resp = await api_client.post("/api/v1/auth/verify-email", json={
        "token": "bad-token",
    })
    assert resp.status_code == 400
