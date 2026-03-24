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