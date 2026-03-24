import pytest
from pathlib import Path
import tempfile
import os
from unittest.mock import patch


class MockStreamResponse:
    """Mock streaming response for httpx."""
    def __init__(self, content, status_code=200, content_length=None):
        self.status_code = status_code
        self._content = content
        self.headers = {"content-length": str(content_length)} if content_length else {}

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass

    async def aiter_bytes(self, chunk_size=None):
        yield self._content


@pytest.mark.asyncio
async def test_download_file_with_mock():
    """Test download_file with mocked response."""
    dest = Path(tempfile.mktemp(suffix=".bin"))

    content = b"hello world"

    class MockClient:
        """Mock httpx.AsyncClient that returns a streaming response."""
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        def stream(self, method, url):
            return MockStreamResponse(content, content_length=len(content))

    with patch("httpx.AsyncClient", return_value=MockClient()):
        from server.services.downloader import download_file
        result = await download_file("http://example.com/file.bin", dest)

    assert result["total_bytes"] == 11
    assert len(result["sha256"]) == 64
    assert len(result["md5"]) == 32
    os.unlink(dest)