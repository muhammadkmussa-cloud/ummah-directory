import pytest


@pytest.mark.asyncio
async def test_register(api_client):
    response = await api_client.post(
        "/api/v1/auth/register",
        json={
            "email": "test-auth@example.org",
            "password": "TestPass1234!",
            "full_name": "Test User",
        },
    )
    assert response.status_code == 201
    assert "Registration successful" in response.json()["message"]


@pytest.mark.asyncio
async def test_register_duplicate_email(api_client):
    await api_client.post(
        "/api/v1/auth/register",
        json={
            "email": "dup@example.org",
            "password": "TestPass1234!",
            "full_name": "Test",
        },
    )
    response = await api_client.post(
        "/api/v1/auth/register",
        json={
            "email": "dup@example.org",
            "password": "TestPass1234!",
            "full_name": "Test",
        },
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_register_weak_password(api_client):
    response = await api_client.post(
        "/api/v1/auth/register",
        json={
            "email": "weak@example.org",
            "password": "weak",
            "full_name": "Test User",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(api_client):
    await api_client.post(
        "/api/v1/auth/register",
        json={
            "email": "login@example.org",
            "password": "TestPass1234!",
            "full_name": "Test",
        },
    )
    response = await api_client.post(
        "/api/v1/auth/login",
        json={
            "email": "login@example.org",
            "password": "TestPass1234!",
        },
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_login_wrong_password(api_client):
    await api_client.post(
        "/api/v1/auth/register",
        json={
            "email": "wrong@example.org",
            "password": "TestPass1234!",
            "full_name": "Test",
        },
    )
    response = await api_client.post(
        "/api/v1/auth/login",
        json={
            "email": "wrong@example.org",
            "password": "WrongPass123",
        },
    )
    assert response.status_code == 401
