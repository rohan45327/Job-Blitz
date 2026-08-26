from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.models import User, Job, Application, ApplicationStatus
from app.schemas.schemas import JobFeedResponse, JobDetailOut, MatchedJobOut, JobOut
from app.services.matching import MatchingEngine

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/feed", response_model=JobFeedResponse)
def get_job_feed(
    work_type: Optional[str] = Query(None),
    work_types: Optional[List[str]] = Query(None),
    experience_level: Optional[str] = Query(None),
    salary_min: Optional[float] = Query(None),
    location: Optional[str] = Query(None),
    companies: Optional[List[str]] = Query(None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    engine = MatchingEngine(db)
    matched, total = engine.get_feed(
        user=current_user,
        work_type=work_type,
        work_types=work_types if work_types else None,
        experience_level=experience_level,
        salary_min=salary_min,
        location=location,
        companies=companies if companies else None,
        page=page,
        page_size=page_size,
    )
    total_pages = max(1, (total + page_size - 1) // page_size)
    return JobFeedResponse(items=matched, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.post("/ingest")
def trigger_ingestion(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trigger background job ingestion from ATS boards & job sources."""
    import threading
    from app.worker.tasks import run_ingestion
    
    def run_async():
        try:
            run_ingestion()
        except Exception as e:
            print(f"Ingestion error: {e}")

    threading.Thread(target=run_async, daemon=True).start()
    return {"message": "Job ingestion started in background", "status": "processing"}


@router.get("/{job_id}", response_model=JobDetailOut)
def get_job_detail(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id, Job.is_active == True).first()
    if not job:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Job not found")
    return job
