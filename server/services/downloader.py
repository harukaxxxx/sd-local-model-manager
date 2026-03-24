"""Model file downloader with streaming."""
import httpx
import aiofiles
from pathlib import Path
from typing import Optional

CHUNK_SIZE = 1024 * 1024  # 1MB


async def download_file(
    url: str,
    dest_path: Path,
    expected_size: Optional[int] = None,
    progress_callback: Optional[callable] = None,
) -> dict:
    """
    Download a file with streaming to avoid memory overflow.
    Returns dict with total_bytes, sha256, md5.
    """
    import hashlib

    dest_path = Path(dest_path)
    dest_path.parent.mkdir(parents=True, exist_ok=True)

    sha256_hash = hashlib.sha256()
    md5_hash = hashlib.md5()
    total_bytes = 0

    async with httpx.AsyncClient(
        timeout=httpx.Timeout(300.0, connect=30.0),
        follow_redirects=True,
        headers={"User-Agent": "SD-Local-Model-Manager/1.0"},
    ) as client:
        async with client.stream("GET", url) as response:
            if response.status_code != 200:
                raise Exception(f"Download failed: HTTP {response.status_code}")

            content_length = response.headers.get("content-length")
            if content_length:
                expected_size = int(content_length)

            async with aiofiles.open(dest_path, "wb") as f:
                async for chunk in response.aiter_bytes(chunk_size=CHUNK_SIZE):
                    await f.write(chunk)
                    sha256_hash.update(chunk)
                    md5_hash.update(chunk)
                    total_bytes += len(chunk)

                    if progress_callback:
                        progress_callback(total_bytes, expected_size or 0)

    return {
        "total_bytes": total_bytes,
        "sha256": sha256_hash.hexdigest(),
        "md5": md5_hash.hexdigest(),
    }


async def download_civitai_model(
    model_id: int,
    dest_path: Path,
    version_id: Optional[int] = None,
) -> dict:
    """Download a model from Civitai by model ID and version ID."""
    version_param = f"?version={version_id}" if version_id else ""
    url = f"https://civitai.com/api/download/{model_id}{version_param}"
    return await download_file(url, dest_path)