# Import/Export & Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 實作 .info 匯入、JSON 匯出入、批次搬移、NSFW 模糊、以及最終潤色。

**Architecture:** 在所有先前子系統完成後實作的最後一批功能。包括檔案解析、資料庫匯出入、以及 UI polish。

**Tech Stack:** Python (Backend Core), HTML/CSS/JS (Frontend)

---

## File Structure

```
server/
├── routers/
│   └── import_export.py     # Import/export endpoints
├── services/
│   └── info_parser.py        # .info / .civitai.info parser
└── tests/
    └── test_info_parser.py

frontend/
├── js/
│   ├── components/
│   │   ├── ImportExportModal.js
│   │   └── MoveModal.js
│   └── main.js               # Updated with import/export
└── css/
    └── components.css        # Additional polish styles
```

---

### Task 1: .info 檔案解析器

**Files:**
- Create: `server/services/info_parser.py`
- Test: `server/tests/test_info_parser.py`

- [ ] **Step 1: Write services/info_parser.py**

```python
"""Parser for .info and .civitai.info files."""
import json
import re
from pathlib import Path
from typing import Optional


def parse_civitai_info(file_path: Path) -> dict:
    """Parse .civitai.info JSON file."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {
            "name": data.get("name", file_path.stem),
            "description": data.get("description", ""),
            "civitai_id": data.get("civitaiId"),
            "civitai_url": data.get("civitaiUrl"),
            "preview_url": data.get("preview", {}).get("url") if isinstance(data.get("preview"), dict) else data.get("preview"),
            "tags": data.get("tags", []),
            "nsfw": data.get("nsfw", False),
            "version": data.get("version"),
        }
    except (json.JSONDecodeError, IOError) as e:
        raise ValueError(f"Failed to parse {file_path}: {e}")


def parse_md_info(file_path: Path) -> dict:
    """Parse .md file for model description (stable diffusion webui format)."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        description = content.strip()

        # Try to extract prompt sections
        positive_prompt = None
        negative_prompt = None

        pos_match = re.search(r"\*\*Positive prompt:\*\*\s*\n(.*?)(?=\n\*\*|$)", content, re.DOTALL | re.IGNORECASE)
        neg_match = re.search(r"\*\*Negative prompt:\*\*\s*\n(.*?)(?=\n\*\*|$)", content, re.DOTALL | re.IGNORECASE)

        if pos_match:
            positive_prompt = pos_match.group(1).strip()
        if neg_match:
            negative_prompt = neg_match.group(1).strip()

        return {
            "name": file_path.stem,
            "description": description,
            "positive_prompt": positive_prompt,
            "negative_prompt": negative_prompt,
        }
    except IOError as e:
        raise ValueError(f"Failed to read {file_path}: {e}")


def parse_info_file(file_path: Path) -> dict:
    """Auto-detect and parse info file."""
    file_path = Path(file_path)
    if file_path.suffix == ".civitai.info":
        return parse_civitai_info(file_path)
    elif file_path.suffix == ".info":
        return parse_civitai_info(file_path)
    elif file_path.suffix == ".md":
        return parse_md_info(file_path)
    else:
        raise ValueError(f"Unsupported info file type: {file_path.suffix}")
```

- [ ] **Step 2: Write test_info_parser.py**

```python
import pytest
import tempfile
import json
from pathlib import Path
from server.services.info_parser import (
    parse_civitai_info,
    parse_md_info,
    parse_info_file,
)


def test_parse_civitai_info():
    """Test parsing .civitai.info JSON."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".civitai.info", delete=False, encoding="utf-8"
    ) as f:
        json.dump({
            "name": "Test Model",
            "description": "A test model",
            "civitaiId": 12345,
            "nsfw": False,
        }, f)
        path = Path(f.name)

    result = parse_civitai_info(path)
    assert result["name"] == "Test Model"
    assert result["civitai_id"] == 12345
    path.unlink()


def test_parse_md_info():
    """Test parsing .md description file."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".md", delete=False, encoding="utf-8"
    ) as f:
        f.write("**Positive prompt:**\nmasterpiece, best quality\n**Negative prompt:**\nworst quality")
        path = Path(f.name)

    result = parse_md_info(path)
    assert "masterpiece" in result["positive_prompt"]
    assert "worst quality" in result["negative_prompt"]
    path.unlink()


def test_parse_info_file_auto_detect():
    """Test auto-detection of info file type."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".info", delete=False, encoding="utf-8"
    ) as f:
        json.dump({"name": "Auto Detect"}, f)
        path = Path(f.name)

    result = parse_info_file(path)
    assert result["name"] == "Auto Detect"
    path.unlink()
```

- [ ] **Step 3: Run tests**

Run: `cd server && python -m pytest tests/test_info_parser.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add server/services/info_parser.py server/tests/test_info_parser.py
git commit -m "feat(import): add .info file parser for model metadata"
```

---

### Task 2: Import/Export API 路由

**Files:**
- Create: `server/routers/import_export.py`
- Test: `server/tests/test_import_export.py`

- [ ] **Step 1: Write routers/import_export.py**

```python
"""Import/export router for models database."""
import json
import aiofiles
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import Response

from server.database import init_db
from server.services.info_parser import parse_info_file
from server.services.hash import compute_sha256, compute_md5, compute_hashes

router = APIRouter(prefix="/api/import", tags=["import"])


@router.post("/from-info")
async def import_from_info(file_path: str):
    """Parse .info/.civitai.info file and return model data."""
    path = Path(file_path)
    if not path.exists():
        raise HTTPException(status_code=400, detail="File not found")

    try:
        data = parse_info_file(path)
        return data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/bind-file")
async def bind_existing_file(
    file_path: str,
    name: str,
    model_type: str = "other",
):
    """Bind an existing model file to database."""
    path = Path(file_path)
    if not path.exists():
        raise HTTPException(status_code=400, detail="File not found")

    if not path.is_file():
        raise HTTPException(status_code=400, detail="Not a file")

    import uuid
    import time

    stat = path.stat()

    conn = await init_db()
    model_id = str(uuid.uuid4())

    # Check if already bound
    cursor = await conn.execute(
        "SELECT id FROM models WHERE file_path = ?", (str(path),)
    )
    if await cursor.fetchone():
        await conn.close()
        raise HTTPException(status_code=400, detail="File already bound")

    await conn.execute(
        """
        INSERT INTO models (
            id, name, file_path, file_size, model_type,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (model_id, name, str(path), stat.st_size, model_type, int(stat.st_ctime), int(time.time()))
    )
    await conn.commit()
    await conn.close()

    return {"id": model_id, "status": "bound"}


@router.post("/export/json")
async def export_database_json():
    """Export entire database as JSON."""
    conn = await init_db()

    cursor = await conn.execute("SELECT * FROM models")
    models = [dict(row) for row in await cursor.fetchall()]

    cursor = await conn.execute("SELECT * FROM tags")
    tags = [dict(row) for row in await cursor.fetchall()]

    cursor = await conn.execute("SELECT * FROM model_tags")
    model_tags = [dict(row) for row in await cursor.fetchall()]

    cursor = await conn.execute("SELECT * FROM settings")
    settings = [dict(row) for row in await cursor.fetchall()]

    await conn.close()

    return {
        "version": "1.0",
        "exported_at": int(__import__("time").time()),
        "models": models,
        "tags": tags,
        "model_tags": model_tags,
        "settings": settings,
    }


@router.post("/import/json")
async def import_database_json(file: UploadFile = File(...)):
    """Import database from JSON file."""
    if not file.filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="Must be a JSON file")

    content = await file.read()

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    if "models" not in data:
        raise HTTPException(status_code=400, detail="Invalid export format")

    conn = await init_db()

    # Import in transaction
    try:
        for model in data["models"]:
            # Check if file_path already exists
            cursor = await conn.execute(
                "SELECT id FROM models WHERE file_path = ?", (model["file_path"],)
            )
            if await cursor.fetchone():
                continue  # Skip existing

            await conn.execute(
                """
                INSERT OR REPLACE INTO models (
                    id, name, file_path, file_size, sha256, md5,
                    model_type, civitai_id, civitai_url, preview_url,
                    description, nsfw, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    model["id"], model["name"], model["file_path"],
                    model.get("file_size"), model.get("sha256"), model.get("md5"),
                    model.get("model_type"), model.get("civitai_id"),
                    model.get("civitai_url"), model.get("preview_url"),
                    model.get("description"), model.get("nsfw", 0),
                    model.get("created_at"), model.get("updated_at"),
                )
            )

        for tag in data.get("tags", []):
            await conn.execute(
                "INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)",
                (tag["id"], tag["name"])
            )

        for mt in data.get("model_tags", []):
            await conn.execute(
                "INSERT OR IGNORE INTO model_tags (model_id, tag_id) VALUES (?, ?)",
                (mt["model_id"], mt["tag_id"])
            )

        await conn.commit()
    except Exception as e:
        await conn.rollback()
        raise HTTPException(status_code=500, detail=f"Import failed: {e}")
    finally:
        await conn.close()

    return {"status": "ok", "imported_models": len(data["models"])}


@router.post("/batch-hash")
async def batch_compute_hashes(limit: int = 10):
    """Compute hashes for models that don't have them yet."""
    conn = await init_db()
    cursor = await conn.execute(
        "SELECT id, file_path FROM models WHERE sha256 IS NULL LIMIT ?",
        (limit,)
    )
    models = await cursor.fetchall()
    await conn.close()

    results = []
    for model in models:
        model_id, file_path = model["id"], model["file_path"]
        path = Path(file_path)
        if not path.exists():
            results.append({"id": model_id, "status": "file_not_found"})
            continue

        try:
            sha256, md5 = await compute_hashes(path)
            conn = await init_db()
            await conn.execute(
                "UPDATE models SET sha256 = ?, md5 = ? WHERE id = ?",
                (sha256, md5, model_id)
            )
            await conn.commit()
            await conn.close()
            results.append({"id": model_id, "sha256": sha256, "md5": md5, "status": "ok"})
        except Exception as e:
            results.append({"id": model_id, "status": "error", "error": str(e)})

    return results
```

- [ ] **Step 2: Write test_import_export.py**

```python
import pytest
import json
import tempfile
from pathlib import Path
from httpx import AsyncClient, ASGITransport
from server.main import app


@pytest.fixture
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
```

- [ ] **Step 3: Run tests**

Run: `cd server && python -m pytest tests/test_import_export.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add server/routers/import_export.py server/tests/test_import_export.py
git commit -m "feat(import): add import/export API for models database"
```

---

### Task 2: Add POST /api/models/move Endpoint

**Files:**
- Modify: `server/routers/models.py` (from Plan 1)

- [ ] **Step 1: Add move endpoint to models router**

Add this endpoint to `server/routers/models.py` (after the existing endpoints):

```python
class MoveRequest(BaseModel):
    model_ids: list[str]
    dest_path: str
    rename_prefix: Optional[str] = None


@router.post("/move")
async def move_models(request: MoveRequest):
    """Move/relocate model files to a new directory."""
    import shutil
    from server.models import ModelUpdate

    dest = Path(request.dest_path)
    if not dest.exists():
        raise HTTPException(status_code=400, detail="Destination directory does not exist")
    if not dest.is_dir():
        raise HTTPException(status_code=400, detail="Destination is not a directory")

    results = []
    conn = await init_db()

    for model_id in request.model_ids:
        cursor = await conn.execute("SELECT file_path, name FROM models WHERE id = ?", (model_id,))
        row = await cursor.fetchone()
        if not row:
            results.append({"id": model_id, "status": "not_found"})
            continue

        src_path = Path(row["file_path"])
        if not src_path.exists():
            results.append({"id": model_id, "status": "file_missing"})
            continue

        # Compute new filename
        new_name = (request.rename_prefix or "") + src_path.name
        new_path = dest / new_name

        try:
            shutil.move(str(src_path), str(new_path))

            # Update database
            from datetime import datetime
            await conn.execute(
                "UPDATE models SET file_path = ?, updated_at = ? WHERE id = ?",
                (str(new_path), int(datetime.now().timestamp()), model_id)
            )
            results.append({"id": model_id, "status": "ok", "new_path": str(new_path)})
        except Exception as e:
            results.append({"id": model_id, "status": "error", "error": str(e)})

    await conn.commit()
    await conn.close()
    return {"results": results}

@router.post("/rename")
async def rename_model(model_id: str, new_name: str):
    """Rename a model file and update database."""
    import shutil
    from datetime import datetime

    conn = await init_db()
    cursor = await conn.execute("SELECT file_path FROM models WHERE id = ?", (model_id,))
    row = await cursor.fetchone()
    if not row:
        await conn.close()
        raise HTTPException(status_code=404, detail="Model not found")

    src_path = Path(row["file_path"])
    if not src_path.exists():
        await conn.close()
        raise HTTPException(status_code=400, detail="File not found")

    new_path = src_path.parent / new_name
    shutil.move(str(src_path), str(new_path))

    await conn.execute(
        "UPDATE models SET file_path = ?, name = ?, updated_at = ? WHERE id = ?",
        (str(new_path), new_name, int(datetime.now().timestamp()), model_id)
    )
    await conn.commit()
    await conn.close()
    return {"status": "ok", "new_path": str(new_path)}
```

- [ ] **Step 2: Run tests**

Run: `cd server && python -m pytest tests/test_models_api.py -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add server/routers/models.py
git commit -m "feat(server): add move and rename model endpoints"
```

---

### Task 3: 批次搬移功能 (Move Modal)

**Files:**
- Create: `frontend/js/components/MoveModal.js`

- [ ] **Step 1: Write js/components/MoveModal.js**

```javascript
/** Move modal for relocating model files. */
import { showToast } from "./common.js";

export class MoveModal {
  constructor(models, { onMoved }) {
    this.models = models;
    this.onMoved = onMoved;
    this.element = this.render();
  }

  render() {
    const modal = document.createElement("div");
    modal.className = "modal-container";
    const modelNames = this.models.length <= 3
      ? this.models.map((m) => m.name).join(", ")
      : `${this.models.length} 個模型`;

    modal.innerHTML = `
      <div class="modal" style="max-width: 480px;">
        <div class="modal-header">
          <h2 class="modal-title">搬移模型</h2>
          <button class="modal-close btn-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 16px; color: var(--text-secondary);">
            將搬移：<strong>${modelNames}</strong>
          </p>
          <div class="form-group">
            <label class="form-label">目標資料夾</label>
            <input type="text" class="form-input" id="move-dest" placeholder="例如：C:/models/ckpt">
          </div>
          <div class="form-group">
            <label class="form-label">
              <input type="checkbox" id="move-rename"> 同時重新命名
            </label>
            <input type="text" class="form-input" id="move-name-prefix" placeholder="前置文字（選填）" style="margin-top: 8px;">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-cancel">取消</button>
          <button class="btn btn-primary" id="move-confirm">搬移</button>
        </div>
      </div>
    `;

    modal.querySelector(".modal-close").addEventListener("click", () => modal.remove());
    modal.querySelector(".modal-cancel").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelector("#move-confirm").addEventListener("click", async () => {
      const dest = modal.querySelector("#move-dest").value.trim();
      if (!dest) {
        showToast("請輸入目標資料夾", "warning");
        return;
      }

      const btn = modal.querySelector("#move-confirm");
      btn.disabled = true;
      btn.textContent = "搬移中...";

      try {
        // Move via API
        const response = await fetch("/api/models/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model_ids: this.models.map((m) => m.id),
            dest_path: dest,
            rename_prefix: modal.querySelector("#move-rename").checked
              ? modal.querySelector("#move-name-prefix").value.trim()
              : null,
          }),
        });

        if (!response.ok) throw new Error("Move failed");

        showToast(`${this.models.length} 個模型已搬移`, "success");
        if (this.onMoved) this.onMoved();
        modal.remove();
      } catch (e) {
        showToast(`搬移失敗: ${e.message}`, "error");
        btn.disabled = false;
        btn.textContent = "搬移";
      }
    });

    return modal;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/js/components/MoveModal.js
git commit -m "feat(frontend): add move modal for batch relocation"
```

---

### Task 4: NSFW 模糊處理增強

**Files:**
- Modify: `server/services/preview.py` (add blur service)
- Modify: `frontend/js/components/ModelDetail.js` (add blur toggle)

- [ ] **Step 1: Add blur API endpoint to preview.py**

```python
@router.post("/blur")
async def blur_preview(
    image_path: str,
    radius: int = 20,
):
    """Apply Gaussian blur to preview image for NSFW content."""
    from pathlib import Path
    import time

    input_path = Path(image_path)
    if not input_path.exists():
        raise HTTPException(status_code=400, detail="Image not found")

    blurred_path = input_path.parent / f"{input_path.stem}_blurred{input_path.suffix}"
    blur_image(input_path, blurred_path, radius)

    return {"blurred_path": str(blurred_path)}
```

- [ ] **Step 2: Add NSFW blur toggle in ModelDetail.js**

Update ModelDetail to add an "套用模糊" button that calls the blur API and updates preview_url.

- [ ] **Step 3: Commit**

```bash
git add server/services/preview.py frontend/js/components/ModelDetail.js
git commit -m "feat(polish): add NSFW blur processing"
```

---

### Task 5: Import/Export Modal

**Files:**
- Create: `frontend/js/components/ImportExportModal.js`

- [ ] **Step 1: Write js/components/ImportExportModal.js**

```javascript
/** Import/Export modal component. */
import { showToast } from "./common.js";

export class ImportExportModal {
  constructor({ onComplete }) {
    this.onComplete = onComplete;
    this.element = this.render();
  }

  render() {
    const modal = document.createElement("div");
    modal.className = "modal-container";
    modal.innerHTML = `
      <div class="modal" style="max-width: 480px;">
        <div class="modal-header">
          <h2 class="modal-title">匯入/匯出</h2>
          <button class="modal-close btn-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="settings-section">
            <h3 class="settings-section-title">匯出</h3>
            <button class="btn btn-secondary" id="export-json" style="width: 100%;">
              匯出資料庫（JSON）
            </button>
            <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">
              匯出所有模型資料庫內容為 JSON 檔案
            </p>
          </div>

          <div class="settings-section">
            <h3 class="settings-section-title">匯入</h3>
            <div style="border: 2px dashed var(--border-color); border-radius: var(--radius-md); padding: 24px; text-align: center;"
                 id="drop-zone">
              <p style="color: var(--text-muted);">拖放 JSON 檔案至此或</p>
              <input type="file" id="import-file" accept=".json" style="display: none;">
              <button class="btn btn-secondary" id="import-btn" style="margin-top: 8px;">選擇檔案</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-close">關閉</button>
        </div>
      </div>
    `;

    modal.querySelector(".modal-close").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });

    // Export
    modal.querySelector("#export-json").addEventListener("click", async () => {
      try {
        const response = await fetch("/api/import/export/json", { method: "POST" });
        const data = await response.json();

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sd-models-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showToast("已匯出", "success");
      } catch (e) {
        showToast(`匯出失敗: ${e.message}`, "error");
      }
    });

    // Import
    const fileInput = modal.querySelector("#import-file");
    modal.querySelector("#import-btn").addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/import/json", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error(await response.text());

        const result = await response.json();
        showToast(`已匯入 ${result.imported_models} 個模型`, "success");
        if (this.onComplete) this.onComplete();
        modal.remove();
      } catch (e) {
        showToast(`匯入失敗: ${e.message}`, "error");
      }
    });

    return modal;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/js/components/ImportExportModal.js
git commit -m "feat(frontend): add import/export modal"
```

---

### Task 6: UI 潤色 (Polish Pass)

**Files:**
- Update: `frontend/css/components.css`

- [ ] **Step 1: Polish CSS additions**

Add to `frontend/css/components.css`:

```css
/* Loading skeleton */
.model-card.skeleton {
  pointer-events: none;
}
.model-card.skeleton .model-card-image {
  background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-hover) 50%, var(--bg-tertiary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Focus states */
*:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Smooth transitions */
.model-card,
.btn,
.filter-btn,
.tag-chip,
.modal,
input, select, textarea {
  transition: all 0.2s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar { display: none; }
  .model-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
  .app-header { gap: 8px; padding: 0 8px; }
  .header-center { display: none; }
}

/* Empty state improvement */
.empty-state-icon {
  color: var(--text-muted);
  margin-bottom: 12px;
}

/* Detail panel styles */
.detail-label {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.detail-value { font-size: 14px; color: var(--text-primary); }
.detail-link { color: var(--accent-secondary); }
.detail-link:hover { text-decoration: underline; }

/* Search result items */
.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s;
}
.search-result-item:hover { background: var(--bg-hover); }
.search-result-item.selected { background: var(--accent-primary); color: white; }
.search-result-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
}
.search-result-name { font-size: 13px; font-weight: 500; }
.search-result-meta { font-size: 11px; color: var(--text-muted); }
.search-result-item.selected .search-result-meta { color: rgba(255,255,255,0.8); }

/* Search results container */
.search-results { display: flex; flex-direction: column; gap: 4px; }

/* Pagination max visible */
.pagination { gap: 4px; }
.pagination button { min-width: 36px; padding: 6px 8px; font-size: 13px; }
```

- [ ] **Step 2: Run end-to-end verification**

Ensure all imports/exports work correctly:
- Export produces valid JSON
- Import correctly adds models to database
- Move correctly renames/relocates files
- Blur correctly processes images

- [ ] **Step 3: Commit**

```bash
git add frontend/css/components.css
git commit -m "feat(polish): UI polish pass - skeletons, transitions, responsive"
```

---

### Task 7: 最終整合測試

- [ ] **Step 1: Run full backend test suite**

Run: `cd server && python -m pytest -v`
Expected: ALL PASS

- [ ] **Step 2: Test full user flow manually**

1. Start server: `cd server && python main.py`
2. Open http://localhost:3030
3. Scan a directory with models
4. View model cards
5. Open model detail
6. Download a new model from Civitai
7. Apply tags in batch
8. Export database
9. Import database
10. Toggle theme

- [ ] **Step 3: Final commit**

```bash
git commit -m "feat(all): complete all subsystems - final integration"
```
