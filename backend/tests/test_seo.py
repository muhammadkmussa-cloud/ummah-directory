import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_robots_txt(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/robots.txt")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "text/plain; charset=utf-8"
    assert "Sitemap" in resp.text
    assert "User-agent" in resp.text


@pytest.mark.asyncio
async def test_sitemap_xml(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/sitemap.xml")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/xml"
    assert "<urlset" in resp.text
    assert "ummadirectory.com" in resp.text
