from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.routes.auth import get_current_user
from app.models.models import User, Job, Project
from app.schemas.schemas import (
    ReadinessOut, CompanyIntelligenceOut, CandidateBenchmarkOut,
    PreparationPlanOut, ResumeDefenseRequest, ResumeDefenseResponse,
    CompanyBriefOut
)
from app.services.readiness import ReadinessEngine
from app.services.company_intelligence import CompanyIntelligenceService
from app.services.prep_hub import PrepHubEngine

router = APIRouter(prefix="/readiness", tags=["readiness"])
prep_router = APIRouter(prefix="/prep", tags=["prep"])


@router.get("/jobs/{job_id}", response_model=ReadinessOut)
def get_job_readiness(
    job_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    engine = ReadinessEngine(db)
    overall, breakdown, improvements = engine.compute_readiness(user, job)

    return ReadinessOut(
        job_id=job.id,
        overall_readiness=overall,
        breakdown=breakdown,
        top_improvements=improvements,
    )


@router.get("/jobs/{job_id}/company-intelligence", response_model=CompanyIntelligenceOut)
def get_company_intelligence(
    job_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job or not job.company:
        raise HTTPException(status_code=404, detail="Job or company not found")

    service = CompanyIntelligenceService(db)
    data = service.get_company_intelligence(job.company, job)

    return CompanyIntelligenceOut(**data)


@router.get("/jobs/{job_id}/candidate-benchmark", response_model=CandidateBenchmarkOut)
def get_candidate_benchmark(
    job_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    service = CompanyIntelligenceService(db)
    data = service.get_candidate_benchmark(user, job)

    return CandidateBenchmarkOut(**data)


@prep_router.get("/plan/{job_id}", response_model=PreparationPlanOut)
def get_prep_plan(
    job_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    readiness_engine = ReadinessEngine(db)
    overall, _, _ = readiness_engine.compute_readiness(user, job)

    prep_engine = PrepHubEngine(db)
    plan_data = prep_engine.generate_prep_plan(user, job, overall)

    return PreparationPlanOut(**plan_data)


@prep_router.post("/resume-defense", response_model=ResumeDefenseResponse)
def get_resume_defense(
    payload: ResumeDefenseRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    project = None
    if payload.project_id:
        project = db.query(Project).filter(Project.id == payload.project_id, Project.user_id == user.id).first()

    prep_engine = PrepHubEngine(db)
    defense_data = prep_engine.generate_resume_defense(user, job, project)

    return ResumeDefenseResponse(**defense_data)


@prep_router.get("/company-brief/{job_id}", response_model=CompanyBriefOut)
def get_company_brief(
    job_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    prep_engine = PrepHubEngine(db)
    brief_data = prep_engine.generate_company_brief(job)

    return CompanyBriefOut(**brief_data)
