import pytest
import tempfile
import os
from pathlib import Path
from server.services.scanner import detect_model_type, is_model_file, scan_directory


def test_detect_model_type_from_extension():
    """Test model type detection from file extension."""
    p = Path("/models/ckpt/something.safetensors")
    assert detect_model_type(p, p.parent) == "checkpoint"

    p = Path("/models/lora/test.vae")
    assert detect_model_type(p, p.parent) == "vae"


def test_is_model_file():
    """Test model file detection."""
    assert is_model_file(Path("model.safetensors")) is True
    assert is_model_file(Path("model.ckpt")) is True
    assert is_model_file(Path("model.png")) is False
    assert is_model_file(Path("model.md")) is False


@pytest.mark.asyncio
async def test_scan_directory_finds_models():
    """Test directory scanning finds model files."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create test files
        model_path = Path(tmpdir) / "test_model.safetensors"
        model_path.write_text("dummy content")
        img_path = Path(tmpdir) / "test_model.png"
        img_path.write_text("dummy image")

        models = []
        async for model in scan_directory(Path(tmpdir)):
            models.append(model)

        assert len(models) == 1
        assert models[0]["name"] == "test_model"
        assert models[0]["model_type"] == "other"
        assert models[0]["preview_url"] is not None