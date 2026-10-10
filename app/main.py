import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.database import init_db
from app.seed import seed_data
from app.api.auth import router as auth_router
from app.api.tickets import router as tickets_router
from app.api.analytics import router as analytics_router
from app.api.problems import router as problems_router
from app.api.knowledge import router as knowledge_router
from app.api.ai import router as ai_router
from app.api.webhooks import router as webhooks_router
from app.api.settings import router as settings_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing TOPBOX SUPPORT OS database and seed data...")
    await init_db()
    await seed_data()
    logger.info("Application startup completed.")
    yield
    logger.info("Application shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Система аналитики качества продукта и омниканальной поддержки (Telegram + Instagram, OpenRouter AI, 5 уровней аналитики ITSM)",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(tickets_router)
app.include_router(analytics_router)
app.include_router(problems_router)
app.include_router(knowledge_router)
app.include_router(ai_router)
app.include_router(webhooks_router)
app.include_router(settings_router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "user_base": settings.TOTAL_USER_BASE
    }

# Mount static frontend if directory exists
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path == "health":
            return {"error": "Not found"}
        target_file = os.path.join(frontend_dist, full_path)
        if os.path.exists(target_file) and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
