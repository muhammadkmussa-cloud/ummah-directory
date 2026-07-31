import pyotp
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_mfa_status_requires_auth(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/mfa/status")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_mfa_status_default_disabled(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.get("/api/v1/mfa/status", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["mfa_enabled"] is False


@pytest.mark.asyncio
async def test_mfa_setup_requires_password(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/mfa/setup", params={"password": "WrongPass1234!"}, headers=auth_headers
    )
    assert resp.status_code == 400
    assert "Invalid password" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_mfa_setup_and_verify(api_client: AsyncClient, auth_headers: dict):
    headers = auth_headers

    setup_resp = await api_client.post(
        "/api/v1/mfa/setup", params={"password": "StrongPass1234!"}, headers=headers
    )
    assert setup_resp.status_code == 200
    secret = setup_resp.json()["secret"]

    totp = pyotp.TOTP(secret)
    code = totp.now()

    verify_resp = await api_client.post(
        "/api/v1/mfa/verify",
        params={
            "password": "StrongPass1234!",
            "code": code,
        },
        headers=headers,
    )
    assert verify_resp.status_code == 200
    assert "MFA enabled" in verify_resp.json()["message"]

    status_resp = await api_client.get("/api/v1/mfa/status", headers=headers)
    assert status_resp.json()["mfa_enabled"] is True

    new_code = totp.now()
    disable_resp = await api_client.post(
        "/api/v1/mfa/disable",
        params={
            "password": "StrongPass1234!",
            "code": new_code,
        },
        headers=headers,
    )
    assert disable_resp.status_code == 200
    assert "MFA disabled" in disable_resp.json()["message"]


@pytest.mark.asyncio
async def test_mfa_verify_invalid_code(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/mfa/verify",
        params={
            "password": "StrongPass1234!",
            "code": "000000",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 400
    assert "MFA not set up" in resp.json()["detail"]
