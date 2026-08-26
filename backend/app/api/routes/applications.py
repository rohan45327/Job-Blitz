from datetime import datetime, timezone
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.models import User, Application, Job, ApplicationStatus
from app.schemas.schemas import (
    ApplicationCreate, ApplicationOut, ApplicationStatusUpdate
)
from app.services.matching import MatchingEngine

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("/", response_model=List[ApplicationOut])
def list_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Application)
        .filter(Application.user_id == current_user.id)
        .order_by(Application.updated_at.desc())
        .all()
    )


@router.post("/", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == payload.job_id, Job.is_active == True).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = (
        db.query(Application)
        .filter(Application.user_id == current_user.id, Application.job_id == payload.job_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Application already exists")

    engine = MatchingEngine(db)
    score, breakdown = engine.score_job(current_user, job)

    app = Application(
        user_id=current_user.id,
        job_id=payload.job_id,
        cover_letter=payload.cover_letter,
        notes=payload.notes,
        match_score=score,
        match_breakdown=breakdown,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.patch("/{application_id}/status", response_model=ApplicationOut)
def update_application_status(
    application_id: UUID,
    payload: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == current_user.id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = payload.status
    if payload.notes:
        app.notes = payload.notes
    if payload.status == ApplicationStatus.applied:
        app.applied_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(app)
    return app


@router.delete("/{application_id}", status_code=204)
def delete_application(
    application_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == current_user.id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app)
    db.commit()
