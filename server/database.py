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
