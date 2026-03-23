import pytest


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
