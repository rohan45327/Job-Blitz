from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.models import User, Job
from app.schemas.schemas import CoverLetterRequest, CoverLetterResponse
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/cover-letter", response_model=CoverLetterResponse)
def generate_cover_letter(
    payload: CoverLetterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    ai = AIService()
    cover_letter = ai.generate_cover_letter(
        user=current_user,
        job=job,
        tone=payload.tone or "professional",
    )
    return CoverLetterResponse(cover_letter=cover_letter, job_id=payload.job_id)
