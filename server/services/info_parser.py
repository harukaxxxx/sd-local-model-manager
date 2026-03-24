"""Parser for .info and .civitai.info files."""
import json
import re
from pathlib import Path
from typing import Optional


def parse_civitai_info(file_path: Path) -> dict:
    """Parse .civitai.info JSON file."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {
            "name": data.get("name", file_path.stem),
            "description": data.get("description", ""),
            "civitai_id": data.get("civitaiId"),
            "civitai_url": data.get("civitaiUrl"),
            "preview_url": data.get("preview", {}).get("url") if isinstance(data.get("preview"), dict) else data.get("preview"),
            "tags": data.get("tags", []),
            "nsfw": data.get("nsfw", False),
            "version": data.get("version"),
        }
    except (json.JSONDecodeError, IOError) as e:
        raise ValueError(f"Failed to parse {file_path}: {e}")


def parse_md_info(file_path: Path) -> dict:
    """Parse .md file for model description (stable diffusion webui format)."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        description = content.strip()

        # Try to extract prompt sections
        positive_prompt = None
        negative_prompt = None

        pos_match = re.search(r"\*\*Positive prompt:\*\*\s*\n(.*?)(?=\n\*\*|$)", content, re.DOTALL | re.IGNORECASE)
        neg_match = re.search(r"\*\*Negative prompt:\*\*\s*\n(.*?)(?=\n\*\*|$)", content, re.DOTALL | re.IGNORECASE)

        if pos_match:
            positive_prompt = pos_match.group(1).strip()
        if neg_match:
            negative_prompt = neg_match.group(1).strip()

        return {
            "name": file_path.stem,
            "description": description,
            "positive_prompt": positive_prompt,
            "negative_prompt": negative_prompt,
        }
    except IOError as e:
        raise ValueError(f"Failed to read {file_path}: {e}")


def parse_info_file(file_path: Path) -> dict:
    """Auto-detect and parse info file."""
    file_path = Path(file_path)
    if file_path.suffix == ".civitai.info":
        return parse_civitai_info(file_path)
    elif file_path.suffix == ".info":
        return parse_civitai_info(file_path)
    elif file_path.suffix == ".md":
        return parse_md_info(file_path)
    else:
        raise ValueError(f"Unsupported info file type: {file_path.suffix}")