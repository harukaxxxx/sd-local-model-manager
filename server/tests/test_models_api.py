import pytest
import pytest_asyncio
import asyncio
import os
import tempfile
from pathlib import Path
from httpx import AsyncClient, ASGITransport
from server.main import app


@pytest_asyncio.fixture
async def clean_db():
    """Use a temp database for tests."""
    import server.database as db
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        temp_path = Path(f.name)
    orig = db.DATABASE_PATH
    db.DATABASE_PATH = temp_path
    conn = await db.init_db(temp_path)
    yield conn
    await conn.close()
    try:
        os.unlink(temp_path)
    except:
        pass
    db.DATABASE_PATH = orig


@pytest_asyncio.fixture
async def client():
    """Async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health(clean_db, client):
    """Test health endpoint."""
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_list_models_empty(clean_db, client):
    """Test listing models when database is empty."""
    response = await client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_get_model_not_found(clean_db, client):
    """Test getting non-existent model returns 404."""
    response = await client.get("/api/models/nonexistent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_model_not_found(clean_db, client):
    """Test deleting non-existent model returns 404."""
    response = await client.delete("/api/models/nonexistent-id")
    assert response.status_code == 404