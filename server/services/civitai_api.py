"""Civitai API client for model info and downloads."""
import httpx
from typing import Optional
import asyncio

CIVITAI_API_BASE = "https://civitai.com/api/v1"
CIVITAI_DOWNLOAD_BASE = "https://civitai.com/api/download"


class CivitaiAPIError(Exception):
    """Civitai API error."""
    pass


async def get_model_info(model_id: int) -> dict:
    """Fetch model info from Civitai API."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{CIVITAI_API_BASE}/models/{model_id}"
        )
        if response.status_code == 404:
            raise CivitaiAPIError(f"Model {model_id} not found")
        if response.status_code != 200:
            raise CivitaiAPIError(f"Civitai API error: {response.status_code}")
        return response.json()


async def get_model_by_hash(sha256_hash: str) -> Optional[dict]:
    """Search for model by SHA256 hash."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{CIVITAI_API_BASE}/model-versions/by-hash/{sha256_hash}"
        )
        if response.status_code == 404:
            return None
        if response.status_code != 200:
            raise CivitaiAPIError(f"Civitai API error: {response.status_code}")
        return response.json()


async def get_models_list(
    query: Optional[str] = None,
    model_type: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """Search models list from Civitai."""
    params = {"page": page, "pageSize": page_size}
    if query:
        params["query"] = query
    if model_type:
        params["types"] = model_type

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{CIVITAI_API_BASE}/models",
            params=params,
        )
        if response.status_code != 200:
            raise CivitaiAPIError(f"Civitai API error: {response.status_code}")
        return response.json()