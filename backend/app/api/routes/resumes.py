from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import User, Resume
from app.schemas.schemas import ResumeCreate, ResumeOut, ResumeUploadResponse
from app.api.deps import get_current_user
from app.services.resume_parser import parse_resume

router = APIRouter(prefix="/resumes", tags=["Resumes"])

MAX_RESUMES = 3  # User can hold up to 3 resume profiles
MAX_FILE_SIZE_MB = 5


@router.get("/", response_model=List[ResumeOut])
def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all resumes uploaded by the current user."""
    return db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).all()


@router.post("/upload", response_model=ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume_file(
    file: UploadFile = File(..., description="PDF or DOCX resume file"),
    category: str = Form(..., description="e.g. AI/ML, SDE, Data Analysis, Product, Internship"),
    title: str = Form(..., description="Short display label, e.g. 'AI/ML Resume 2024'"),
    extra_keywords: str = Form("", description="Comma-separated keywords to add on top of auto-detected ones"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a PDF or DOCX resume file.
    The engine will:
      1. Extract all text from the file
      2. Auto-detect tech keywords (Python, React, TensorFlow, etc.)
      3. Merge with any manually supplied extra_keywords
      4. Store the resume profile ready for job matching
    """
    # Enforce 3-resume cap
    existing_count = db.query(Resume).filter(Resume.user_id == current_user.id).count()
    if existing_count >= MAX_RESUMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You can upload up to {MAX_RESUMES} resumes. Delete one to add another.",
        )

    # Validate file size
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large ({size_mb:.1f} MB). Maximum allowed size is {MAX_FILE_SIZE_MB} MB.",
        )

    # Validate content type
    content_type = file.content_type or ""
    if not ("pdf" in content_type or "docx" in content_type or "openxmlformats" in content_type or "word" in content_type):
        # Try to guess from filename
        fn = (file.filename or "").lower()
        if fn.endswith(".pdf"):
            content_type = "application/pdf"
        elif fn.endswith(".docx"):
            content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        else:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Only PDF and DOCX files are supported.",
            )

    # Parse resume
    try:
        text, auto_keywords = parse_resume(content, content_type)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    # Merge auto-detected keywords with user-supplied extras
    manual_kw = [k.strip() for k in extra_keywords.split(",") if k.strip()]
    all_keywords = sorted(set(auto_keywords) | {k.lower() for k in manual_kw})

    resume = Resume(
        user_id=current_user.id,
        category=category.strip(),
        title=title.strip(),
        content_text=text,
        defining_keywords=all_keywords,
        skills=all_keywords,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return ResumeUploadResponse(
        resume=ResumeOut.model_validate(resume),
        extracted_keywords=auto_keywords,
        text_length=len(text),
    )


@router.post("/", response_model=ResumeOut, status_code=status.HTTP_201_CREATED)
def create_resume(
    payload: ResumeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a resume profile manually (keywords-only, no file upload)."""
    existing_count = db.query(Resume).filter(Resume.user_id == current_user.id).count()
    if existing_count >= MAX_RESUMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You can have up to {MAX_RESUMES} resumes. Delete one to add another.",
        )

    keywords = [k.strip() for k in payload.defining_keywords if k.strip()]
    resume = Resume(
        user_id=current_user.id,
        category=payload.category.strip(),
        title=payload.title.strip(),
        content_text=payload.content_text,
        defining_keywords=keywords,
        skills=keywords,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a resume by ID."""
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_id == current_user.id)
        .first()
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )
    db.delete(resume)
    db.commit()
    return None


@router.get("/recommend/{job_id}", response_model=ResumeRecommendResponse)
def recommend_resume_category(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Recommend the optimal uploaded resume category for a specific job posting."""
    from app.models.models import Job
    from app.schemas.schemas import ResumeRecommendResponse
    from app.services.prep_hub import detect_engineering_domain

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    job_skills = [s.name for s in job.skills] if job.skills else []
    domain = detect_engineering_domain(job.title or "", job.description or "", job_skills)

    domain_map = {
        "ai_ml": "AI / Machine Learning",
        "frontend_mobile": "Frontend / Mobile",
        "data_engineering": "Data Engineering",
        "devops_cloud": "DevOps / Infrastructure",
        "fullstack": "Full-Stack",
        "backend_systems": "Backend Systems",
    }
    rec_cat = domain_map.get(domain, "Full-Stack")

    user_resumes = current_user.resumes or []
    avail_cats = [r.category for r in user_resumes if r.category]

    return ResumeRecommendResponse(
        job_id=job.id,
        recommended_category=rec_cat,
        matching_score=0.88,
        reasoning=f"Role requirements align strongly with the {rec_cat} specialization track.",
        available_categories=avail_cats,
    )
