from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
import app.models  # noqa: F401
from app.api.routes import auth, users, jobs, applications, watchlist, ai, resumes, readiness, projects, analytics

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
app.include_router(readiness.router, prefix="/api/v1")
app.include_router(readiness.prep_router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")


import threading

def auto_seed_jobs_if_empty():
    try:
        from app.core.database import SessionLocal
        from app.models.models import Job
        from app.services.fast_seed import seed_fast_jobs
        db = SessionLocal()
        count = db.query(Job).count()
        if count == 0:
            print("Database has 0 jobs. Seeding fast MNC job postings...")
            inserted = seed_fast_jobs(db)
            print(f"Fast seed completed successfully. {inserted} jobs inserted into PostgreSQL.")
        db.close()
    except Exception as e:
        print(f"Auto-seed exception: {e}")

@app.on_event("startup")
def startup_event():
    threading.Thread(target=auto_seed_jobs_if_empty, daemon=True).start()


@app.get("/")
@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
