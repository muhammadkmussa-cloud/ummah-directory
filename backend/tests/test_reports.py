import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_report_requires_auth(api_client: AsyncClient):
    resp = await api_client.post(
        "/api/v1/reports",
        params={
            "resource_type": "business",
            "resource_id": "00000000-0000-0000-0000-000000000001",
            "category": "spam",
        },
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_report_invalid_resource_type(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/reports",
        params={
            "resource_type": "invalid",
            "resource_id": "00000000-0000-0000-0000-000000000001",
            "category": "spam",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_create_report_invalid_category(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/reports",
        params={
            "resource_type": "business",
            "resource_id": "00000000-0000-0000-0000-000000000001",
            "category": "invalid",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_create_report(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/reports",
        params={
            "resource_type": "business",
            "resource_id": "00000000-0000-0000-0000-000000000001",
            "category": "spam",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert "Report submitted" in data["message"]
