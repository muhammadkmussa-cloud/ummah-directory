import io

import pytest
from httpx import AsyncClient
from PIL import Image

from app.api.v1.endpoints import files as files_module


def _png_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (32, 32), (255, 0, 0)).save(buf, format="PNG")
    return buf.getvalue()


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


@pytest.mark.asyncio
async def test_upload_happy_path(api_client: AsyncClient, auth_headers: dict, monkeypatch):
    async def fake_upload_to_s3(file_bytes: bytes, filename: str, content_type: str) -> str:
        return f"https://s3.example/uploads/{filename}"

    monkeypatch.setattr(files_module, "upload_to_s3", fake_upload_to_s3)

    resp = await api_client.post(
        "/api/v1/files/upload",
        headers=auth_headers,
        data={"resource_type": "profile"},
        files={"file": ("logo.png", io.BytesIO(_png_bytes()), "image/png")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["file_type"] == "image"
    assert body["url"].startswith("https://s3.example/")


@pytest.mark.asyncio
async def test_upload_org_requires_owner(
    api_client: AsyncClient, auth_headers: dict, monkeypatch
):
    async def fake_upload_to_s3(file_bytes: bytes, filename: str, content_type: str) -> str:
        return f"https://s3.example/uploads/{filename}"

    monkeypatch.setattr(files_module, "upload_to_s3", fake_upload_to_s3)

    unknown_org = "00000000-0000-0000-0000-000000000999"
    resp = await api_client.post(
        "/api/v1/files/upload",
        headers=auth_headers,
        data={"resource_type": "business", "resource_id": unknown_org},
        files={"file": ("logo.png", io.BytesIO(_png_bytes()), "image/png")},
    )
    assert resp.status_code == 404
