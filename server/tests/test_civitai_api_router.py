import pytest
import pytest_asyncio
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport
from server.main import app


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_search_models_proxy(client):
    """Test Civitai search proxy endpoint."""
    mock_data = {
        "items": [{"id": 1, "name": "Test", "type": "Checkpoint"}],
        "metadata": {},
    }

    with patch("server.routers.civitai.get_models_list", new_callable=AsyncMock) as mock:
        mock.return_value = mock_data
        response = await client.get("/api/civitai/models/search?query=test")
        assert response.status_code == 200
        assert len(response.json()["items"]) == 1


@pytest.mark.asyncio
async def test_search_models_with_type_filter(client):
    """Test Civitai search with model type filter."""
    mock_data = {
        "items": [{"id": 2, "name": "Lora", "type": "Lora"}],
        "metadata": {},
    }

    with patch("server.routers.civitai.get_models_list", new_callable=AsyncMock) as mock:
        mock.return_value = mock_data
        response = await client.get("/api/civitai/models/search?model_type=Lora")
        assert response.status_code == 200
        data = response.json()
        assert data["items"][0]["type"] == "Lora"


@pytest.mark.asyncio
async def test_search_models_api_error(client):
    """Test Civitai search proxy handles API errors."""
    from server.services.civitai_api import CivitaiAPIError

    with patch("server.routers.civitai.get_models_list", new_callable=AsyncMock) as mock:
        mock.side_effect = CivitaiAPIError("API Error")
        response = await client.get("/api/civitai/models/search")
        assert response.status_code == 502


@pytest.mark.asyncio
async def test_get_model_info(client):
    """Test getting model info from Civitai."""
    mock_model_info = {
        "id": 123,
        "name": "Test Model",
        "type": "Checkpoint",
        "description": "A test model",
        "images": [{"url": "http://example.com/preview.jpg"}],
        "versions": [{"images": [{"url": "http://example.com/v1.jpg"}]}],
    }

    with patch("server.routers.civitai.get_model_info", new_callable=AsyncMock) as mock:
        mock.return_value = mock_model_info
        response = await client.get("/api/civitai/models/123")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 123
        assert data["name"] == "Test Model"


@pytest.mark.asyncio
async def test_get_model_info_not_found(client):
    """Test getting non-existent model returns 502."""
    from server.services.civitai_api import CivitaiAPIError

    with patch("server.routers.civitai.get_model_info", new_callable=AsyncMock) as mock:
        mock.side_effect = CivitaiAPIError("Model not found")
        response = await client.get("/api/civitai/models/99999")
        assert response.status_code == 502


@pytest.mark.asyncio
async def test_find_model_by_hash_found(client):
    """Test finding model by SHA256 hash."""
    mock_hash_result = {
        "modelId": 123,
        "name": "Test Model",
        "images": [{"url": "http://example.com/preview.jpg"}],
    }

    with patch("server.routers.civitai.get_model_by_hash", new_callable=AsyncMock) as mock:
        mock.return_value = mock_hash_result
        response = await client.get("/api/civitai/models/by-hash/abc123def456")
        assert response.status_code == 200
        data = response.json()
        assert data["found"] is True
        assert data["model"]["modelId"] == 123


@pytest.mark.asyncio
async def test_find_model_by_hash_not_found(client):
    """Test finding model by hash when not in Civitai."""
    with patch("server.routers.civitai.get_model_by_hash", new_callable=AsyncMock) as mock:
        mock.return_value = None
        response = await client.get("/api/civitai/models/by-hash/notfoundhash")
        assert response.status_code == 200
        data = response.json()
        assert data["found"] is False


@pytest.mark.asyncio
async def test_download_model_dest_not_exist(client):
    """Test download model with non-existent destination."""
    request_data = {
        "model_id": 123,
        "dest_path": "/nonexistent/path",
    }
    response = await client.post("/api/civitai/download", json=request_data)
    assert response.status_code == 400
    assert "does not exist" in response.json()["detail"]


@pytest.mark.asyncio
async def test_download_model_success(client, tmp_path):
    """Test successful model download."""
    dest_dir = tmp_path / "models"
    dest_dir.mkdir()

    mock_download_result = {
        "sha256": "abc123",
        "md5": "def456",
        "total_bytes": 1024,
    }

    mock_model_info = {
        "id": 123,
        "name": "Test Model",
        "images": [{"url": "http://example.com/preview.jpg"}],
        "versions": [{"images": [{"url": "http://example.com/v1.jpg"}]}],
    }

    with patch("server.routers.civitai.download_civitai_model", new_callable=AsyncMock) as mock_dl, \
         patch("server.routers.civitai.get_model_info", new_callable=AsyncMock) as mock_info, \
         patch("server.routers.civitai.download_preview_image", new_callable=AsyncMock) as mock_preview:
        mock_dl.return_value = mock_download_result
        mock_info.return_value = mock_model_info
        mock_preview.return_value = None

        request_data = {
            "model_id": 123,
            "version_id": 1,
            "dest_path": str(dest_dir),
            "download_preview": True,
            "resize_preview": True,
        }
        response = await client.post("/api/civitai/download", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["sha256"] == "abc123"
        assert data["md5"] == "def456"
        assert data["file_size"] == 1024


@pytest.mark.asyncio
async def test_download_model_api_failure(client, tmp_path):
    """Test download model when Civitai API fails."""
    dest_dir = tmp_path / "models"
    dest_dir.mkdir()

    with patch("server.routers.civitai.download_civitai_model", new_callable=AsyncMock) as mock_dl:
        mock_dl.side_effect = Exception("Download failed")
        request_data = {
            "model_id": 123,
            "dest_path": str(dest_dir),
        }
        response = await client.post("/api/civitai/download", json=request_data)
        assert response.status_code == 502
        assert "Download failed" in response.json()["detail"]


@pytest.mark.asyncio
async def test_compute_hash_and_link_model_not_found(client):
    """Test compute_hash_and_link when model not in database."""
    response = await client.post("/api/civitai/models/nonexistent-id/hash-and-link")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_compute_hash_and_link_file_not_found(client, clean_db):
    """Test compute_hash_and_link when model file doesn't exist."""
    import uuid
    from server.database import init_db

    # Add model to database with non-existent file
    model_id = str(uuid.uuid4())
    conn = await init_db()
    await conn.execute(
        """INSERT INTO models (id, name, file_path, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)""",
        (model_id, "Test", "/nonexistent/file.safetensors", 0, 0),
    )
    await conn.commit()
    await conn.close()

    response = await client.post(f"/api/civitai/models/{model_id}/hash-and-link")
    assert response.status_code == 400
    assert "not found" in response.json()["detail"]


@pytest.mark.asyncio
async def test_compute_hash_and_link_success(client, clean_db, tmp_path):
    """Test compute_hash_and_link with linked Civitai model."""
    import uuid
    from server.database import init_db

    # Create a temp model file
    model_id = str(uuid.uuid4())
    model_file = tmp_path / "test.safetensors"
    model_file.write_bytes(b"test content")

    # Add model to database
    conn = await init_db()
    await conn.execute(
        """INSERT INTO models (id, name, file_path, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)""",
        (model_id, "Test", str(model_file), 0, 0),
    )
    await conn.commit()
    await conn.close()

    mock_hash_result = {
        "modelId": 123,
        "name": "Civitai Model",
        "description": "Found on Civitai",
        "images": [{"url": "http://example.com/preview.jpg"}],
    }

    with patch("server.routers.civitai.compute_sha256", new_callable=AsyncMock) as mock_sha, \
         patch("server.routers.civitai.get_model_by_hash", new_callable=AsyncMock) as mock_hash:
        mock_sha.return_value = "abc123def456"
        mock_hash.return_value = mock_hash_result

        response = await client.post(f"/api/civitai/models/{model_id}/hash-and-link")
        assert response.status_code == 200
        data = response.json()
        assert data["sha256"] == "abc123def456"
        assert data["civitai_linked"] is True
        assert data["civitai_info"]["modelId"] == 123