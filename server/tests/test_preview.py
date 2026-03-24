import pytest
from pathlib import Path
import tempfile
import io
from unittest.mock import patch


class MockHttpResponse:
    """Mock httpx response with async context manager support."""
    def __init__(self, content, status_code=200):
        self.status_code = status_code
        self._content = content

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass

    def read(self):
        return self._content


@pytest.mark.asyncio
async def test_download_preview_with_resize():
    """Test preview image download and resize."""
    dest = Path(tempfile.mktemp(suffix=".jpg"))

    # Create a minimal valid image in memory
    from PIL import Image
    img = Image.new("RGB", (1000, 1000), color="red")
    img_bytes_io = io.BytesIO()
    img.save(img_bytes_io, format="JPEG")
    img_bytes = img_bytes_io.getvalue()

    class MockClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def get(self, url):
            return MockHttpResponse(img_bytes)

    with patch("httpx.AsyncClient", return_value=MockClient()):
        from server.services.preview import download_preview_image
        result = await download_preview_image("http://example.com/preview.jpg", dest)

    assert result.exists()
    result.unlink()