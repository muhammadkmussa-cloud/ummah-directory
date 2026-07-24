import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_dashboard_requires_auth(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/admin/dashboard")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_admin_dashboard_requires_admin_role(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.get("/api/v1/admin/dashboard", headers=auth_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_pending_businesses_requires_auth(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/admin/businesses/pending")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_list_reports(api_client: AsyncClient, auth_headers: dict, sample_category: str):
    resp = await api_client.get("/api/v1/admin/reports", headers=auth_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_claims(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.get("/api/v1/admin/claims", headers=auth_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_verification_documents(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.get("/api/v1/admin/verification-documents", headers=auth_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_users(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.get("/api/v1/admin/users", headers=auth_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_analytics_overview_requires_auth(api_client: AsyncClient):
    resp = await api_client.get("/api/v1/analytics/admin/overview")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_admin_analytics_overview_requires_admin(api_client: AsyncClient, auth_headers: dict):
    resp = await api_client.get("/api/v1/analytics/admin/overview", headers=auth_headers)
    assert resp.status_code == 403
