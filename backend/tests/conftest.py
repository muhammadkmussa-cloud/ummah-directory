import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine, text

from app.main import app
from app.core.database import engine, Base
from app.core.config import settings
from app.models import *  # noqa: F401, F403

sync_db_url = settings.database_url.replace("+asyncpg", "")
sync_engine = create_engine(sync_db_url, pool_pre_ping=True)


from app.core.database import async_session_factory

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    with sync_engine.begin() as conn:
        Base.metadata.drop_all(conn, checkfirst=True)
        Base.metadata.create_all(conn, checkfirst=False)
    yield
    with sync_engine.begin() as conn:
        Base.metadata.drop_all(conn, checkfirst=True)


@pytest_asyncio.fixture
async def db_session():
    async with async_session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def sample_category():
    with sync_engine.begin() as conn:
        conn.execute(
            text("""INSERT INTO categories (id, name, slug, is_active, sort_order)
                     VALUES ('00000000-0000-0000-0000-000000000001', 'Test Category', 'test-category', true, 0)
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
    resp = await api_client.post("/api/v1/auth/register", json={
        "email": "user@example.org",
        "password": "StrongPass1234!",
        "full_name": "Test User",
    })
    return resp.json()


@pytest_asyncio.fixture
async def verified_user(api_client):
    resp = await api_client.post("/api/v1/auth/register", json={
        "email": "verified@example.org",
        "password": "StrongPass1234!",
        "full_name": "Verified User",
    })
    with sync_engine.begin() as conn:
        conn.execute(text("UPDATE users SET is_email_verified = TRUE WHERE email = 'verified@example.org'"))
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
            conn.execute(text(f"INSERT INTO roles (id, name) VALUES ('{new_id}', 'registered_user')"))
            role_id = new_id
        conn.execute(text(f"""
            INSERT INTO users (id, email, full_name, password_hash, is_email_verified, is_active, role_id, preferred_language)
            VALUES ('{uid}', '{email}', 'Auth User', '{pwd}', TRUE, TRUE, '{role_id}', 'en')
        """))
    resp = await api_client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "StrongPass1234!",
    })
    return resp.json()["access_token"]


@pytest_asyncio.fixture
async def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}
