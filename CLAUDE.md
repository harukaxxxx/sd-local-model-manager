# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stable Diffusion Local Model Manager - a web-based tool for managing Stable Diffusion model files on localhost.

**Tech Stack:**
- Backend: Python + FastAPI (handles file operations, Civitai API proxy, static file serving)
- Frontend: Pure HTML/CSS/JS (no framework)
- Database: SQLite (`metadata.db` in project root)

**Key Constraint:** Frontend is served at `/app` path (not root) to avoid conflicts with API routes at `/api/*`.

## Common Commands

### Environment Setup (Conda)
```bash
# Create environment from project root
conda env create -f environment.yml

# Activate environment
conda activate sd-local-model-manager

# Deactivate when done
conda deactivate
```

### Backend Development
```bash
# Run server
cd server && python main.py

# Run tests (ensure environment is activated)
python -m pytest server/tests -v

# Run single test file
python -m pytest server/tests/test_hash.py -v
```

### Dependencies
All dependencies are specified in `environment.yml`. Key packages:
- `fastapi`, `uvicorn` - Web framework
- `aiosqlite`, `aiofiles` - Async database/file operations
- `pytest`, `pytest-asyncio` - Testing
- `httpx` - HTTP client for API calls
- `Pillow` - Image processing (preview resize, blur)
- `python-multipart` - File upload support

## Architecture

### Backend Structure (`server/`)
- `main.py` - FastAPI app entry point, mounts frontend at `/app`
- `routers/` - API endpoints (models, tags, civitai, import_export)
- `services/` - Business logic (scanner, hasher, downloader, preview, info_parser)
- `database.py` - SQLite connection management
- `models.py` - Pydantic models for request/response validation

### Frontend Structure (`frontend/`)
- `js/api.js` - API service layer
- `js/components/` - UI components (ModelCard, ModelGrid, ModelDetail, etc.)
- `js/main.js` - App initialization and event handlers
- `css/` - Style system with CSS variables for theming

### API Routes
- `GET/POST /api/models` - List/scan models
- `POST /api/models/move` - Move model files
- `POST /api/models/rename` - Rename model
- `GET/POST /api/tags` - Tag management
- `GET/POST /api/civitai/*` - Civitai proxy (search, download, hash lookup)
- `POST /api/import/*` - Import/export (JSON, .info files, bind-file)
- `POST /api/import/blur` - NSFW image blur

### Database Schema
- `models` - id, name, file_path, file_size, sha256, md5, model_type, civitai_id, preview_url, description, nsfw, timestamps
- `tags` - id, name
- `model_tags` - model_id, tag_id (junction table)
- `settings` - key, value (theme, paths, etc.)

## Development Notes

- Frontend is served at `/app` (StaticFiles mounted there to avoid route conflicts)
- Backend runs on `http://localhost:3030` by default
- Use `PYTHONPATH=.` when running pytest from worktree root to resolve imports
- Async fixtures in pytest must use `@pytest_asyncio.fixture` decorator (not bare `@pytest.fixture`)
- Hash computation uses streaming to handle large files without memory overflow
- Civitai API proxy solves CORS restrictions for external downloads

## Git Worktrees

When working on features, use worktrees to isolate changes:
```bash
git worktree add .worktrees/feature-name -b feature/feature-name
```
Remember to add `.worktrees/` to `.gitignore` before creating.
