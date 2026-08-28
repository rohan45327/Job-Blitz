from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.routes.auth import get_current_user
from app.models.models import User, Application, ApplicationStatus
from app.schemas.schemas import OutcomeAnalyticsOut

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/funnel", response_model=OutcomeAnalyticsOut)
def get_funnel_analytics(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    apps = db.query(Application).filter(Application.user_id == user.id).all()

    total_saved = sum(1 for a in apps if a.status == ApplicationStatus.saved)
    total_applied = sum(1 for a in apps if a.status == ApplicationStatus.applied)
    total_oa = sum(1 for a in apps if a.status == ApplicationStatus.online_assessment)
    total_interviews = sum(1 for a in apps if a.status == ApplicationStatus.interview)
    total_offers = sum(1 for a in apps if a.status == ApplicationStatus.offer)
    total_rejections = sum(1 for a in apps if a.status == ApplicationStatus.rejected)

    total_active = len(apps)
    response_rate = round((total_oa + total_interviews + total_offers) / max(1, total_applied) * 100, 1) if total_applied > 0 else 0.0
    interview_rate = round((total_interviews + total_offers) / max(1, total_applied) * 100, 1) if total_applied > 0 else 0.0

    return OutcomeAnalyticsOut(
        total_saved=total_saved,
        total_applied=total_applied,
        total_oa=total_oa,
        total_interviews=total_interviews,
        total_offers=total_offers,
        total_rejections=total_rejections,
        response_rate_percent=response_rate,
        interview_rate_percent=interview_rate,
    )
