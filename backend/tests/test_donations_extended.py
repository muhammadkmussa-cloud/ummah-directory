import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_donation_history(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.get("/api/v1/donations/history", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data


@pytest.mark.asyncio
async def test_donation_initiate_invalid_gateway(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/donations/initiate",
        json={
            "amount": 100,
            "currency": "KES",
            "campaign_id": "00000000-0000-0000-0000-000000000000",
            "payment_gateway": "invalid_gateway",
        },
        headers=auth_headers,
    )
    assert resp.status_code in (400, 404)


@pytest.mark.asyncio
async def test_donation_initiate_invalid_currency(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/donations/initiate",
        json={
            "amount": 100,
            "currency": "XYZ",
            "campaign_id": "00000000-0000-0000-0000-000000000000",
            "payment_gateway": "stripe",
        },
        headers=auth_headers,
    )
    assert resp.status_code in (400, 404)


@pytest.mark.asyncio
async def test_donation_initiate_anonymous(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/donations/initiate",
        json={
            "amount": 100,
            "currency": "KES",
            "campaign_id": "00000000-0000-0000-0000-000000000000",
            "payment_gateway": "stripe",
            "is_anonymous": True,
        },
        headers=auth_headers,
    )
    assert resp.status_code in (400, 404)
