import pytest
import pytest_asyncio
import json
import tempfile
from pathlib import Path
from httpx import AsyncClient, ASGITransport
from server.main import app


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_export_json(client):
    """Test database export endpoint."""
    response = await client.post("/api/import/export/json")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert "version" in data