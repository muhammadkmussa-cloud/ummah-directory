import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_cms_page_not_found(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/cms/pages/nonexistent")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_banners(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/cms/banners")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_list_banners_by_placement(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/cms/banners?placement=homepage")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_list_blog_posts(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/cms/blog")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_blog_post_not_found(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/cms/blog/nonexistent-slug")
    assert resp.status_code == 404
