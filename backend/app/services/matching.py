"""
JobBlitz Matching Engine

Scores jobs against a user profile & uploaded categorized resumes:
  - Role / Title relevance (30%)
  - Keyword & Skill overlap from resume + user search keywords (35%)
  - Experience level match (15%)
  - Work type preference (10%)
  - Salary / Location match (10%)

Final score is 0.0 → 1.0. High match threshold cutoff is >= 0.75.
"""
from __future__ import annotations
import re
from typing import Tuple, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session
from app.models.models import User, Job, Resume


class MatchingEngine:
    WEIGHTS = {
        "role": 0.25,
        "keywords_skills": 0.40,
        "experience": 0.15,
        "work_type": 0.10,
        "salary_location": 0.10,
    }

    def __init__(self, db: Session):
        self.db = db

    def score_job(self, user: User, job: Job) -> Tuple[float, dict, Optional[UUID], Optional[str], bool]:
        """
        Return (overall_score, breakdown_dict, matched_resume_id, matched_resume_category, is_high_match).
        """
        # Find best resume match if user uploaded categorized resumes
        best_resume_id = None
        best_resume_category = None
        best_keyword_score = 0.0

        user_resumes = user.resumes if user.resumes else []

        if user_resumes:
            for res in user_resumes:
                res_score = self._score_resume_keywords(res, job)
                if res_score >= best_keyword_score:
                    best_keyword_score = res_score
                    best_resume_id = res.id
                    best_resume_category = res.category
        else:
            best_keyword_score = self._score_user_skills(user, job)

        breakdown = {
            "role": self._score_role(user, job),
            "keywords_skills": best_keyword_score,
            "experience": self._score_experience(user, job),
            "work_type": self._score_work_type(user, job),
            "salary_location": self._score_salary_location(user, job),
        }

        overall = sum(breakdown[k] * self.WEIGHTS[k] for k in breakdown)
        final_score = round(overall, 4)
        is_high_match = final_score >= 0.75

        return (
            final_score,
            {k: round(v, 4) for k, v in breakdown.items()},
            best_resume_id,
            best_resume_category,
            is_high_match,
        )

    def get_feed(
        self,
        user: User,
        work_type: Optional[str] = None,
        work_types: Optional[List[str]] = None,
        experience_level: Optional[str] = None,
        salary_min: Optional[float] = None,
        location: Optional[str] = None,
        companies: Optional[List[str]] = None,
        page: int = 1,
        page_size: int = 50,
    ):
        """Return (list[MatchedJobOut], total_count) sorted by match score."""
        from app.schemas.schemas import MatchedJobOut

        query = self.db.query(Job).filter(Job.is_active == True)

        wt_list = []
        if work_types:
            wt_list.extend(work_types)
        if work_type and work_type not in wt_list:
            wt_list.append(work_type)

        if wt_list:
            from sqlalchemy import or_, cast, String
            conditions = []
            for wt in wt_list:
                wt_lower = wt.lower()
                conditions.append(cast(Job.work_type, String).ilike(f"%{wt_lower}%"))
                conditions.append(Job.title.ilike(f"%{wt_lower}%"))
                if wt_lower == "apprenticeship":
                    conditions.append(Job.title.ilike("%apprentice%"))
                elif wt_lower == "internship":
                    conditions.append(Job.title.ilike("%intern%"))
            query = query.filter(or_(*conditions))

        if experience_level:
            query = query.filter(Job.experience_level == experience_level)
        if salary_min:
            query = query.filter(Job.salary_min >= salary_min)
        if location:
            query = query.filter(Job.location.ilike(f"%{location}%"))
        if companies:
            from sqlalchemy import or_
            from app.models.models import Company
            company_filters = [Company.name.ilike(f"%{c}%") for c in companies]
            query = query.join(Job.company).filter(or_(*company_filters))

        all_jobs = query.all()
        total = len(all_jobs)

        from app.schemas.schemas import TIER_ONE_COMPANIES
        import re

        def is_top_company(job_obj) -> bool:
            name_lower = (job_obj.company.name or "").lower()
            for tier in TIER_ONE_COMPANIES:
                if re.search(rf"\b{re.escape(tier)}\b", name_lower):
                    return True
            return False

        scored = []
        for job in all_jobs:
            score, breakdown, res_id, res_cat, is_high = self.score_job(user, job)
            scored.append((score, breakdown, res_id, res_cat, is_high, job))

        # Sort by (is_top_company, match_score) descending so top matches appear first
        scored.sort(key=lambda x: (is_top_company(x[5]), x[0]), reverse=True)

        start = (page - 1) * page_size
        paginated = scored[start: start + page_size]

        from app.schemas.schemas import MatchedJobOut, JobOut, CompanyOut
        from app.services.readiness import ReadinessEngine
        from app.services.ingestion import compute_job_freshness, compute_hiring_signal
        from app.services.job_intelligence import JobIntelligenceService

        readiness_engine = ReadinessEngine(self.db)
        intel_service = JobIntelligenceService(self.db)

        result = []
        for score, breakdown, res_id, res_cat, is_high, job in paginated:
            company_out = CompanyOut.from_orm_with_tier(job.company)
            job_out = JobOut.model_validate(job)
            job_out.company = company_out
            
            readiness_val, readiness_bdown, _ = readiness_engine.compute_readiness(user, job)
            freshness_str = compute_job_freshness(job.posted_at)
            hiring_sig_str = compute_hiring_signal(job.posted_at, job.source)
            opp_score = intel_service.calculate_opportunity_score(user, job)

            result.append(
                MatchedJobOut(
                    job=job_out,
                    match_score=score,
                    match_breakdown=breakdown,
                    readiness_score=readiness_val,
                    readiness_breakdown=readiness_bdown,
                    freshness=freshness_str,
                    hiring_signal=hiring_sig_str,
                    matched_resume_id=res_id,
                    matched_resume_category=res_cat,
                    is_high_match=is_high,
                    opportunity_score=opp_score,
                )
            )
        return result, total

    def _score_resume_keywords(self, resume: Resume, job: Job) -> float:
        """
        Calculates keyword & skill match ratio between user's defined resume search keywords / content and the job description/title.
        """
        job_text = f"{job.title} {job.description or ''}".lower()
        job_words = set(re.findall(r"\b[a-zA-Z0-9+#.-]{2,}\b", job_text))
        if not job_words:
            return 0.5

        # Check defining keywords set by user for this resume
        keywords = resume.defining_keywords or []
        resume_text = f"{resume.category} {resume.title} {resume.content_text or ''}".lower()
        
        matches = 0
        total_keywords = max(len(keywords), 1)

        for kw in keywords:
            kw_clean = kw.lower().strip()
            if kw_clean in job_text or any(kw_clean in w for w in job_words):
                matches += 1

        keyword_score = matches / total_keywords if keywords else 0.5

        # Check token overlap from resume content
        resume_words = set(re.findall(r"\b[a-zA-Z0-9+#.-]{2,}\b", resume_text))
        if resume_words and job_words:
            overlap = len(resume_words & job_words)
            content_score = min(1.0, overlap / max(len(resume_words), 10))
        else:
            content_score = 0.5

        return min(1.0, (keyword_score * 0.7) + (content_score * 0.3))

    def _score_user_skills(self, user: User, job: Job) -> float:
        user_skill_ids = {s.id for s in user.skills}
        job_skill_ids = {s.id for s in job.skills}
        if not job_skill_ids:
            return 0.5
        if not user_skill_ids:
            return 0.3
        intersection = user_skill_ids & job_skill_ids
        union = user_skill_ids | job_skill_ids
        return len(intersection) / len(union)

    def _score_role(self, user: User, job: Job) -> float:
        if not user.title:
            return 0.5
        user_tokens = set(user.title.lower().split())
        job_tokens = set(job.title.lower().split())
        if not job_tokens:
            return 0.0
        overlap = user_tokens & job_tokens
        return len(overlap) / max(len(user_tokens), 1)

    def _score_experience(self, user: User, job: Job) -> float:
        if not user.experience_level or not job.experience_level:
            return 0.7
        levels = ["entry", "mid", "senior", "lead", "executive"]
        try:
            user_idx = levels.index(str(user.experience_level))
            job_idx = levels.index(str(job.experience_level))
        except ValueError:
            return 0.5
        diff = abs(user_idx - job_idx)
        return max(0.0, 1.0 - (diff * 0.35))

    def _score_work_type(self, user: User, job: Job) -> float:
        if not user.preferred_work_type or not job.work_type:
            return 0.7
        u = str(user.preferred_work_type)
        j = str(job.work_type)
        if u == j or "remote" in j.lower():
            return 1.0
        if "hybrid" in (u, j):
            return 0.6
        return 0.3

    def _score_salary_location(self, user: User, job: Job) -> float:
        salary_score = self._salary_alignment(user, job)
        location_score = self._location_match(user, job)
        return (salary_score + location_score) / 2

    def _salary_alignment(self, user: User, job: Job) -> float:
        if not user.salary_expectation_min or not job.salary_max:
            return 0.7
        if job.salary_max >= user.salary_expectation_min:
            return 1.0
        gap = user.salary_expectation_min - job.salary_max
        ratio = gap / user.salary_expectation_min
        return max(0.0, 1.0 - ratio)

    def _location_match(self, user: User, job: Job) -> float:
        if user.open_to_relocation:
            return 1.0
        if not user.location and not user.preferred_locations:
            return 0.7
        job_location = (job.location or "").lower()
        if str(job.work_type) == "remote" or "remote" in job_location:
            return 1.0
        preferred = [loc.lower() for loc in (user.preferred_locations or [])]
        if user.location:
            preferred.append(user.location.lower())
        for loc in preferred:
            if loc in job_location or job_location in loc:
                return 1.0
        return 0.4

    def get_fit_diagnostics(self, user: User, job: Job) -> dict:
        """
        Calculates multi-dimensional role fit diagnostics including
        skill fit %, experience fit %, title relevance %, strengths, risks & verdict.
        """
        final_score, breakdown, resume_id, resume_cat, is_high_match = self.score_job(user, job)

        overall_fit_score = int(round(final_score * 100))
        skills_fit_pct = int(round(breakdown.get("keywords_skills", 0.5) * 100))
        experience_fit_pct = int(round(breakdown.get("experience", 0.5) * 100))
        title_relevance_pct = int(round(breakdown.get("role", 0.5) * 100))
        work_type_location_pct = int(round(
            ((breakdown.get("work_type", 0.5) + breakdown.get("salary_location", 0.5)) / 2) * 100
        ))

        strengths = []
        risks = []

        if title_relevance_pct >= 70:
            strengths.append(f"Strong role title alignment with target {job.title}")
        elif title_relevance_pct < 40:
            risks.append(f"Role title '{job.title}' diverges from past experience keywords")

        if skills_fit_pct >= 75:
            if resume_cat:
                strengths.append(f"High skill overlap using your '{resume_cat.upper()}' resume profile")
            else:
                strengths.append("Strong technical skill overlap with job description requirements")
        else:
            risks.append("Skill coverage is below target benchmark (recommend adding missing keywords)")

        if experience_fit_pct >= 75:
            strengths.append("Target experience level matches your profile tier")
        elif experience_fit_pct < 50:
            risks.append("Job experience requirement may be higher than profile baseline")

        if work_type_location_pct >= 75:
            strengths.append("Favorable work arrangement (Remote/Hybrid preference met)")
        else:
            risks.append("Work type or location arrangement requires potential relocation or commute")

        if overall_fit_score >= 80:
            verdict = f"Top-tier match ({overall_fit_score}%). High confidence for interview callback."
        elif overall_fit_score >= 60:
            verdict = f"Moderate match ({overall_fit_score}%). Good fit with minor skill/keyword optimization recommended."
        else:
            verdict = f"Selective fit ({overall_fit_score}%). Requires targeted resume customization before applying."

        company_name = job.company.name if job.company else (job.company_name or "")

        return {
            "job_id": job.id,
            "role_title": job.title or "Role",
            "company_name": company_name,
            "overall_fit_score": overall_fit_score,
            "skills_fit_pct": skills_fit_pct,
            "experience_fit_pct": experience_fit_pct,
            "title_relevance_pct": title_relevance_pct,
            "work_type_location_pct": work_type_location_pct,
            "matching_strengths": strengths or ["Basic candidate eligibility met"],
            "risk_factors": risks or ["No major risk factors detected"],
            "executive_verdict": verdict,
        }
