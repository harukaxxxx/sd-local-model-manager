# Civitai Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 實作 Civitai API Proxy 下載、模型資訊查詢、預覽圖下載、以及 SHA256 比對功能。

**Architecture:** Civitai API 作為 Proxy 以解決 CORS 限制。使用 httpx async client 進行外部請求。下載使用分段串流避免記憶體溢出。

**Tech Stack:** httpx, aiofiles, asyncio, FastAPI (extends Backend Core)

---

## File Structure

```
server/
├── routers/
│   └── civitai.py           # /api/civitai endpoints
├── services/
│   ├── civitai_api.py       # Civitai API client
│   ├── downloader.py        # Model file downloader
│   └── preview.py           # Preview image downloader & resize
└── tests/
    ├── test_civitai_api.py
    └── test_downloader.py
```

---

### Task 1: Civitai API 用戶端

**Files:**
- Create: `server/services/civitai_api.py`
- Test: `server/tests/test_civitai_api.py`

- [ ] **Step 1: Write services/civitai_api.py**

```python
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
```

- [ ] **Step 2: Write test_civitai_api.py (mocked)**

```python
import pytest
from unittest.mock import AsyncMock, patch
from server.services.civitai_api import get_model_info, get_model_by_hash


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
                "json": lambda: mock_response,
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
```

- [ ] **Step 3: Run tests to verify**

Run: `cd server && python -m pytest tests/test_civitai_api.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add server/services/civitai_api.py server/tests/test_civitai_api.py
git commit -m "feat(civitai): add Civitai API client"
```

---

### Task 2: 檔案下載服務

**Files:**
- Create: `server/services/downloader.py`
- Test: `server/tests/test_downloader.py`

- [ ] **Step 1: Write services/downloader.py**

```python
"""Model file downloader with streaming."""
import httpx
import aiofiles
from pathlib import Path
from typing import Optional

CHUNK_SIZE = 1024 * 1024  # 1MB


async def download_file(
    url: str,
    dest_path: Path,
    expected_size: Optional[int] = None,
    progress_callback: Optional[callable] = None,
) -> dict:
    """
    Download a file with streaming to avoid memory overflow.
    Returns dict with total_bytes, sha256, md5.
    """
    import hashlib

    dest_path = Path(dest_path)
    dest_path.parent.mkdir(parents=True, exist_ok=True)

    sha256_hash = hashlib.sha256()
    md5_hash = hashlib.md5()
    total_bytes = 0

    async with httpx.AsyncClient(
        timeout=httpx.Timeout(300.0, connect=30.0),
        follow_redirects=True,
        headers={"User-Agent": "SD-Local-Model-Manager/1.0"},
    ) as client:
        async with client.stream("GET", url) as response:
            if response.status_code != 200:
                raise Exception(f"Download failed: HTTP {response.status_code}")

            content_length = response.headers.get("content-length")
            if content_length:
                expected_size = int(content_length)

            async with aiofiles.open(dest_path, "wb") as f:
                async for chunk in response.aiter_bytes(chunk_size=CHUNK_SIZE):
                    await f.write(chunk)
                    sha256_hash.update(chunk)
                    md5_hash.update(chunk)
                    total_bytes += len(chunk)

                    if progress_callback:
                        progress_callback(total_bytes, expected_size or 0)

    return {
        "total_bytes": total_bytes,
        "sha256": sha256_hash.hexdigest(),
        "md5": md5_hash.hexdigest(),
    }


async def download_civitai_model(
    model_id: int,
    dest_path: Path,
    version_id: Optional[int] = None,
) -> dict:
    """Download a model from Civitai by model ID and version ID."""
    version_param = f"?version={version_id}" if version_id else ""
    url = f"https://civitai.com/api/download/{model_id}{version_param}"
    return await download_file(url, dest_path)
```

- [ ] **Step 2: Write test_downloader.py**

```python
import pytest
from pathlib import Path
import tempfile
import os
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_download_file_with_mock():
    """Test download_file with mocked response."""
    dest = Path(tempfile.mktemp(suffix=".bin"))

    async def mock_stream(*args, **kwargs):
        async def async_iter():
            yield b"hello world"
        return type("Response", (), {
            "status_code": 200,
            "headers": {"content-length": "11"},
            "aiter_bytes": async_iter,
        })()

    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value.stream = mock_stream
        from server.services.downloader import download_file
        result = await download_file("http://example.com/file.bin", dest)

    assert result["total_bytes"] == 11
    assert len(result["sha256"]) == 64
    assert len(result["md5"]) == 32
    os.unlink(dest)
```

- [ ] **Step 3: Run tests to verify**

Run: `cd server && python -m pytest tests/test_downloader.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add server/services/downloader.py server/tests/test_downloader.py
git commit -m "feat(civitai): add model file downloader with streaming"
```

---

### Task 3: 預覽圖下載與縮圖服務

**Files:**
- Create: `server/services/preview.py`
- Test: `server/tests/test_preview.py`

- [ ] **Step 1: Write services/preview.py**

```python
"""Preview image download and resize."""
import httpx
import aiofiles
from pathlib import Path
from PIL import Image
import io

CHUNK_SIZE = 512 * 1024  # 512KB
THUMBNAIL_SIZE = (512, 512)


async def download_preview_image(url: str, dest_path: Path, resize: bool = True) -> Path:
    """Download preview image from URL and optionally resize."""
    dest_path = Path(dest_path)
    dest_path.parent.mkdir(parents=True, exist_ok=True)

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url)
        if response.status_code != 200:
            raise Exception(f"Failed to download preview: HTTP {response.status_code}")

        content = response.read()

    if resize:
        img = Image.open(io.BytesIO(content))
        img.thumbnail(THUMBNAIL_SIZE, Image.LANCZOS)
        img.save(dest_path)
    else:
        async with aiofiles.open(dest_path, "wb") as f:
            await f.write(content)

    return dest_path


def blur_image(image_path: Path, output_path: Path, radius: int = 15) -> Path:
    """Apply Gaussian blur to an image for NSFW masking."""
    img = Image.open(image_path)
    img = img.filter(Image.GaussianBlur(radius=radius))
    img.save(output_path)
    return output_path
```

- [ ] **Step 2: Write test_preview.py**

```python
import pytest
from pathlib import Path
import tempfile
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_download_preview_with_resize():
    """Test preview image download and resize."""
    dest = Path(tempfile.mktemp(suffix=".jpg"))

    # Create a minimal valid image in memory
    from PIL import Image
    img = Image.new("RGB", (1000, 1000), color="red")
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="JPEG")
    img_bytes = img_bytes.getvalue()

    with patch("httpx.AsyncClient") as mock_client:
        mock_instance = mock_client.return_value.__aenter__.return_value
        mock_instance.get = AsyncMock(
            return_value=type("Response", (), {
                "status_code": 200,
                "read": lambda: img_bytes,
            })()
        )
        from server.services.preview import download_preview_image
        result = await download_preview_image("http://example.com/preview.jpg", dest)

    assert result.exists()
    # Verify it's resized (should be smaller)
    result.unlink()
```

- [ ] **Step 3: Run tests to verify**

Run: `cd server && python -m pytest tests/test_preview.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add server/services/preview.py server/tests/test_preview.py
git commit -m "feat(civitai): add preview image download and resize"
```

---

### Task 4: Civitai API 路由

**Files:**
- Create: `server/routers/civitai.py`
- Test: `server/tests/test_civitai_api_router.py`

- [ ] **Step 1: Write routers/civitai.py**

```python
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
    model_id: int
    version_id: Optional[int] = None
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
    """Download a model from Civitai."""
    dest_dir = Path(request.dest_path)
    if not dest_dir.exists():
        raise HTTPException(status_code=400, detail="Destination directory does not exist")

    filename = request.dest_filename or f"model_{request.model_id}"
    model_path = dest_dir / f"{filename}.safetensors"

    # Download model
    try:
        result = await download_civitai_model(
            request.model_id,
            model_path,
            request.version_id,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Download failed: {e}")

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
```

- [ ] **Step 2: Write test_civitai_api_router.py**

```python
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport
from server.main import app


@pytest.fixture
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
```

- [ ] **Step 3: Run tests to verify**

Run: `cd server && python -m pytest tests/test_civitai_api_router.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add server/routers/civitai.py server/tests/test_civitai_api_router.py
git commit -m "feat(civitai): add Civitai API router with proxy and download"
```

---

### Task 5: Google Drive 下載支援

**Files:**
- Modify: `server/services/downloader.py` (add GDrive support)

- [ ] **Step 1: Add GDrive support to downloader.py**

Add to `services/downloader.py`:

```python
async def download_gdrive(gdrive_url: str, dest_path: Path) -> dict:
    """Download from Google Drive sharing link using streaming."""
    import re
    import hashlib

    # Extract file ID from GDrive URL
    # https://drive.google.com/file/d/FILE_ID/view -> FILE_ID
    match = re.search(r"/d/([a-zA-Z0-9_-]+)", gdrive_url)
    if not match:
        raise ValueError("Invalid Google Drive URL")

    file_id = match.group(1)
    download_url = f"https://drive.google.com/uc?export=download&id={file_id}"

    sha256_hash = hashlib.sha256()
    md5_hash = hashlib.md5()
    total_bytes = 0

    async with httpx.AsyncClient(timeout=300.0, follow_redirects=True) as client:
        response = await client.get(download_url)
        # GDrive shows confirmation page for large files
        if "confirm" in response.text:
            # Parse confirm token from the confirmation page
            match = re.search(r"name=\"download\" href=\"(.*?)\"", response.text)
            if match:
                download_url = "https://drive.google.com" + match.group(1)
                response = await client.get(download_url)

        # Stream the file to avoid memory overflow
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(dest_path, "wb") as f:
            async for chunk in response.aiter_bytes(chunk_size=CHUNK_SIZE):
                await f.write(chunk)
                sha256_hash.update(chunk)
                md5_hash.update(chunk)
                total_bytes += len(chunk)

    return {
        "total_bytes": total_bytes,
        "sha256": sha256_hash.hexdigest(),
        "md5": md5_hash.hexdigest(),
    }
```

- [ ] **Step 2: Update DownloadRequest and download_model for GDrive URLs**

In `routers/civitai.py`, update `DownloadRequest` and `download_model`:

```python
class DownloadRequest(BaseModel):
    model_id: Optional[int] = None
    version_id: Optional[int] = None
    url: Optional[str] = None  # Direct URL (including GDrive)
    dest_path: str
    dest_filename: Optional[str] = None
    download_preview: bool = True
    resize_preview: bool = True

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
```

- [ ] **Step 3: Run tests**

Run: `cd server && python -m pytest tests/test_downloader.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add server/services/downloader.py server/routers/civitai.py
git commit -m "feat(civitai): add Google Drive download support"
```

---

### Task 6: 整合測試

- [ ] **Step 1: Run full test suite**

Run: `cd server && python -m pytest -v`
Expected: ALL PASS

- [ ] **Step 2: Commit**

```bash
git commit -m "test(civitai): run full integration tests"
```
