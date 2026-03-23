import pytest
import tempfile
from pathlib import Path
from server.services.hash import compute_sha256, compute_md5, compute_hashes


@pytest.fixture
async def temp_file():
    """Fixture that provides a temporary file and ensures cleanup."""
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(b"hello world")
        f.flush()
        path = Path(f.name)
    yield path
    try:
        path.unlink()
    except FileNotFoundError:
        pass


@pytest.mark.asyncio
async def test_compute_sha256():
    """Test SHA256 computation."""
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(b"hello world")
        f.flush()
        path = Path(f.name)

    try:
        result = await compute_sha256(path)
        assert result == "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
    finally:
        try:
            path.unlink()
        except FileNotFoundError:
            pass


@pytest.mark.asyncio
async def test_compute_md5():
    """Test MD5 computation."""
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(b"hello world")
        f.flush()
        path = Path(f.name)

    try:
        result = await compute_md5(path)
        assert result == "5eb63bbbe01eeed093cb22bb8f5acdc3"
    finally:
        try:
            path.unlink()
        except FileNotFoundError:
            pass


@pytest.mark.asyncio
async def test_compute_hashes():
    """Test simultaneous SHA256 and MD5 computation."""
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(b"hello world")
        f.flush()
        path = Path(f.name)

    try:
        sha256, md5 = await compute_hashes(path)
        assert sha256 == "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
        assert md5 == "5eb63bbbe01eeed093cb22bb8f5acdc3"
    finally:
        try:
            path.unlink()
        except FileNotFoundError:
            pass