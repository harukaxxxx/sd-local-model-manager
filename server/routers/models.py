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