import pytest
import pytest_asyncio
import tempfile
from pathlib import Path

from server.database import init_db


@pytest_asyncio.fixture
async def temp_db():
    """Create a temporary database for testing."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = Path(f.name)
    conn = await init_db(db_path)
    yield conn
    await conn.close()
    db_path.unlink()


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
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = Path(f.name)
    conn = await init_db(db_path)
    assert conn is not None
    await conn.close()
    db_path.unlink()


@pytest.mark.asyncio
async def test_models_table_schema(temp_db):
    """Verify models table has required columns."""
    cursor = await temp_db.execute("PRAGMA table_info(models)")
    columns = {row["name"] for row in await cursor.fetchall()}
    required_columns = {
        "id", "name", "file_path", "file_size", "sha256", "md5",
        "model_type", "civitai_id", "civitai_url", "preview_url",
        "description", "nsfw", "created_at", "updated_at"
    }
    assert required_columns.issubset(columns)


@pytest.mark.asyncio
async def test_tags_table_schema(temp_db):
    """Verify tags table has required columns."""
    cursor = await temp_db.execute("PRAGMA table_info(tags)")
    columns = {row["name"] for row in await cursor.fetchall()}
    assert "id" in columns
    assert "name" in columns


@pytest.mark.asyncio
async def test_model_tags_table_schema(temp_db):
    """Verify model_tags table exists with correct structure."""
    cursor = await temp_db.execute("PRAGMA table_info(model_tags)")
    columns = {row["name"] for row in await cursor.fetchall()}
    assert "model_id" in columns
    assert "tag_id" in columns


@pytest.mark.asyncio
async def test_indexes_exist(temp_db):
    """Verify indexes are created."""
    cursor = await temp_db.execute(
        "SELECT name FROM sqlite_master WHERE type='index'"
    )
    indexes = {row["name"] for row in await cursor.fetchall()}
    assert "idx_models_model_type" in indexes
    assert "idx_models_file_path" in indexes
