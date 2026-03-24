"""FastAPI application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from server.routers import civitai, models, tags, import_export, settings
from server.routers.settings import seed_default_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed default settings
    await seed_default_settings()
    yield
    # Shutdown: cleanup if needed


app = FastAPI(title="SD Local Model Manager API", version="0.1.0", lifespan=lifespan)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3030", "http://127.0.0.1:3030"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (frontend) at /app to avoid conflicting with API routes
frontend_path = Path(__file__).parent.parent / "frontend"
if frontend_path.exists():
    app.mount("/app", StaticFiles(directory=str(frontend_path), html=True), name="frontend")

app.include_router(models.router)
app.include_router(tags.router)
app.include_router(civitai.router)
app.include_router(import_export.router)
app.include_router(settings.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    print(f"Frontend: http://localhost:3030/app")
    print(f"API:      http://localhost:3030/api")
    uvicorn.run(app, host="127.0.0.1", port=3030)