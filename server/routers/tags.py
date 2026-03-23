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
    if not name or not name.strip():
        raise HTTPException(status_code=400, detail="Tag name cannot be empty")
    if len(name) > 50:
        raise HTTPException(status_code=400, detail="Tag name too long (max 50 chars)")
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
    # Verify all tag_ids exist
    placeholders = ','.join('?' * len(update.tag_ids)) if update.tag_ids else ''
    cursor = await conn.execute(f"SELECT id FROM tags WHERE id IN ({placeholders})", update.tag_ids)
    valid_ids = {row[0] for row in await cursor.fetchall()}
    invalid_ids = set(update.tag_ids) - valid_ids
    if invalid_ids:
        await conn.close()
        raise HTTPException(status_code=400, detail=f"Invalid tag IDs: {invalid_ids}")

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