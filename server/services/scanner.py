"""Directory scanner for detecting model files."""
import os
from pathlib import Path
from typing import AsyncIterator
import asyncio

MODEL_EXTENSIONS = {
    ".ckpt", ".safetensors", ".pt", ".pth",  # Checkpoint
    ".vae", ".pt", ".pth",                     # VAE
    ".safetensors", ".pt", ".pth", ".bin",    # LoRA
    ".pt", ".pth",                             # Hypernet
    ".pt", ".pth", ".bin",                     # Embedding
}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
INFO_EXTENSIONS = {".md", ".civitai.info", ".info"}

# Known base directories for model types
MODEL_TYPE_DIRS = {
    "checkpoint": ["ckpt", "checkpoints", "stable-diffusion", "sd"],
    "vae": ["vae", "vae models"],
    "lora": ["lora", "loras", "lycoris"],
    "hypernet": ["hypernet", "hypernets"],
    "embedding": ["embedding", "embeddings", "textual_inversion"],
}


def detect_model_type(file_path: Path, parent_dir: Path) -> str:
    """Detect model type from file extension or parent directory name."""
    ext = file_path.suffix.lower()

    # Check unambiguous extensions first (.vae is VAE-specific)
    if ext == ".vae":
        return "vae"

    # Check parent directory for context
    parent_name = parent_dir.name.lower()

    # For checkpoint files, only return checkpoint if parent dir matches
    if ext in {".ckpt", ".safetensors"}:
        if parent_name in MODEL_TYPE_DIRS["checkpoint"]:
            return "checkpoint"
        # .safetensors is ambiguous (also used for LoRA), so return "other" if parent doesn't match
        if ext == ".safetensors":
            return "other"
        return "checkpoint"

    # Handle ambiguous extensions (.pt, .pth, .bin)
    if ext in {".pt", ".pth", ".bin"}:
        if "lora" in parent_name or "lycoris" in parent_name:
            return "lora"
        if "embedding" in parent_name or "textual_inversion" in parent_name:
            return "embedding"
        if "hypernet" in parent_name:
            return "hypernet"
        return "other"

    return "other"


def is_model_file(path: Path) -> bool:
    """Check if file is a model file."""
    return path.suffix.lower() in MODEL_EXTENSIONS


async def scan_directory(
    root_path: Path, recursive: bool = True
) -> AsyncIterator[dict]:
    """Scan directory for model files and yield model metadata."""
    root_path = Path(root_path)
    if not root_path.exists():
        return

    pattern = "**/*" if recursive else "*"

    async for entry in _scan_dir_iter(root_path, pattern):
        if is_model_file(entry):
            stat = os.stat(entry)
            model_type = detect_model_type(entry, entry.parent)

            # Check for companion files
            preview_path = None
            for img_ext in IMAGE_EXTENSIONS:
                candidate = entry.with_suffix(img_ext)
                if candidate.exists():
                    preview_path = str(candidate)
                    break

            description_path = None
            for info_ext in INFO_EXTENSIONS:
                candidate = entry.with_suffix(info_ext)
                if candidate.exists():
                    description_path = str(candidate)
                    break

            yield {
                "file_path": str(entry),
                "name": entry.stem,
                "file_size": stat.st_size,
                "model_type": model_type,
                "preview_url": preview_path,
                "description": None,
                "sha256": None,
                "md5": None,
                "civitai_id": None,
                "civitai_url": None,
                "nsfw": 0,
                "created_at": int(stat.st_ctime),
                "updated_at": int(stat.st_mtime),
            }


async def _scan_dir_iter(root: Path, pattern: str) -> AsyncIterator[Path]:
    """Async iterator over directory entries."""

    def _walk():
        for entry in root.glob(pattern):
            if entry.is_file():
                yield entry

    loop = asyncio.get_event_loop()
    for item in await loop.run_in_executor(None, lambda: list(root.glob(pattern))):
        if item.is_file():
            yield item