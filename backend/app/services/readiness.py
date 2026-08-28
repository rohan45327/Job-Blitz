"""
JobBlitz Readiness Engine

Calculates an 8-dimensional Readiness Score (0.0 to 1.0) distinct from Match Score.
Match Score: "How well does the job fit the candidate?"
Readiness Score: "How prepared is the candidate to compete for & pass interviews for this specific job right now?"
"""
from __future__ import annotations
from typing import Tuple, List, Dict
from sqlalchemy.orm import Session

from app.models.models import User, Job, Project


class ReadinessEngine:
    WEIGHTS = {
        "resume_alignment": 0.20,
        "skills_coverage": 0.25,
        "experience_evidence": 0.15,
        "application_completeness": 0.10,
        "technical_interview": 0.15,
        "behavioral_prep": 0.05,
        "company_knowledge": 0.05,
        "oa_readiness": 0.05,
    }

    def __init__(self, db: Session):
        self.db = db

    def compute_readiness(self, user: User, job: Job) -> Tuple[float, Dict[str, float], List[str]]:
        user_skills = {s.name.lower() for s in user.skills} if user.skills else set()
        user_resumes = user.resumes if user.resumes else []
        for r in user_resumes:
            if r.defining_keywords:
                for kw in r.defining_keywords:
                    user_skills.add(str(kw).lower())

        job_skills = {s.name.lower() for s in job.skills} if job.skills else set()
        if not job_skills and job.description:
            # Extract basic skills from description text
            desc_lower = job.description.lower()
            for tech in ["python", "javascript", "typescript", "react", "fastapi", "sql", "aws", "docker", "pytorch", "node"]:
                if tech in desc_lower:
                    job_skills.add(tech)

        # 1. Skills Coverage
        if job_skills:
            matched_count = len(user_skills.intersection(job_skills))
            skills_score = min(1.0, matched_count / len(job_skills))
        else:
            skills_score = 0.75

        # 2. Resume Alignment
        resume_score = 0.85 if user_resumes else 0.40

        # 3. Experience Evidence (Projects & Profile)
        user_projects = user.projects if user.projects else []
        exp_score = min(1.0, 0.5 + (len(user_projects) * 0.15))

        # 4. Application Completeness
        app_score = 0.95 if (user.full_name and user.email and (user_resumes or user.resume_url)) else 0.60

        # 5. Technical Interview Readiness
        tech_score = round((skills_score * 0.6) + (exp_score * 0.4), 2)

        # 6. Behavioral Prep
        behavioral_score = 0.70

        # 7. Company Knowledge
        company_knowledge_score = 0.65

        # 8. OA Readiness
        oa_score = 0.80

        breakdown = {
            "resume_alignment": round(resume_score, 2),
            "skills_coverage": round(skills_score, 2),
            "experience_evidence": round(exp_score, 2),
            "application_completeness": round(app_score, 2),
            "technical_interview": round(tech_score, 2),
            "behavioral_prep": round(behavioral_score, 2),
            "company_knowledge": round(company_knowledge_score, 2),
            "oa_readiness": round(oa_score, 2),
        }

        overall = sum(breakdown[k] * self.WEIGHTS[k] for k in breakdown)
        overall_readiness = round(overall, 2)

        # Top Improvements
        improvements = []
        if skills_score < 0.80 and job_skills:
            missing = list(job_skills - user_skills)[:3]
            if missing:
                improvements.append(f"Review core technical skills: {', '.join(missing)}")
        if not user_projects:
            improvements.append("Add 1-2 relevant technical projects to your profile portfolio.")
        if not user_resumes:
            improvements.append("Upload a role-specific resume category (e.g. SDE or AI/ML).")
        if company_knowledge_score < 0.80:
            improvements.append("Review 5-minute Company Brief and recent engineering developments.")

        if not improvements:
            improvements.append("Complete a 15-minute Resume Defense & Technical Mock screen.")

        return overall_readiness, breakdown, improvements
