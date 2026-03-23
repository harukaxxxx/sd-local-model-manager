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
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_list_tags_empty(clean_db, client):
    """Test listing tags when none exist."""
    response = await client.get("/api/tags")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_and_list_tag(clean_db, client):
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
async def test_create_duplicate_tag(clean_db, client):
    """Test that creating a duplicate tag fails."""
    await client.post("/api/tags", params={"name": "portrait"})

    response = await client.post("/api/tags", params={"name": "portrait"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Tag already exists"


@pytest.mark.asyncio
async def test_update_model_tags(clean_db, client):
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


@pytest.mark.asyncio
async def test_create_tag_empty_name(client, clean_db):
    """Test creating tag with empty name returns 400."""
    response = await client.post("/api/tags", params={"name": ""})
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_create_tag_too_long(client, clean_db):
    """Test creating tag with name > 50 chars returns 400."""
    long_name = "a" * 51
    response = await client.post("/api/tags", params={"name": long_name})
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_update_model_tags_invalid_id(client, clean_db):
    """Test updating model tags with invalid tag ID returns 400."""
    import uuid
    from server.database import init_db

    # First create a model
    conn = await init_db()
    model_id = str(uuid.uuid4())
    await conn.execute(
        "INSERT INTO models (id, name, file_path) VALUES (?, ?, ?)",
        (model_id, "test", "/tmp/test")
    )
    await conn.commit()
    await conn.close()

    # Try to update with non-existent tag ID
    response = await client.post(
        "/api/tags/model",
        json={"model_id": model_id, "tag_ids": [99999]}
    )
    assert response.status_code == 400