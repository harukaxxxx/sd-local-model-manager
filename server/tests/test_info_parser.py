import pytest
import tempfile
import json
from pathlib import Path
from server.services.info_parser import (
    parse_civitai_info,
    parse_md_info,
    parse_info_file,
)


def test_parse_civitai_info():
    """Test parsing .civitai.info JSON."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".civitai.info", delete=False, encoding="utf-8"
    ) as f:
        json.dump({
            "name": "Test Model",
            "description": "A test model",
            "civitaiId": 12345,
            "nsfw": False,
        }, f)
        path = Path(f.name)

    result = parse_civitai_info(path)
    assert result["name"] == "Test Model"
    assert result["civitai_id"] == 12345
    path.unlink()


def test_parse_md_info():
    """Test parsing .md description file."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".md", delete=False, encoding="utf-8"
    ) as f:
        f.write("**Positive prompt:**\nmasterpiece, best quality\n**Negative prompt:**\nworst quality")
        path = Path(f.name)

    result = parse_md_info(path)
    assert "masterpiece" in result["positive_prompt"]
    assert "worst quality" in result["negative_prompt"]
    path.unlink()


def test_parse_info_file_auto_detect():
    """Test auto-detection of info file type."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".info", delete=False, encoding="utf-8"
    ) as f:
        json.dump({"name": "Auto Detect"}, f)
        path = Path(f.name)

    result = parse_info_file(path)
    assert result["name"] == "Auto Detect"
    path.unlink()