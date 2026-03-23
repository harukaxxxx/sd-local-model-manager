"""Pytest configuration and shared fixtures."""
import pytest
import asyncio
import os
import tempfile
from pathlib import Path

pytest_plugins = ("pytest_asyncio",)


@pytest.fixture(scope="function")
async def clean_db():
    """Create an isolated temporary database for each test.

    This fixture:
    - Creates a temp .db file
    - Overrides DATABASE_PATH at runtime
    - Initializes the schema
    - Yields the connection
    - Cleans up the temp file after the test
    """
    import server.database as db_module

    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = Path(f.name)

    # Override the module-level DATABASE_PATH
    original_path = db_module.DATABASE_PATH
    db_module.DATABASE_PATH = db_path

    # Initialize database with schema
    conn = await db_module.init_db(db_path)

    yield conn

    # Cleanup
    await conn.close()
    try:
        os.unlink(db_path)
    except OSError:
        pass

    # Restore original path
    db_module.DATABASE_PATH = original_path
