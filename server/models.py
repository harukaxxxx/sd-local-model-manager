"""Pydantic models for request/response validation."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ModelBase(BaseModel):
    name: str
    file_path: str
    file_size: Optional[int] = None
    model_type: Optional[str] = None
    civitai_id: Optional[int] = None
    civitai_url: Optional[str] = None
    preview_url: Optional[str] = None
    description: Optional[str] = None
    nsfw: bool = False


class ModelCreate(ModelBase):
    pass


class ModelUpdate(BaseModel):
    name: Optional[str] = None
    file_path: Optional[str] = None
    model_type: Optional[str] = None
    civitai_url: Optional[str] = None
    preview_url: Optional[str] = None
    description: Optional[str] = None
    nsfw: Optional[bool] = None


class ModelResponse(ModelBase):
    id: str
    sha256: Optional[str] = None
    md5: Optional[str] = None
    created_at: Optional[int] = None
    updated_at: Optional[int] = None

    class Config:
        from_attributes = True


class ModelListResponse(BaseModel):
    items: list[ModelResponse]
    total: int
    page: int
    page_size: int


class ScanRequest(BaseModel):
    directory: str = Field(..., description="Directory path to scan for models")
    recursive: bool = True


class ScanResponse(BaseModel):
    scanned: int
    added: int
    errors: list[str] = []
