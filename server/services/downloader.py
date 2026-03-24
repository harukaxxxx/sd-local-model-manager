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


async def download_gdrive(gdrive_url: str, dest_path: Path) -> dict:
    """Download from Google Drive sharing link using streaming."""
    import re
    import hashlib

    # Extract file ID from GDrive URL
    # https://drive.google.com/file/d/FILE_ID/view -> FILE_ID
    match = re.search(r"/d/([a-zA-Z0-9_-]+)", gdrive_url)
    if not match:
        raise ValueError("Invalid Google Drive URL")

    file_id = match.group(1)
    download_url = f"https://drive.google.com/uc?export=download&id={file_id}"

    sha256_hash = hashlib.sha256()
    md5_hash = hashlib.md5()
    total_bytes = 0

    async with httpx.AsyncClient(timeout=300.0, follow_redirects=True) as client:
        response = await client.get(download_url)
        # GDrive shows confirmation page for large files
        if "confirm" in response.text:
            # Parse confirm token from the confirmation page
            match = re.search(r"name=\"download\" href=\"(.*?)\"", response.text)
            if match:
                download_url = "https://drive.google.com" + match.group(1)
                response = await client.get(download_url)

        # Stream the file to avoid memory overflow
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(dest_path, "wb") as f:
            async for chunk in response.aiter_bytes(chunk_size=CHUNK_SIZE):
                await f.write(chunk)
                sha256_hash.update(chunk)
                md5_hash.update(chunk)
                total_bytes += len(chunk)

    return {
        "total_bytes": total_bytes,
        "sha256": sha256_hash.hexdigest(),
        "md5": md5_hash.hexdigest(),
    }