"""Preview image download and resize."""
import httpx
import aiofiles
from pathlib import Path
from PIL import Image
import io

CHUNK_SIZE = 512 * 1024  # 512KB
THUMBNAIL_SIZE = (512, 512)


async def download_preview_image(url: str, dest_path: Path, resize: bool = True) -> Path:
    """Download preview image from URL and optionally resize."""
    dest_path = Path(dest_path)
    dest_path.parent.mkdir(parents=True, exist_ok=True)

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url)
        if response.status_code != 200:
            raise Exception(f"Failed to download preview: HTTP {response.status_code}")

        content = response.read()

    if resize:
        img = Image.open(io.BytesIO(content))
        img.thumbnail(THUMBNAIL_SIZE, Image.LANCZOS)
        img.save(dest_path)
    else:
        async with aiofiles.open(dest_path, "wb") as f:
            await f.write(content)

    return dest_path


def blur_image(image_path: Path, output_path: Path, radius: int = 15) -> Path:
    """Apply Gaussian blur to an image for NSFW masking."""
    img = Image.open(image_path)
    img = img.filter(Image.GaussianBlur(radius=radius))
    img.save(output_path)
    return output_path