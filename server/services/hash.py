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