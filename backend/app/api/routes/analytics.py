from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Application, ApplicationStatus
from app.schemas.schemas import OutcomeAnalyticsOut, DetailedFunnelAnalyticsOut, FunnelStageMetric

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


@router.get("/funnel/detailed", response_model=DetailedFunnelAnalyticsOut)
def get_detailed_funnel(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Returns stage-by-stage conversion rates with drop-off metrics and an insight."""
    apps = db.query(Application).filter(Application.user_id == user.id).all()

    counts = {
        "applied":           sum(1 for a in apps if a.status == ApplicationStatus.applied),
        "online_assessment": sum(1 for a in apps if a.status == ApplicationStatus.online_assessment),
        "interview":         sum(1 for a in apps if a.status == ApplicationStatus.interview),
        "offer":             sum(1 for a in apps if a.status == ApplicationStatus.offer),
    }
    total_tracked  = len(apps)
    total_applied  = counts["applied"]
    total_rejected = sum(1 for a in apps if a.status == ApplicationStatus.rejected)
    total_active   = total_tracked - total_rejected

    def pct(n: int, base: int) -> float:
        return round(n / base * 100, 1) if base > 0 else 0.0

    # Stage definitions: (stage_key, label, previous_stage_key | None)
    stage_defs = [
        ("applied",           "Applied",     None),
        ("online_assessment", "OA / Screen", "applied"),
        ("interview",         "Interview",   "online_assessment"),
        ("offer",             "Offer",       "interview"),
    ]

    stages = []
    for stage, label, prev in stage_defs:
        count = counts[stage]
        conv  = pct(count, total_applied)
        prev_count = counts[prev] if prev else total_applied
        drop  = pct(prev_count - count, prev_count) if prev_count > 0 else 0.0
        stages.append(FunnelStageMetric(
            stage=stage,
            label=label,
            count=count,
            conversion_from_applied_pct=conv,
            drop_off_pct=drop,
        ))

    offer_rate      = pct(counts["offer"],             total_applied)
    rejection_rate  = pct(total_rejected,              total_tracked)
    response_rate   = pct(counts["online_assessment"] + counts["interview"] + counts["offer"], total_applied)
    interview_rate  = pct(counts["interview"] + counts["offer"], total_applied)

    # Derive a single top insight
    if total_applied == 0:
        insight = "Start applying — save jobs from your feed and update their status here."
    elif offer_rate > 0:
        insight = f"You have a {offer_rate}% offer rate. Prioritize interview prep to convert more."
    elif interview_rate > 20:
        insight = f"Strong interview rate ({interview_rate}%). Focus on offer negotiation tactics."
    elif response_rate < 20 and total_applied >= 5:
        insight = "Response rate below 20%. Consider tailoring resumes per role using the Resume Defense tool."
    elif counts["online_assessment"] > 0 and interview_rate < 30:
        insight = f"Clearing OAs but only {interview_rate}% reach interviews. Practice system design & behavioral rounds."
    else:
        insight = "Keep applying consistently. Your pipeline data will improve as you track more applications."

    return DetailedFunnelAnalyticsOut(
        total_tracked=total_tracked,
        total_applied=total_applied,
        total_active=total_active,
        offer_rate_pct=offer_rate,
        rejection_rate_pct=rejection_rate,
        response_rate_pct=response_rate,
        interview_rate_pct=interview_rate,
        stages=stages,
        top_insight=insight,
    )

