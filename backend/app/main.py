from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
import app.models  # noqa: F401
from app.api.routes import auth, users, jobs, applications, watchlist, ai, resumes

# Create database tables if they do not exist (safely catch pre-existing Postgres enum type errors)
try:
    Base.metadata.create_all(bind=engine)
except Exception as err:
    print(f"Database schema initialization notice: {err}")

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered job discovery and application assistant",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(applications.router, prefix="/api/v1")
app.include_router(watchlist.router, prefix="/api/v1")
app.include_router(watchlist.push_router, prefix="/api/v1")
app.include_router(resumes.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")


@app.get("/")
@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
