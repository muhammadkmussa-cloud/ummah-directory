import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_upload_requires_auth(api_client: AsyncClient):
    resp = await api_client.post("/api/v1/files/upload")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_upload_invalid_type(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.post(
        "/api/v1/files/upload",
        params={"resource_type": "invalid"},
        headers=auth_headers,
    )
    assert resp.status_code in (400, 422)
