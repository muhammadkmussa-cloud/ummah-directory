import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_payment_intent_requires_auth(api_client: AsyncClient):
    resp = await api_client.post("/api/v1/payments/create-intent?gateway=stripe&amount=100&currency=KES")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_payment_intent_invalid_gateway(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/payments/create-intent?gateway=unknown&amount=100&currency=KES",
        headers=auth_headers,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_payment_webhook_unsupported_gateway(api_client: AsyncClient):
    resp = await api_client.post("/api/v1/payments/unknown/webhook", content=b"{}")
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_refund_requires_auth(api_client: AsyncClient):
    resp = await api_client.post("/api/v1/payments/00000000-0000-0000-0000-000000000000/refund")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_refund_not_found(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/payments/00000000-0000-0000-0000-000000000000/refund",
        headers=auth_headers,
    )
    assert resp.status_code == 404
