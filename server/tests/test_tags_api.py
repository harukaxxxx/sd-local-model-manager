import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from server.main import app


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_list_tags_empty(client):
    """Test listing tags when none exist."""
    response = await client.get("/api/tags")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_and_list_tag(client):
    """Test creating a tag and listing it."""
    # Create a tag
    response = await client.post("/api/tags", params={"name": "landscape"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "landscape"
    assert "id" in data

    # List tags
    response = await client.get("/api/tags")
    assert response.status_code == 200
    tags = response.json()
    assert len(tags) == 1
    assert tags[0]["name"] == "landscape"


@pytest.mark.asyncio
async def test_create_duplicate_tag(client):
    """Test that creating a duplicate tag fails."""
    await client.post("/api/tags", params={"name": "portrait"})

    response = await client.post("/api/tags", params={"name": "portrait"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Tag already exists"


@pytest.mark.asyncio
async def test_update_model_tags(client):
    """Test updating tags for a model."""
    # Create tags
    r1 = await client.post("/api/tags", params={"name": "anime"})
    r2 = await client.post("/api/tags", params={"name": "realistic"})
    tag1_id = r1.json()["id"]
    tag2_id = r2.json()["id"]

    # Update model tags (using a fake model_id for testing)
    response = await client.post("/api/tags/model", json={
        "model_id": "test-model-123",
        "tag_ids": [tag1_id, tag2_id]
    })
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

    # Update model tags - replace with only one tag
    response = await client.post("/api/tags/model", json={
        "model_id": "test-model-123",
        "tag_ids": [tag1_id]
    })
    assert response.status_code == 200