"""Civitai API proxy router."""
import asyncio
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel

from server.database import init_db
from server.services.civitai_api import (
    get_model_info,
    get_model_by_hash,
    get_models_list,
    CivitaiAPIError,
)
from server.services.downloader import download_civitai_model
from server.services.preview import download_preview_image
from server.services.hash import compute_sha256

router = APIRouter(prefix="/api/civitai", tags=["civitai"])


class CivitaiModelInfo(BaseModel):
    id: int
    name: str
    type: str
    description: Optional[str] = None
    preview_url: Optional[str] = None
    versions: list[dict] = []


class DownloadRequest(BaseModel):
    model_id: Optional[int] = None
    version_id: Optional[int] = None
    url: Optional[str] = None  # Direct URL (including GDrive)
    dest_path: str
    dest_filename: Optional[str] = None
    download_preview: bool = True
    resize_preview: bool = True


@router.get("/models/search")
async def search_models(
    query: Optional[str] = None,
    model_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
):
    """Search Civitai models (proxy)."""
    try:
        result = await get_models_list(query, model_type, page, page_size)
        return result
    except CivitaiAPIError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/models/{model_id}")
async def get_model(model_id: int):
    """Get detailed model info from Civitai."""
    try:
        result = await get_model_info(model_id)
        return result
    except CivitaiAPIError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/download")
async def download_model(request: DownloadRequest, background_tasks: BackgroundTasks):
    """Download a model from Civitai or direct URL."""
    dest_dir = Path(request.dest_path)
    if not dest_dir.exists():
        raise HTTPException(status_code=400, detail="Destination directory does not exist")

    filename = request.dest_filename or f"model_{request.model_id or 'download'}"
    model_path = dest_dir / f"{filename}.safetensors"

    if request.url:
        # Direct URL download (Civitai, GDrive, etc.)
        from server.services.downloader import download_file
        result = await download_file(request.url, model_path)
    else:
        # Download from Civitai by model ID
        result = await download_civitai_model(
            request.model_id,
            model_path,
            request.version_id,
        )

    # Fetch model info to get preview image URL
    preview_path = None
    if request.download_preview:
        try:
            model_info = await get_model_info(request.model_id)
            # Get first preview image from model versions
            images = model_info.get("images", [])
            if not images and model_info.get("versions"):
                images = model_info["versions"][0].get("images", [])
            preview_url = images[0].get("url") if images else None
            if preview_url:
                preview_path = dest_dir / f"{filename}.jpg"
                await download_preview_image(preview_url, preview_path, request.resize_preview)
        except Exception:
            pass  # Preview download is best effort

    return {
        "status": "ok",
        "file_path": str(model_path),
        "preview_path": str(preview_path) if preview_path else None,
        "sha256": result["sha256"],
        "md5": result["md5"],
        "file_size": result["total_bytes"],
    }


@router.get("/models/by-hash/{sha256}")
async def find_model_by_hash(sha256: str):
    """Find Civitai model by SHA256 hash."""
    try:
        result = await get_model_by_hash(sha256)
        if not result:
            return {"found": False}
        return {"found": True, "model": result}
    except CivitaiAPIError as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/models/{model_id}/hash-and-link")
async def compute_hash_and_link(model_id: str, background_tasks: BackgroundTasks):
    """Compute SHA256 of local model and try to link to Civitai."""
    conn = await init_db()
    cursor = await conn.execute("SELECT file_path FROM models WHERE id = ?", (model_id,))
    row = await cursor.fetchone()
    await conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Model not found")

    file_path = Path(row["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=400, detail="Model file not found")

    # Compute hash in background
    sha256 = await compute_sha256(file_path)

    # Try to find on Civitai
    civitai_info = None
    try:
        civitai_info = await get_model_by_hash(sha256)
    except Exception:
        pass

    # Update model with hash and civitai link
    conn = await init_db()
    updates = {"sha256": sha256}
    if civitai_info:
        updates["civitai_id"] = civitai_info.get("modelId")
        updates["civitai_url"] = f"https://civitai.com/models/{civitai_info.get('modelId')}"
        updates["preview_url"] = civitai_info.get("images", [{}])[0].get("url") if civitai_info.get("images") else None
        updates["description"] = civitai_info.get("description")

    set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
    await conn.execute(
        f"UPDATE models SET {set_clause}, updated_at = ? WHERE id = ?",
        list(updates.values()) + [int(__import__('time').time()), model_id],
    )
    await conn.commit()
    await conn.close()

    return {
        "sha256": sha256,
        "civitai_linked": civitai_info is not None,
        "civitai_info": civitai_info,
    }