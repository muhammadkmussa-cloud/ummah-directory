import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_initiate_donation_requires_auth(api_client: AsyncClient):
    resp = await api_client.post("/api/v1/donations/initiate", json={
        "amount": 100,
        "currency": "KES",
        "campaign_id": "00000000-0000-0000-0000-000000000000",
        "payment_gateway": "stripe",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_initiate_donation_below_minimum(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/donations/initiate",
        json={
            "amount": 1,
            "currency": "KES",
            "campaign_id": "00000000-0000-0000-0000-000000000000",
            "payment_gateway": "stripe",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 400
    assert "minimum" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_donation_history_requires_auth(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/donations/history")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_donation_stats(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.get("/api/v1/donations/stats", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_donations" in data
    assert "total_amount" in data
