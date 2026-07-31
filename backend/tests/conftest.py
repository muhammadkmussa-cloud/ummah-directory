import os

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
    sync_engine = create_engine(sync_db_url, pool_pre_ping=True)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    with sync_engine.begin() as conn:
        db_module.Base.metadata.drop_all(conn, checkfirst=True)
        db_module.Base.metadata.create_all(conn, checkfirst=False)
    yield
    with sync_engine.begin() as conn:
        db_module.Base.metadata.drop_all(conn, checkfirst=True)
    if USE_SQLITE:
        await db_module.engine.dispose()
        sync_engine.dispose()
        if os.path.exists(TEST_DB_FILE):
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

    from passlib.context import CryptContext

    uid = uuid.uuid4()
    email = f"auth-{uid.hex[:8]}@example.org"
    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto").hash("StrongPass1234!")
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
                               is_active, role_id, preferred_language)
            VALUES ('{uid}', '{email}', 'Auth User', '{pwd}', TRUE, TRUE, '{role_id}', 'en')
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
