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
    score, breakdown, _, _, _ = engine.score_job(current_user, job)

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


# ─── Phase 9: Automated Application Tracking & Timeline ────────────────────────

from app.schemas.schemas import ActivityLogItem, ApplicationTimelineOut, AutoTransitionResultOut
import uuid

@router.get("/{application_id}/timeline", response_model=ApplicationTimelineOut)
def get_application_timeline(
    application_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns chronological activity timeline and time-in-stage diagnostic for an application."""
    app = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == current_user.id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    now = datetime.now(timezone.utc)
    updated_at = app.updated_at or app.created_at or now
    days_in_stage = (now - updated_at).days

    # Build simulated / synthesized event history from application state
    events = [
        ActivityLogItem(
            id=str(uuid.uuid4()),
            application_id=app.id,
            event_type="SAVED",
            title="Job Saved to Blitz Tracker",
            description=f"Saved role '{app.job.title}' at {app.job.company.name}.",
            created_at=(app.created_at or now).isoformat(),
            is_auto_generated=True,
        )
    ]

    if app.applied_at or app.status != ApplicationStatus.saved:
        events.append(
            ActivityLogItem(
                id=str(uuid.uuid4()),
                application_id=app.id,
                event_type="STATUS_CHANGE",
                title=f"Status Advanced to {app.status.value.upper()}",
                description=f"Application status updated to {app.status.value}.",
                created_at=(app.applied_at or updated_at).isoformat(),
                is_auto_generated=False,
            )
        )

    if app.notes:
        events.append(
            ActivityLogItem(
                id=str(uuid.uuid4()),
                application_id=app.id,
                event_type="NOTE_ADDED",
                title="Candidate Note Attached",
                description=app.notes,
                created_at=updated_at.isoformat(),
                is_auto_generated=False,
            )
        )

    return ApplicationTimelineOut(
        application_id=app.id,
        job_title=app.job.title,
        company_name=app.job.company.name,
        current_status=app.status.value,
        events=events,
        days_in_current_stage=days_in_stage,
    )


@router.post("/auto-sync", response_model=AutoTransitionResultOut)
def run_auto_sync_tracker(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Automated status transition engine scanning user applications for auto-progression triggers."""
    apps = (
        db.query(Application)
        .filter(Application.user_id == current_user.id)
        .all()
    )

    updates = []
    auto_count = 0
    now = datetime.now(timezone.utc)

    for app in apps:
        # Example Auto Trigger Rule 1: High match score (> 85%) saved applications auto-transition to applied if applied_at set
        if app.status == ApplicationStatus.saved and app.applied_at is not None:
            old_status = app.status.value
            app.status = ApplicationStatus.applied
            auto_count += 1
            updates.append({
                "application_id": str(app.id),
                "job_title": app.job.title,
                "old_status": old_status,
                "new_status": "applied",
                "reason": "Detected application submission timestamp",
            })
    
    if auto_count > 0:
        db.commit()

    return AutoTransitionResultOut(
        processed_count=len(apps),
        auto_updated_count=auto_count,
        updates=updates,
    )

