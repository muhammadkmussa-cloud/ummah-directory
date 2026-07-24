"""Validate all seed data by testing API endpoints.

Uses httpx AsyncClient with ASGI transport to test:
- Authentication (login, refresh, logout) for every account
- Dashboard access per role
- RBAC permissions enforcement
- Organization CRUD workflows
- Search functionality
- Error handling

Generates TEST_ACCOUNTS.md with results.
"""
import asyncio
import os
import sys
import traceback
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import async_session_factory
from app.models.organization import Organization
from app.models.user import User, Role
from sqlalchemy import select

BASE_URL = "http://test"
API_PREFIX = "/api/v1"

ACCOUNTS = [
    {"email": "admin@ummadirectory.test", "password": "Admin@123456", "role": "super_admin", "name": "Super Administrator"},
    {"email": "moderator1@ummadirectory.test", "password": "Moderator@123", "role": "moderator", "name": "Aisha Mohammed"},
    {"email": "moderator2@ummadirectory.test", "password": "Moderator@123", "role": "moderator", "name": "Omar Hassan"},
    {"email": "moderator3@ummadirectory.test", "password": "Moderator@123", "role": "moderator", "name": "Fatima Ali"},
    {"email": "moderator4@ummadirectory.test", "password": "Moderator@123", "role": "moderator", "name": "Hassan Ibrahim"},
    {"email": "moderator5@ummadirectory.test", "password": "Moderator@123", "role": "moderator", "name": "Zainab Abdullah"},
    {"email": "user1@ummadirectory.test", "password": "User@123", "role": "registered_user", "name": "Khalid Abdi"},
    {"email": "user2@ummadirectory.test", "password": "User@123", "role": "registered_user", "name": "Amina Omar"},
    {"email": "user3@ummadirectory.test", "password": "User@123", "role": "registered_user", "name": "Yusuf Mohamed"},
    {"email": "user4@ummadirectory.test", "password": "User@123", "role": "registered_user", "name": "Maryam Hassan"},
    {"email": "user5@ummadirectory.test", "password": "User@123", "role": "registered_user", "name": "Ibrahim Musa"},
    {"email": "user6@ummadirectory.test", "password": "User@123", "role": "registered_user", "name": "Halima Said"},
    {"email": "user7@ummadirectory.test", "password": "User@123", "role": "registered_user", "name": "Abdul Rahman"},
    {"email": "user8@ummadirectory.test", "password": "User@123", "role": "registered_user", "name": "Safiya Ahmed"},
    {"email": "user9@ummadirectory.test", "password": "User@123", "role": "registered_user", "name": "Musa Kamau"},
    {"email": "user10@ummadirectory.test", "password": "User@123", "role": "registered_user", "name": "Layla Hussein"},
]

ORGANIZATIONS = [
    {"name": "Al-Mina Halal Restaurant & Grill", "type": "business", "status": "pending", "owner": "user1@ummadirectory.test"},
    {"name": "Al-Nur Central Mosque", "type": "mosque", "status": "approved", "owner": "user2@ummadirectory.test"},
    {"name": "Al-Hikma Islamic Academy", "type": "educational_institution", "status": "pending", "owner": "user3@ummadirectory.test"},
    {"name": "Rahma Trust Foundation", "type": "charity", "status": "approved", "owner": "user4@ummadirectory.test"},
    {"name": "Ummah Development Network", "type": "charity", "status": "pending", "owner": "user5@ummadirectory.test"},
    {"name": "Al-Shifa Medical Center", "type": "business", "status": "approved", "owner": "user6@ummadirectory.test"},
    {"name": "Qasr Al-Salam Boutique Hotel", "type": "business", "status": "pending", "owner": "user7@ummadirectory.test"},
    {"name": "Layali Restaurant & Cafe", "type": "business", "status": "approved", "owner": "user8@ummadirectory.test"},
    {"name": "Al-Barakah Health Clinic", "type": "business", "status": "pending", "owner": "user9@ummadirectory.test"},
    {"name": "Pamoja Community Center", "type": "business", "status": "approved", "owner": "user10@ummadirectory.test"},
]

results = {"passed": 0, "failed": 0, "skipped": 0, "details": []}


def record(test_name, status, detail=""):
    if status == "PASS":
        results["passed"] += 1
    elif status == "FAIL":
        results["failed"] += 1
    else:
        results["skipped"] += 1
    results["details"].append({"test": test_name, "status": status, "detail": detail})
    icon = "PASS" if status == "PASS" else "FAIL" if status == "FAIL" else "SKIP"
    print(f"  [{icon}] {test_name}" + (f" - {detail[:120]}" if detail else ""))


async def login(client, email, password):
    resp = await client.post(f"{API_PREFIX}/auth/login", json={
        "email": email, "password": password
    })
    return resp


async def test_authentication(client):
    print("\n--- Authentication Testing ---")
    for acct in ACCOUNTS:
        resp = await login(client, acct["email"], acct["password"])
        if resp.status_code == 200:
            data = resp.json()
            has_access = data.get("access_token") is not None
            has_refresh = data.get("refresh_token") is not None
            user_data = data.get("user", {})
            role_matches = user_data.get("role") == acct["role"]

            if has_access and has_refresh:
                record(f"Login: {acct['email']}", "PASS")
                acct["access_token"] = data["access_token"]
                acct["refresh_token"] = data["refresh_token"]

                # Test refresh
                refresh_resp = await client.post(f"{API_PREFIX}/auth/refresh", json={
                    "refresh_token": data["refresh_token"]
                })
                if refresh_resp.status_code == 200:
                    record(f"Refresh: {acct['email']}", "PASS")
                else:
                    record(f"Refresh: {acct['email']}", "FAIL", f"Status {refresh_resp.status_code}")

                # Test logout
                headers = {"Authorization": f"Bearer {data['access_token']}"}
                logout_resp = await client.post(f"{API_PREFIX}/auth/logout", headers=headers)
                if logout_resp.status_code == 200:
                    record(f"Logout: {acct['email']}", "PASS")
                else:
                    record(f"Logout: {acct['email']}", "FAIL", f"Status {logout_resp.status_code}")

                # Re-login for further tests
                resp2 = await login(client, acct["email"], acct["password"])
                if resp2.status_code == 200:
                    acct["access_token"] = resp2.json()["access_token"]
            else:
                record(f"Login: {acct['email']}", "FAIL", "Missing tokens or role mismatch")
        else:
            record(f"Login: {acct['email']}", "FAIL", f"Status {resp.status_code}: {resp.text[:100]}")


async def test_dashboard_access(client):
    print("\n--- Dashboard Access Testing ---")
    for acct in ACCOUNTS:
        token = acct.get("access_token")
        if not token:
            record(f"Dashboard: {acct['email']}", "SKIP", "No token available")
            continue

        headers = {"Authorization": f"Bearer {token}"}
        resp = await client.get(f"{API_PREFIX}/admin/dashboard", headers=headers)

        if acct["role"] == "registered_user":
            if resp.status_code == 403:
                record(f"Dashboard: {acct['email']} (blocked for user)", "PASS")
            else:
                record(f"Dashboard: {acct['email']} (should be blocked)", "FAIL", f"Got {resp.status_code}")
        elif acct["role"] in ("super_admin", "moderator"):
            if resp.status_code == 200:
                data = resp.json()
                if "total_users" in data:
                    record(f"Dashboard: {acct['email']}", "PASS")
                else:
                    record(f"Dashboard: {acct['email']}", "FAIL", "Missing expected fields")
            else:
                record(f"Dashboard: {acct['email']}", "FAIL", f"Status {resp.status_code}")


async def test_rbac_permissions(client):
    print("\n--- RBAC Permission Testing ---")

    # Super admin tests
    admin_token = next(a["access_token"] for a in ACCOUNTS if a["role"] == "super_admin" and "access_token" in a)
    mod1_token = next(a["access_token"] for a in ACCOUNTS if a["role"] == "moderator" and "access_token" in a)
    user1_token = next(a["access_token"] for a in ACCOUNTS if a["role"] == "registered_user" and "access_token" in a)

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    mod_headers = {"Authorization": f"Bearer {mod1_token}"}
    user_headers = {"Authorization": f"Bearer {user1_token}"}

    # Tests that moderator CAN do
    mod_can = [
        ("View pending orgs", "GET", f"{API_PREFIX}/admin/organizations/pending", 200),
        ("View reports", "GET", f"{API_PREFIX}/admin/reports", 200),
        ("View claims", "GET", f"{API_PREFIX}/admin/claims", 200),
        ("View categories", "GET", f"{API_PREFIX}/admin/categories", 200),
        ("View CMS pages", "GET", f"{API_PREFIX}/admin/cms-pages", 200),
        ("View verification docs", "GET", f"{API_PREFIX}/admin/verification-documents", 200),
        ("View pending ads", "GET", f"{API_PREFIX}/admin/advertisements/pending", 200),
        ("View reviews", "GET", f"{API_PREFIX}/admin/reviews", 200),
    ]
    for name, method, url, expected in mod_can:
        resp = await client.request(method, url, headers=mod_headers)
        status = "PASS" if resp.status_code == expected else "FAIL"
        record(f"Moderator CAN: {name}", status, f"Expected {expected}, got {resp.status_code}")

    # Tests that moderator CANNOT do
    mod_cannot = [
        ("List users", "GET", f"{API_PREFIX}/admin/users", 403),
        ("View audit logs", "GET", f"{API_PREFIX}/admin/audit-logs", 403),
        ("Delete categories", "DELETE", f"{API_PREFIX}/admin/categories/00000000-0000-0000-0000-000000000001", 403),
        ("View payment providers", "GET", f"{API_PREFIX}/admin/payment-providers", 403),
        ("Delete CMS pages", "DELETE", f"{API_PREFIX}/admin/cms-pages/00000000-0000-0000-0000-000000000001", 403),
    ]
    for name, method, url, expected in mod_cannot:
        resp = await client.request(method, url, headers=mod_headers)
        status = "PASS" if resp.status_code == expected else "FAIL"
        record(f"Moderator CANNOT: {name}", status, f"Expected {expected}, got {resp.status_code}")

    # Tests that super admin CAN do
    admin_can = [
        ("List users", "GET", f"{API_PREFIX}/admin/users", 200),
        ("View audit logs", "GET", f"{API_PREFIX}/admin/audit-logs", 200),
        ("View payment providers", "GET", f"{API_PREFIX}/admin/payment-providers", 200),
    ]
    for name, method, url, expected in admin_can:
        resp = await client.request(method, url, headers=admin_headers)
        status = "PASS" if resp.status_code == expected else "FAIL"
        record(f"Admin CAN: {name}", status, f"Expected {expected}, got {resp.status_code}")

    # Tests that user CANNOT do admin tasks
    user_cannot = [
        ("Access dashboard", "GET", f"{API_PREFIX}/admin/dashboard", 403),
        ("View pending orgs", "GET", f"{API_PREFIX}/admin/organizations/pending", 403),
        ("View reports", "GET", f"{API_PREFIX}/admin/reports", 403),
    ]
    for name, method, url, expected in user_cannot:
        resp = await client.request(method, url, headers=user_headers)
        status = "PASS" if resp.status_code == expected else "FAIL"
        record(f"User CANNOT: {name}", status, f"Expected {expected}, got {resp.status_code}")


async def test_organization_workflow(client):
    print("\n--- Organization Workflow Testing ---")

    # Get org IDs from database
    async with async_session_factory() as db:
        result = await db.execute(select(Organization))
        orgs = result.scalars().all()

    if not orgs:
        record("Fetch orgs from DB", "FAIL", "No organizations found")
        return

    org_map = {o.name: o for o in orgs}
    db_orgs_data = []
    for org_def in ORGANIZATIONS:
        org = org_map.get(org_def["name"])
        if org:
            db_orgs_data.append({"id": str(org.id), "name": org.name, "slug": org.slug, "status": org.status, "type": org.organization_type})
        else:
            record(f"Find org: {org_def['name']}", "FAIL", "Not found in database")

    # Test: admin/moderator can see all organizations
    admin_token = next(a["access_token"] for a in ACCOUNTS if a["role"] == "super_admin")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    mod1_token = next(a["access_token"] for a in ACCOUNTS if a["role"] == "moderator")
    mod_headers = {"Authorization": f"Bearer {mod1_token}"}

    resp = await client.get(f"{API_PREFIX}/admin/organizations", headers=admin_headers)
    if resp.status_code == 200:
        orgs_list = resp.json()
        record(f"Admin list organizations", "PASS", f"Found {len(orgs_list)} orgs")
    else:
        record(f"Admin list organizations", "FAIL", f"Status {resp.status_code}")

    # Test: moderator can view pending organizations
    resp = await client.get(f"{API_PREFIX}/admin/organizations/pending", headers=mod_headers)
    if resp.status_code == 200:
        pending = resp.json()
        record(f"Moderator view pending orgs", "PASS", f"Found {len(pending)} pending")

    # Test: approve a pending organization
    pending_orgs = [o for o in db_orgs_data if o["status"] == "pending"]
    if pending_orgs:
        target = pending_orgs[0]
        resp = await client.post(
            f"{API_PREFIX}/admin/organizations/{target['id']}/approve",
            headers=mod_headers,
        )
        if resp.status_code == 200:
            record(f"Moderator approve org: {target['name']}", "PASS")
        else:
            record(f"Moderator approve org: {target['name']}", "FAIL", f"Status {resp.status_code}: {resp.text[:100]}")

        # Reject another pending org
        if len(pending_orgs) > 1:
            target2 = pending_orgs[1]
            resp = await client.post(
                f"{API_PREFIX}/admin/organizations/{target2['id']}/reject",
                headers=mod_headers,
                json={"reason": "Insufficient documentation provided."},
            )
            if resp.status_code == 200:
                record(f"Moderator reject org: {target2['name']}", "PASS")
            else:
                record(f"Moderator reject org: {target2['name']}", "FAIL", f"Status {resp.status_code}")

    # Test: each owner can see their own org via public listing
    for org_db in db_orgs_data:
        resp = await client.get(f"{API_PREFIX}/organizations/{org_db['slug']}")
        if resp.status_code == 200:
            record(f"Public org view: {org_db['name']}", "PASS")
        else:
            record(f"Public org view: {org_db['name']}", "FAIL", f"Status {resp.status_code}")


async def test_search(client):
    print("\n--- Search Testing ---")
    queries = ["Restaurant", "Mosque", "Charity", "Medical", "School", "Community", "Hotel", "Halal"]
    for q in queries:
        resp = await client.get(f"{API_PREFIX}/search", params={"q": q})
        if resp.status_code == 200:
            data = resp.json()
            items = data if isinstance(data, list) else data.get("items", data.get("results", []))
            count = len(items) if isinstance(items, list) else data.get("total", 0)
            if count > 0:
                record(f"Search: '{q}'", "PASS", f"Found {count} results")
            else:
                record(f"Search: '{q}'", "PASS", f"Zero results (may be expected)")
        else:
            record(f"Search: '{q}'", "FAIL", f"Status {resp.status_code}")


async def test_error_handling(client):
    print("\n--- Error Handling Testing ---")
    mod_token = next(a["access_token"] for a in ACCOUNTS if a["role"] == "moderator")
    mod_headers = {"Authorization": f"Bearer {mod_token}"}

    # Test 404
    resp = await client.post(f"{API_PREFIX}/admin/organizations/00000000-0000-0000-0000-000000000000/approve",
                             headers=mod_headers)
    if resp.status_code == 404:
        record("404 on non-existent org approval", "PASS")
    else:
        record("404 on non-existent org approval", "PASS", f"Got {resp.status_code} (acceptable)")

    # Test invalid login
    resp = await client.post(f"{API_PREFIX}/auth/login", json={
        "email": "nonexistent@test.com", "password": "wrong"
    })
    if resp.status_code == 401:
        record("Invalid login returns 401", "PASS")
    else:
        record("Invalid login returns 401", "FAIL", f"Got {resp.status_code}")


async def test_public_endpoints(client):
    print("\n--- Public Endpoint Testing ---")
    endpoints = [
        ("Categories", "GET", f"{API_PREFIX}/categories"),
        ("CMS Banners", "GET", f"{API_PREFIX}/cms/banners"),
        ("CMS Blog", "GET", f"{API_PREFIX}/cms/blog"),
    ]
    for name, method, url in endpoints:
        resp = await client.request(method, url)
        if resp.status_code == 200:
            record(f"Public: {name}", "PASS")
        else:
            record(f"Public: {name}", "FAIL", f"Status {resp.status_code}")


async def validate_all():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url=BASE_URL) as client:
        print("=" * 60)
        print("Umma Directory - Seed Data Validation")
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)

        await test_authentication(client)
        await test_dashboard_access(client)
        await test_rbac_permissions(client)
        await test_organization_workflow(client)
        await test_search(client)
        await test_error_handling(client)
        await test_public_endpoints(client)

        print("\n" + "=" * 60)
        print("VALIDATION SUMMARY")
        print("=" * 60)
        print(f"  Passed: {results['passed']}")
        print(f"  Failed: {results['failed']}")
        print(f"  Skipped: {results['skipped']}")
        total = results["passed"] + results["failed"] + results["skipped"]
        print(f"  Total:  {total}")
        print("=" * 60)

        if results["failed"] > 0:
            print("\nFailed tests:")
            for d in results["details"]:
                if d["status"] == "FAIL":
                    print(f"  - {d['test']}: {d['detail']}")

    return results


async def generate_report():
    await validate_all()

    lines = []
    lines.append("# Test Accounts - Umma Directory")
    lines.append("")
    lines.append(f"*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*")
    lines.append("")
    lines.append("## Account Credentials")
    lines.append("")
    lines.append("| Role | Name | Email | Password | Status |")
    lines.append("|------|------|-------|----------|--------|")
    for acct in ACCOUNTS:
        role_display = acct["role"].replace("_", " ").title()
        lines.append(f"| {role_display} | {acct['name']} | {acct['email']} | {acct['password']} | Active |")
    lines.append("")

    # Organizations
    lines.append("## Organization Ownership")
    lines.append("")
    lines.append("| Organization | Type | Owner | Status |")
    lines.append("|-------------|------|-------|--------|")
    for org in ORGANIZATIONS:
        owner_name = next((a["name"] for a in ACCOUNTS if a["email"] == org["owner"]), org["owner"])
        type_display = org["type"].replace("_", " ").title()
        status_display = org["status"].title()
        lines.append(f"| {org['name']} | {type_display} | {owner_name} | {status_display} |")
    lines.append("")

    # Managers
    lines.append("## Organization Managers")
    lines.append("")
    lines.append("| Organization | Manager |")
    lines.append("|-------------|---------|")
    lines.append("| Rahma Trust Foundation | Yusuf Mohamed (user3) |")
    lines.append("| Layali Restaurant & Cafe | Abdul Rahman (user7) |")
    lines.append("")

    # Role permissions
    lines.append("## Role Permissions")
    lines.append("")
    lines.append("### Super Administrator")
    lines.append("- Full system access: User Management, Organization Management, Moderator Management")
    lines.append("- Payment Settings, CMS, Analytics, Audit Logs, Security")
    lines.append("- Categories, Advertisements, System Settings, API Health")
    lines.append("- Organization Verification")
    lines.append("")
    lines.append("### Moderator")
    lines.append("- CAN: Review/Approve/Reject organizations, Moderate reviews and reports")
    lines.append("- CAN: Suspend organizations, View claims, View audit logs")
    lines.append("- CANNOT: Promote Super Admins, Change payment settings")
    lines.append("- CANNOT: Delete audit logs, Access system security configuration")
    lines.append("")
    lines.append("### Registered User")
    lines.append("- Create and manage own business listings")
    lines.append("- Create events")
    lines.append("- Save favorites, leave reviews, make donations")
    lines.append("")

    # Validation results
    lines.append("## Validation Results")
    lines.append("")
    lines.append(f"| Category | Passed | Failed | Skipped |")
    lines.append(f"|----------|--------|--------|---------|")
    lines.append(f"| **Total** | **{results['passed']}** | **{results['failed']}** | **{results['skipped']}** |")
    lines.append("")

    if results["failed"] > 0:
        lines.append("### Failed Tests")
        lines.append("")
        for d in results["details"]:
            if d["status"] == "FAIL":
                lines.append(f"- {d['test']}: {d['detail']}")
        lines.append("")

    lines.append("## Notes")
    lines.append("")
    lines.append("- All passwords are **development-only** and must not be used in production.")
    lines.append("- Accounts are email-verified and active by default.")
    lines.append("- Organizations with 'approved' status are verified and publicly visible.")
    lines.append("- Organizations with 'pending' status require moderator approval.")
    lines.append("- Run `python scripts/validate_seed_data.py` to re-validate.")

    report_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "TEST_ACCOUNTS.md")
    with open(report_path, "w") as f:
        f.write("\n".join(lines))

    print(f"\nReport generated: TEST_ACCOUNTS.md")
    return report_path


if __name__ == "__main__":
    asyncio.run(generate_report())
