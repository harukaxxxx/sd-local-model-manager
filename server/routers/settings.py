"""Settings API router."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from server.database import init_db

router = APIRouter(prefix="/api/settings", tags=["settings"])

DEFAULT_SETTINGS = {
    "theme": "dark",
    "auto_preview": "true",
    "resize_preview": "true",
    "nsfw_blur": "false",
    "model_root_path": "",
    "default_paths": "{}",
}


class SettingResponse(BaseModel):
    key: str
    value: str | None


class SettingUpdate(BaseModel):
    value: str


async def seed_default_settings():
    """Seed default settings into database if they don't exist."""
    conn = await init_db()
    for key, value in DEFAULT_SETTINGS.items():
        cursor = await conn.execute("SELECT key FROM settings WHERE key = ?", (key,))
        row = await cursor.fetchone()
        if row is None:
            await conn.execute(
                "INSERT INTO settings (key, value) VALUES (?, ?)", (key, value)
            )
    await conn.commit()
    await conn.close()


@router.get("", response_model=list[SettingResponse])
async def list_settings():
    """List all settings."""
    conn = await init_db()
    cursor = await conn.execute("SELECT key, value FROM settings")
    rows = await cursor.fetchall()
    await conn.close()
    return [SettingResponse(key=r["key"], value=r["value"]) for r in rows]


@router.get("/{key}")
async def get_setting(key: str):
    """Get a setting by key."""
    conn = await init_db()
    cursor = await conn.execute("SELECT key, value FROM settings WHERE key = ?", (key,))
    row = await cursor.fetchone()
    await conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Setting not found")
    return {"key": row["key"], "value": row["value"]}


@router.put("/{key}")
async def set_setting(key: str, update: SettingUpdate):
    """Set a setting value."""
    conn = await init_db()
    await conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        (key, update.value),
    )
    await conn.commit()
    await conn.close()
    return {"key": key, "value": update.value}