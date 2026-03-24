import pytest
from unittest.mock import AsyncMock, patch
from server.services.civitai_api import get_model_info, get_model_by_hash, get_models_list, CivitaiAPIError


@pytest.mark.asyncio
async def test_get_model_info_success():
    """Test fetching model info."""
    mock_response = {
        "id": 123,
        "name": "Test Model",
        "modelType": "Checkpoint",
    }

    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value.get = AsyncMock(
            return_value=type("Response", (), {
                "status_code": 200,
                "json": lambda self: mock_response,
            })()
        )
        result = await get_model_info(123)
        assert result["name"] == "Test Model"


@pytest.mark.asyncio
async def test_get_model_by_hash_not_found():
    """Test hash search returns None when not found."""
    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value.get = AsyncMock(
            return_value=type("Response", (), {
                "status_code": 404,
            })()
        )
        result = await get_model_by_hash("abc123")
        assert result is None


@pytest.mark.asyncio
async def test_get_model_info_not_found():
    """Test fetching model info when model doesn't exist."""
    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value.get = AsyncMock(
            return_value=type("Response", (), {
                "status_code": 404,
            })()
        )
        with pytest.raises(CivitaiAPIError, match="Model 999 not found"):
            await get_model_info(999)


@pytest.mark.asyncio
async def test_get_model_info_api_error():
    """Test fetching model info when API returns error."""
    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value.get = AsyncMock(
            return_value=type("Response", (), {
                "status_code": 500,
            })()
        )
        with pytest.raises(CivitaiAPIError, match="Civitai API error: 500"):
            await get_model_info(123)


@pytest.mark.asyncio
async def test_get_models_list_success():
    """Test listing models with query."""
    mock_response = {
        "items": [
            {"id": 1, "name": "Model 1"},
            {"id": 2, "name": "Model 2"},
        ],
        "metadata": {"page": 1, "pageSize": 20},
    }

    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value.get = AsyncMock(
            return_value=type("Response", (), {
                "status_code": 200,
                "json": lambda self: mock_response,
            })()
        )
        result = await get_models_list(query="test", model_type="Checkpoint")
        assert len(result["items"]) == 2
        assert result["metadata"]["page"] == 1