import os
import uuid

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.pool import NullPool
from sqlalchemy.types import JSON


# Register SQLite JSONB compilation hook for SQLite compatibility
@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return compiler.visit_JSON(JSON(), **kw)


import app.core.database as db_module
from app.core.config import settings

# Disable rate limiter for testing to prevent 429 errors
from app.core.rate_limit import limiter

limiter.enabled = False
settings.app_env = "test"

from app.main import app
from app.models import *  # noqa: F401, F403


def is_postgres_reachable(url: str) -> bool:
    if not url.startswith("postgresql"):
        return False
    try:
        sync_url = url.replace("+asyncpg", "")
        test_engine = create_engine(sync_url, connect_args={"connect_timeout": 2})
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        test_engine.dispose()
        return True
    except Exception:
        return False


target_db_url = settings.database_url
USE_SQLITE = not is_postgres_reachable(target_db_url)

TEST_DB_FILE = os.path.abspath("./test_pytest.db")

if USE_SQLITE:
    sync_db_url = f"sqlite:///{TEST_DB_FILE}"
    async_db_url = f"sqlite+aiosqlite:///{TEST_DB_FILE}"

    settings.database_url = async_db_url

    db_module.engine = create_async_engine(async_db_url, poolclass=NullPool)
    db_module.async_session_factory = async_sessionmaker(
        db_module.engine, class_=AsyncSession, expire_on_commit=False
    )
    sync_engine = create_engine(sync_db_url, poolclass=NullPool)
else:
    sync_db_url = settings.database_url.replace("+asyncpg", "")
    db_module.engine = create_async_engine(settings.database_url, poolclass=NullPool)
    db_module.async_session_factory = async_sessionmaker(
        db_module.engine, class_=AsyncSession, expire_on_commit=False
    )
    sync_engine = create_engine(sync_db_url, poolclass=NullPool)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    if not USE_SQLITE:
        db_name = sync_db_url.rsplit("/", 1)[-1]
        assert "test" in db_name.lower(), (
            f"Refusing to run tests against non-test database: {db_name}"
        )
    with sync_engine.begin() as conn:
        db_module.Base.metadata.drop_all(conn, checkfirst=True)
        db_module.Base.metadata.create_all(conn, checkfirst=False)

        # Seed test roles and permissions
        from scripts.seed_dev_data import PERMISSION_DEFINITIONS, ROLES_CONFIG

        role_ids = {}
        for role_name, config in ROLES_CONFIG.items():
            r_id = str(uuid.uuid4())
            role_ids[role_name] = r_id
            conn.execute(
                text(
                    "INSERT INTO roles (id, name, description) VALUES (:id, :name, :desc)"
                ),
                {"id": r_id, "name": role_name, "desc": config.get("description", "")},
            )

        for codename, name, desc in PERMISSION_DEFINITIONS:
            p_id = str(uuid.uuid4())
            conn.execute(
                text(
                    "INSERT INTO permissions (id, codename, name, description) "
                    "VALUES (:id, :codename, :name, :desc)"
                ),
                {"id": p_id, "codename": codename, "name": name, "desc": desc},
            )

            for role_name, config in ROLES_CONFIG.items():
                perms = config.get("permissions", [])
                if codename in perms or "super_admin" in perms:
                    conn.execute(
                        text(
                            "INSERT INTO role_permissions (role_id, permission_id) "
                            "VALUES (:role_id, :permission_id)"
                        ),
                        {"role_id": role_ids[role_name], "permission_id": p_id},
                    )

    yield
    with sync_engine.begin() as conn:
        db_module.Base.metadata.drop_all(conn, checkfirst=True)
    await db_module.engine.dispose()
    sync_engine.dispose()
    if USE_SQLITE and os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except OSError as e:
            print(f"Error removing {TEST_DB_FILE}: {e}")


@pytest_asyncio.fixture
async def db_session():
    async with db_module.async_session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def sample_category():
    with sync_engine.begin() as conn:
        conn.execute(
            text("""INSERT INTO categories (id, name, slug, is_active, sort_order)
                     VALUES ('00000000-0000-0000-0000-000000000001',
                             'Test Category', 'test-category', true, 0)
                     ON CONFLICT (id) DO NOTHING""")
        )
    return "00000000-0000-0000-0000-000000000001"


@pytest_asyncio.fixture
async def api_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def registered_user(api_client):
    resp = await api_client.post(
        "/api/v1/auth/register",
        json={
            "email": "user@example.org",
            "password": "StrongPass1234!",
            "full_name": "Test User",
        },
    )
    return resp.json()


@pytest_asyncio.fixture
async def verified_user(api_client):
    resp = await api_client.post(
        "/api/v1/auth/register",
        json={
            "email": "verified@example.org",
            "password": "StrongPass1234!",
            "full_name": "Verified User",
        },
    )
    with sync_engine.begin() as conn:
        conn.execute(
            text("UPDATE users SET is_email_verified = TRUE WHERE email = 'verified@example.org'")
        )
    return resp.json()


@pytest_asyncio.fixture
async def auth_token(api_client):
    import uuid

    from app.core.security import hash_password

    uid = uuid.uuid4()
    email = f"auth-{uid.hex[:8]}@example.org"
    pwd = hash_password("StrongPass1234!")
    role_id = None
    with sync_engine.begin() as conn:
        result = conn.execute(text("SELECT id FROM roles WHERE name = 'registered_user'"))
        row = result.fetchone()
        if row:
            role_id = str(row[0])
        else:
            new_id = str(uuid.uuid4())
            conn.execute(
                text(f"INSERT INTO roles (id, name) VALUES ('{new_id}', 'registered_user')")
            )
            role_id = new_id
        conn.execute(
            text(f"""
            INSERT INTO users (id, email, full_name, password_hash, is_email_verified,
                               is_phone_verified, is_active, role_id, preferred_language)
            VALUES ('{uid}', '{email}', 'Auth User', '{pwd}', TRUE, FALSE, TRUE,
                    '{role_id}', 'en')
        """)
        )
    resp = await api_client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": "StrongPass1234!",
        },
    )
    return resp.json()["access_token"]


@pytest_asyncio.fixture
async def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}
