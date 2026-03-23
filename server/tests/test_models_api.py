import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from server.main import app


@pytest_asyncio.fixture
async def client():
    """Async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health(client):
    """Test health endpoint."""
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_list_models_empty(client):
    """Test listing models when database is empty."""
    response = await client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0