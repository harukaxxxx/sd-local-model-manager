# Backend Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 FastAPI 後端核心，包含 SQLite 資料庫、Models CRUD、以及目錄掃描功能。

**Architecture:** 使用 FastAPI 建立 RESTful API。SQLite 單一資料庫檔案位於專案根目錄。採用 Pydantic 做請求/回應驗證。目錄掃描使用 asyncio + aiofiles 非同步處理大目錄。

**Tech Stack:** Python 3.11+, FastAPI, aiosqlite, aiofiles, pydantic, pytest, pytest-asyncio

---

## File Structure

```
server/
├── __init__.py
├── main.py                 # FastAPI 應用程式 entry point
├── database.py             # SQLite 連線與 schema 初始化
├── models.py               # Pydantic models (request/response)
├── routers/
│   ├── __init__.py
│   └── models.py           # /api/models endpoints
├── services/
│   ├── __init__.py
│   ├── scanner.py          # 目錄掃描與模型偵測
│   └── hash.py             # async sha256/md5 hash 計算
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── test_models_api.py
    └── test_scanner.py
```

---

### Task 1: 專案初始化與依賴設定

**Files:**
- Create: `server/pyproject.toml`
- Create: `server/.gitignore`

- [ ] **Step 1: Create pyproject.toml**

```toml
[project]
name = "sd-local-model-manager-server"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.34.0",
    "aiosqlite>=0.20.0",
    "aiofiles>=24.0.0",
    "pydantic>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.25.0",
    "httpx>=0.28.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

- [ ] **Step 2: Create .gitignore**

```
__pycache__/
*.py[cod]
*$py.class
.pytest_cache/
*.db
.env
*.egg-info/
dist/
build/
```

- [ ] **Step 3: Commit**

```bash
git add server/pyproject.toml server/.gitignore
git commit -m "feat(server): init server project with pyproject.toml"
```

---

### Task 2: 資料庫初始化

**Files:**
- Create: `server/database.py`
- Create: `server/models.py`
- Test: `server/tests/test_database.py`

- [ ] **Step 1: Write database.py**

```python
"""SQLite database connection and schema initialization."""
import aiosqlite
from pathlib import Path

DATABASE_PATH = Path(__file__).parent.parent / "metadata.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS models (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    file_path     TEXT NOT NULL UNIQUE,
    file_size     INTEGER,
    sha256        TEXT,
    md5           TEXT,
    model_type    TEXT,
    civitai_id    INTEGER,
    civitai_url   TEXT,
    preview_url   TEXT,
    description   TEXT,
    nsfw          INTEGER DEFAULT 0,
    created_at    INTEGER,
    updated_at    INTEGER
);

CREATE TABLE IF NOT EXISTS tags (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS model_tags (
    model_id TEXT,
    tag_id   INTEGER,
    PRIMARY KEY (model_id, tag_id)
);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
);

CREATE INDEX IF NOT EXISTS idx_models_model_type ON models(model_type);
CREATE INDEX IF NOT EXISTS idx_models_file_path ON models(file_path);
"""


async def init_db(db_path: Path = DATABASE_PATH) -> aiosqlite.Connection:
    """Initialize database connection and create tables if not exist."""
    conn = await aiosqlite.connect(db_path)
    conn.row_factory = aiosqlite.Row
    await conn.executescript(SCHEMA)
    await conn.commit()
    return conn


async def get_db() -> aiosqlite.Connection:
    """Dependency for FastAPI to get DB connection."""
    return await init_db()
```

- [ ] **Step 2: Write models.py (Pydantic schemas)**

```python
"""Pydantic models for request/response validation."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ModelBase(BaseModel):
    name: str
    file_path: str
    file_size: Optional[int] = None
    model_type: Optional[str] = None
    civitai_id: Optional[int] = None
    civitai_url: Optional[str] = None
    preview_url: Optional[str] = None
    description: Optional[str] = None
    nsfw: bool = False


class ModelCreate(ModelBase):
    pass


class ModelUpdate(BaseModel):
    name: Optional[str] = None
    file_path: Optional[str] = None
    model_type: Optional[str] = None
    civitai_url: Optional[str] = None
    preview_url: Optional[str] = None
    description: Optional[str] = None
    nsfw: Optional[bool] = None


class ModelResponse(ModelBase):
    id: str
    sha256: Optional[str] = None
    md5: Optional[str] = None
    created_at: Optional[int] = None
    updated_at: Optional[int] = None

    class Config:
        from_attributes = True


class ModelListResponse(BaseModel):
    items: list[ModelResponse]
    total: int
    page: int
    page_size: int


class ScanRequest(BaseModel):
    directory: str = Field(..., description="Directory path to scan for models")
    recursive: bool = True


class ScanResponse(BaseModel):
    scanned: int
    added: int
    errors: list[str] = []
```

- [ ] **Step 3: Write test_database.py**

```python
import pytest
from server.database import init_db


@pytest.mark.asyncio
async def test_init_db_creates_tables(temp_db):
    """Verify tables are created."""
    cursor = await temp_db.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    )
    tables = {row["name"] for row in await cursor.fetchall()}
    assert "models" in tables
    assert "tags" in tables
    assert "settings" in tables


@pytest.mark.asyncio
async def test_init_db_with_custom_path():
    """Verify init_db works with custom path."""
    import tempfile
    from pathlib import Path

    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = Path(f.name)
    conn = await init_db(db_path)
    assert conn is not None
    await conn.close()
    db_path.unlink()
```

- [ ] **Step 4: Run tests to verify**

Run: `cd server && python -m pytest tests/test_database.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/database.py server/models.py server/tests/test_database.py
git commit -m "feat(server): add database layer with SQLite schema"
```

---

### Task 3: 目錄掃描服務 (Scanner Service)

**Files:**
- Modify: `server/services/__init__.py` (create)
- Create: `server/services/scanner.py`
- Test: `server/tests/test_scanner.py`

- [ ] **Step 1: Write services/__init__.py**

```python
"""Services package."""
```

- [ ] **Step 2: Write services/scanner.py**

```python
"""Directory scanner for detecting model files."""
import os
import aiofiles
from pathlib import Path
from typing import AsyncIterator
import asyncio

MODEL_EXTENSIONS = {
    ".ckpt", ".safetensors", ".pt", ".pth",  # Checkpoint
    ".vae", ".pt", ".pth",                     # VAE
    ".safetensors", ".pt", ".pth", ".bin",    # LoRA
    ".pt", ".pth",                             # Hypernet
    ".pt", ".pth", ".bin",                     # Embedding
}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
INFO_EXTENSIONS = {".md", ".civitai.info", ".info"}

# Known base directories for model types
MODEL_TYPE_DIRS = {
    "checkpoint": ["ckpt", "checkpoints", "stable-diffusion", "sd"],
    "vae": ["vae", "vae models"],
    "lora": ["lora", "loras", "lycoris"],
    "hypernet": ["hypernet", "hypernets"],
    "embedding": ["embedding", "embeddings", "textual_inversion"],
}


def detect_model_type(file_path: Path, parent_dir: Path) -> str:
    """Detect model type from file extension or parent directory name."""
    ext = file_path.suffix.lower()

    # Check parent directory first
    parent_name = parent_dir.name.lower()
    for model_type, dirs in MODEL_TYPE_DIRS.items():
        if parent_name in dirs:
            return model_type

    # Fall back to extension
    if ext in {".ckpt", ".safetensors"}:
        return "checkpoint"
    if ext in {".vae"}:
        return "vae"
    if ext in {".pt", ".pth", ".bin", ".safetensors"}:
        # Check if parent is lora/embedding dir
        if "lora" in parent_name or "lycoris" in parent_name:
            return "lora"
        if "embedding" in parent_name or "textual_inversion" in parent_name:
            return "embedding"
        if "hypernet" in parent_name:
            return "hypernet"
        return "other"
    return "other"


def is_model_file(path: Path) -> bool:
    """Check if file is a model file."""
    return path.suffix.lower() in MODEL_EXTENSIONS


async def scan_directory(
    root_path: Path, recursive: bool = True
) -> AsyncIterator[dict]:
    """Scan directory for model files and yield model metadata."""
    root_path = Path(root_path)
    if not root_path.exists():
        return

    pattern = "**/*" if recursive else "*"

    async for entry in _scan_dir_iter(root_path, pattern):
        if is_model_file(entry):
            stat = os.stat(entry)
            model_type = detect_model_type(entry, entry.parent)

            # Check for companion files
            preview_path = None
            for img_ext in IMAGE_EXTENSIONS:
                candidate = entry.with_suffix(img_ext)
                if candidate.exists():
                    preview_path = str(candidate)
                    break

            description_path = None
            for info_ext in INFO_EXTENSIONS:
                candidate = entry.with_suffix(info_ext)
                if candidate.exists():
                    description_path = str(candidate)
                    break

            yield {
                "file_path": str(entry),
                "name": entry.stem,
                "file_size": stat.st_size,
                "model_type": model_type,
                "preview_url": preview_path,
                "description": None,
                "sha256": None,
                "md5": None,
                "civitai_id": None,
                "civitai_url": None,
                "nsfw": 0,
                "created_at": int(stat.st_ctime),
                "updated_at": int(stat.st_mtime),
            }


async def _scan_dir_iter(root: Path, pattern: str) -> AsyncIterator[Path]:
    """Async iterator over directory entries."""

    def _walk():
        for entry in root.glob(pattern):
            if entry.is_file():
                yield entry

    loop = asyncio.get_event_loop()
    for item in await loop.run_in_executor(None, lambda: list(root.glob(pattern))):
        if item.is_file():
            yield item
```

- [ ] **Step 3: Write test_scanner.py**

```python
import pytest
import tempfile
import os
from pathlib import Path
from server.services.scanner import detect_model_type, is_model_file, scan_directory


def test_detect_model_type_from_extension():
    """Test model type detection from file extension."""
    p = Path("/models/ckpt/something.safetensors")
    assert detect_model_type(p, p.parent) == "checkpoint"

    p = Path("/models/lora/test.vae")
    assert detect_model_type(p, p.parent) == "vae"


def test_is_model_file():
    """Test model file detection."""
    assert is_model_file(Path("model.safetensors")) is True
    assert is_model_file(Path("model.ckpt")) is True
    assert is_model_file(Path("model.png")) is False
    assert is_model_file(Path("model.md")) is False


@pytest.mark.asyncio
async def test_scan_directory_finds_models():
    """Test directory scanning finds model files."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create test files
        model_path = Path(tmpdir) / "test_model.safetensors"
        model_path.write_text("dummy content")
        img_path = Path(tmpdir) / "test_model.png"
        img_path.write_text("dummy image")

        models = []
        async for model in scan_directory(Path(tmpdir)):
            models.append(model)

        assert len(models) == 1
        assert models[0]["name"] == "test_model"
        assert models[0]["model_type"] == "other"
        assert models[0]["preview_url"] is not None
```

- [ ] **Step 4: Run tests to verify**

Run: `cd server && python -m pytest tests/test_scanner.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/services/__init__.py server/services/scanner.py server/tests/test_scanner.py
git commit -m "feat(server): add directory scanner service"
```

---

### Task 4: Hash 計算服務 (Async SHA256/MD5)

**Files:**
- Create: `server/services/hash.py`
- Test: `server/tests/test_hash.py`

- [ ] **Step 1: Write services/hash.py**

```python
"""Async hash computation for model files."""
import hashlib
import aiofiles
from pathlib import Path

CHUNK_SIZE = 1024 * 1024  # 1MB chunks


async def compute_sha256(file_path: Path) -> str:
    """Compute SHA256 hash of a file asynchronously."""
    sha256_hash = hashlib.sha256()
    async with aiofiles.open(file_path, "rb") as f:
        while chunk := await f.read(CHUNK_SIZE):
            sha256_hash.update(chunk)
    return sha256_hash.hexdigest()


async def compute_md5(file_path: Path) -> str:
    """Compute MD5 hash of a file asynchronously."""
    md5_hash = hashlib.md5()
    async with aiofiles.open(file_path, "rb") as f:
        while chunk := await f.read(CHUNK_SIZE):
            md5_hash.update(chunk)
    return md5_hash.hexdigest()


async def compute_hashes(file_path: Path) -> tuple[str, str]:
    """Compute both SHA256 and MD5 hashes."""
    sha256_hash = hashlib.sha256()
    md5_hash = hashlib.md5()

    async with aiofiles.open(file_path, "rb") as f:
        while chunk := await f.read(CHUNK_SIZE):
            sha256_hash.update(chunk)
            md5_hash.update(chunk)

    return sha256_hash.hexdigest(), md5_hash.hexdigest()
```

- [ ] **Step 2: Write test_hash.py**

```python
import pytest
import tempfile
from pathlib import Path
from server.services.hash import compute_sha256, compute_md5, compute_hashes


@pytest.mark.asyncio
async def test_compute_sha256():
    """Test SHA256 computation."""
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(b"hello world")
        f.flush()
        path = Path(f.name)

    result = await compute_sha256(path)
    assert result == "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
    Path(f.name).unlink()


@pytest.mark.asyncio
async def test_compute_hashes():
    """Test simultaneous SHA256 and MD5 computation."""
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(b"test content")
        f.flush()
        path = Path(f.name)

    sha256, md5 = await compute_hashes(path)
    assert len(sha256) == 64
    assert len(md5) == 32
    Path(f.name).unlink()
```

- [ ] **Step 3: Run tests to verify**

Run: `cd server && python -m pytest tests/test_hash.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add server/services/hash.py server/tests/test_hash.py
git commit -m "feat(server): add async hash computation service"
```

---

### Task 5: Models API 路由

**Files:**
- Modify: `server/routers/__init__.py` (create)
- Create: `server/routers/models.py`
- Create: `server/main.py`
- Test: `server/tests/test_models_api.py`

- [ ] **Step 1: Write routers/__init__.py**

```python
"""Routers package."""
```

- [ ] **Step 2: Write routers/models.py**

```python
"""Models API router."""
from datetime import datetime
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
import aiosqlite

from server.database import init_db
from server.models import (
    ModelCreate,
    ModelUpdate,
    ModelResponse,
    ModelListResponse,
    ScanRequest,
    ScanResponse,
)
from server.services.scanner import scan_directory

router = APIRouter(prefix="/api/models", tags=["models"])


def row_to_model(row: aiosqlite.Row) -> ModelResponse:
    """Convert DB row to ModelResponse."""
    return ModelResponse(
        id=row["id"],
        name=row["name"],
        file_path=row["file_path"],
        file_size=row["file_size"],
        sha256=row["sha256"],
        md5=row["md5"],
        model_type=row["model_type"],
        civitai_id=row["civitai_id"],
        civitai_url=row["civitai_url"],
        preview_url=row["preview_url"],
        description=row["description"],
        nsfw=bool(row["nsfw"]),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.get("", response_model=ModelListResponse)
async def list_models(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    model_type: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    sort: Optional[str] = Query("updated_at", description="Sort field: updated_at, name, file_size"),
    order: Optional[str] = Query("desc", description="Sort order: asc, desc"),
):
    """List all models with pagination and filtering."""
    conn = await init_db()

    # Validate sort field
    allowed_sorts = {"updated_at", "name", "file_size", "created_at"}
    if sort not in allowed_sorts:
        sort = "updated_at"
    if order not in {"asc", "desc"}:
        order = "desc"

    # Build WHERE clause
    conditions = []
    params = []
    if model_type:
        conditions.append("m.model_type = ?")
        params.append(model_type)
    if search:
        conditions.append("(m.name LIKE ? OR m.file_path LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%"])
    if tag:
        conditions.append("""
            m.id IN (
                SELECT model_id FROM model_tags mt WHERE mt.tag_id = ?
            )
        """)
        params.append(int(tag))

    where_clause = " AND ".join(conditions) if conditions else "1=1"

    # Count total
    cursor = await conn.execute(
        f"SELECT COUNT(*) as count FROM models m WHERE {where_clause}",
        params,
    )
    total = (await cursor.fetchone())[0]

    # Fetch page
    offset = (page - 1) * page_size
    cursor = await conn.execute(
        f"""
        SELECT m.* FROM models m
        WHERE {where_clause}
        ORDER BY m.{sort} {order.upper()}
        LIMIT ? OFFSET ?
        """,
        params + [page_size, offset],
    )
    rows = await cursor.fetchall()
    await conn.close()

    return ModelListResponse(
        items=[row_to_model(row) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{model_id}", response_model=ModelResponse)
async def get_model(model_id: str):
    """Get a single model by ID (file_path)."""
    conn = await init_db()
    cursor = await conn.execute("SELECT * FROM models WHERE id = ?", (model_id,))
    row = await cursor.fetchone()
    await conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Model not found")
    return row_to_model(row)


@router.post("/scan", response_model=ScanResponse)
async def scan_models(request: ScanRequest):
    """Scan a directory for model files and add to database."""
    from pathlib import Path

    root = Path(request.directory)
    if not root.exists():
        raise HTTPException(status_code=400, detail="Directory does not exist")

    conn = await init_db()
    added = 0
    scanned = 0
    errors = []

    try:
        async for model_data in scan_directory(root, recursive=request.recursive):
            scanned += 1
            model_id = str(uuid.uuid4())
            model_data["id"] = model_id
            model_data["updated_at"] = model_data["created_at"]

            # Check if already exists
            cursor = await conn.execute(
                "SELECT id FROM models WHERE file_path = ?",
                (model_data["file_path"],),
            )
            existing = await cursor.fetchone()

            if not existing:
                await conn.execute(
                    """
                    INSERT INTO models (
                        id, name, file_path, file_size, sha256, md5,
                        model_type, civitai_id, civitai_url, preview_url,
                        description, nsfw, created_at, updated_at
                    ) VALUES (
                        :id, :name, :file_path, :file_size, :sha256, :md5,
                        :model_type, :civitai_id, :civitai_url, :preview_url,
                        :description, :nsfw, :created_at, :updated_at
                    )
                    """,
                    model_data,
                )
                added += 1
    except Exception as e:
        errors.append(str(e))

    await conn.commit()
    await conn.close()

    return ScanResponse(scanned=scanned, added=added, errors=errors)


@router.patch("/{model_id}", response_model=ModelResponse)
async def update_model(model_id: str, update: ModelUpdate):
    """Update model metadata."""
    conn = await init_db()

    # Check exists
    cursor = await conn.execute("SELECT * FROM models WHERE id = ?", (model_id,))
    row = await cursor.fetchone()
    if not row:
        await conn.close()
        raise HTTPException(status_code=404, detail="Model not found")

    # Build update
    updates = {}
    for field, value in update.model_dump(exclude_unset=True).items():
        if value is not None:
            updates[field] = value
    updates["updated_at"] = int(datetime.now().timestamp())

    if updates:
        set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
        await conn.execute(
            f"UPDATE models SET {set_clause} WHERE id = ?",
            list(updates.values()) + [model_id],
        )
        await conn.commit()

    # Refetch
    cursor = await conn.execute("SELECT * FROM models WHERE id = ?", (model_id,))
    row = await cursor.fetchone()
    await conn.close()

    return row_to_model(row)


@router.delete("/{model_id}")
async def delete_model(model_id: str):
    """Remove model from database (does not delete file)."""
    conn = await init_db()
    cursor = await conn.execute("SELECT id FROM models WHERE id = ?", (model_id,))
    row = await cursor.fetchone()
    if not row:
        await conn.close()
        raise HTTPException(status_code=404, detail="Model not found")

    await conn.execute("DELETE FROM model_tags WHERE model_id = ?", (model_id,))
    await conn.execute("DELETE FROM models WHERE id = ?", (model_id,))
    await conn.commit()
    await conn.close()

    return {"status": "ok"}
```

- [ ] **Step 3: Write main.py**

```python
"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from server.routers import models

app = FastAPI(title="SD Local Model Manager API", version="0.1.0")

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (frontend)
frontend_path = Path(__file__).parent.parent / "frontend"
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")

app.include_router(models.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=3000)
```

- [ ] **Step 4: Write test_models_api.py**

```python
import pytest
from httpx import AsyncClient, ASGITransport
from server.main import app


@pytest.fixture
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
```

- [ ] **Step 5: Run tests to verify**

Run: `cd server && python -m pytest tests/test_models_api.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/routers/__init__.py server/routers/models.py server/main.py
git add server/tests/test_models_api.py
git commit -m "feat(server): add models API router with CRUD endpoints"
```

---

### Task 6: Tags API

**Files:**
- Create: `server/routers/tags.py`
- Test: `server/tests/test_tags_api.py`

- [ ] **Step 1: Write routers/tags.py**

```python
"""Tags API router."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import aiosqlite

from server.database import init_db

router = APIRouter(prefix="/api/tags", tags=["tags"])


class TagResponse(BaseModel):
    id: int
    name: str


class ModelTagUpdate(BaseModel):
    model_id: str
    tag_ids: list[int]


@router.get("", response_model=list[TagResponse])
async def list_tags():
    """List all tags."""
    conn = await init_db()
    cursor = await conn.execute("SELECT * FROM tags ORDER BY name")
    rows = await cursor.fetchall()
    await conn.close()
    return [TagResponse(id=r["id"], name=r["name"]) for r in rows]


@router.post("")
async def create_tag(name: str):
    """Create a new tag."""
    conn = await init_db()
    try:
        cursor = await conn.execute(
            "INSERT INTO tags (name) VALUES (?)", (name,)
        )
        tag_id = cursor.lastrowid
        await conn.commit()
    except aiosqlite.IntegrityError:
        await conn.close()
        raise HTTPException(status_code=400, detail="Tag already exists")
    await conn.close()
    return {"id": tag_id, "name": name}


@router.post("/model")
async def update_model_tags(update: ModelTagUpdate):
    """Update tags for a model."""
    conn = await init_db()
    await conn.execute(
        "DELETE FROM model_tags WHERE model_id = ?", (update.model_id,)
    )
    for tag_id in update.tag_ids:
        await conn.execute(
            "INSERT OR IGNORE INTO model_tags (model_id, tag_id) VALUES (?, ?)",
            (update.model_id, tag_id),
        )
    await conn.commit()
    await conn.close()
    return {"status": "ok"}
```

- [ ] **Step 2: Write test_tags_api.py**

```python
import pytest
from httpx import AsyncClient, ASGITransport
from server.main import app


@pytest.fixture
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
```

- [ ] **Step 3: Run tests to verify**

Run: `cd server && python -m pytest tests/test_tags_api.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add server/routers/tags.py server/tests/test_tags_api.py
git commit -m "feat(server): add tags API router"
```

---

### Task 7: 整合測試

**Files:**
- Create: `server/tests/conftest.py`

- [ ] **Step 1: Write conftest.py**

```python
import pytest
import asyncio
import tempfile
import os
from pathlib import Path

pytest_plugins = ("pytest_asyncio",)


@pytest.fixture(scope="function")
async def temp_db():
    """Create a temporary database for each test, cleaned up after."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = Path(f.name)
    conn = await init_db(db_path)
    yield conn
    await conn.close()
    try:
        os.unlink(db_path)
    except OSError:
        pass


@pytest.fixture(scope="function")
async def populated_db(temp_db):
    """A temp_db pre-populated with a test model."""
    from server.models import ModelResponse
    import uuid
    import time

    model_id = str(uuid.uuid4())
    now = int(time.time())
    await temp_db.execute(
        """
        INSERT INTO models (id, name, file_path, file_size, model_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (model_id, "test-model", "/tmp/test.safetensors", 1024000, "checkpoint", now, now)
    )
    await temp_db.commit()
    return temp_db
```

- [ ] **Step 2: Run full test suite**

Run: `cd server && python -m pytest -v`
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add server/tests/conftest.py
git commit -m "test(server): add pytest configuration and run full test suite"
```
