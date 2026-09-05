from __future__ import annotations
import re
from typing import List, Tuple
from sqlalchemy.orm import Session

from app.models.models import User, Job
from app.schemas.schemas import (
    OpportunityScoreOut,
    JobIntelligenceOut,
    CompanyIntelligenceOut,
    ReadinessOut,
    TIER_ONE_COMPANIES,
)
from app.services.company_intelligence import CompanyIntelligenceService
from app.services.readiness import ReadinessEngine


class JobIntelligenceService:
    def __init__(self, db: Session):
        self.db = db

    def calculate_opportunity_score(self, user: User, job: Job) -> OpportunityScoreOut:
        """
        Calculates normalized Opportunity Score metrics (0-100 scale):
        - Skill Match %: user skills vs required job skills
        - Experience Fit %: user target/experience level vs job level requirement
        - Role Relevance %: user title/target role vs job title
        - Matched & Missing Skills lists
        - Competition Level: "High" | "Medium" | "Low"
        """
        # 1. Extract required skills from job
        job_skills = set()
        if job.skills:
            for s in job.skills:
                job_skills.add(s.name.lower())

        # Fallback skill extraction from job title / description if empty
        jd_text = (job.description or "") + " " + (job.title or "")
        jd_text_lower = jd_text.lower()

        common_tech = [
            "python", "javascript", "typescript", "react", "node.js", "docker", "aws",
            "sql", "postgresql", "fastapi", "django", "java", "c++", "kubernetes",
            "html", "css", "git", "ci/cd", "rest api", "graphql", "mongodb", "redis",
            "express", "next.js", "react native", "flutter", "swift", "kotlin", "gcp", "azure"
        ]
        for tech in common_tech:
            if re.search(rf"\b{re.escape(tech)}\b", jd_text_lower):
                job_skills.add(tech)

        # 2. Extract user skills from resumes + profile
        user_skills = set()
        if user.skills:
            for s in user.skills:
                user_skills.add(s.name.lower())

        if user.resumes:
            for res in user.resumes:
                if res.defining_keywords:
                    for kw in res.defining_keywords:
                        user_skills.add(kw.lower())
                if res.content_text:
                    res_lower = res.content_text.lower()
                    for tech in common_tech:
                        if re.search(rf"\b{re.escape(tech)}\b", res_lower):
                            user_skills.add(tech)

        if user.title:
            for t in user.title.lower().split():
                if len(t) > 3:
                    user_skills.add(t)

        matched_skills_list = [s.title() for s in job_skills if s in user_skills]
        missing_skills_list = [s.title() for s in job_skills if s not in user_skills]

        # Skill Match %
        if job_skills:
            skill_match_pct = round((len(matched_skills_list) / len(job_skills)) * 100.0, 1)
        else:
            skill_match_pct = 75.0

        # Experience Fit %
        job_exp = (job.experience_level or "ENTRY").upper()
        user_exp = (user.experience_level or "ENTRY").upper()
        if job_exp == user_exp:
            experience_fit_pct = 95.0
        elif job_exp in ["ENTRY", "INTERN", "JUNIOR"] and user_exp in ["ENTRY", "JUNIOR", "MID"]:
            experience_fit_pct = 85.0
        elif job_exp == "MID" and user_exp in ["ENTRY", "SENIOR"]:
            experience_fit_pct = 70.0
        else:
            experience_fit_pct = 60.0

        # Role Relevance %
        user_title_tokens = set(re.findall(r"\w+", (user.title or "Software Engineer").lower()))
        job_title_tokens = set(re.findall(r"\w+", (job.title or "").lower()))
        overlap = user_title_tokens.intersection(job_title_tokens)
        if job_title_tokens:
            role_relevance_pct = round(min(100.0, (len(overlap) / max(1, len(job_title_tokens))) * 120.0), 1)
        else:
            role_relevance_pct = 70.0
        role_relevance_pct = max(40.0, role_relevance_pct)

        # Competition Level
        comp_name_lower = (job.company.name or "").lower() if job.company else ""
        is_tier_one = any(re.search(rf"\b{re.escape(t)}\b", comp_name_lower) for t in TIER_ONE_COMPANIES)
        if is_tier_one:
            competition_level = "High"
        elif job.source and job.source.lower() in ["linkedin", "indeed"]:
            competition_level = "Medium"
        else:
            competition_level = "Low"

        # Overall Opportunity Score (weighted 0-100)
        overall_score = round(
            skill_match_pct * 0.45 + experience_fit_pct * 0.30 + role_relevance_pct * 0.25, 1
        )

        return OpportunityScoreOut(
            overall_score=overall_score,
            skill_match_pct=skill_match_pct,
            experience_fit_pct=experience_fit_pct,
            role_relevance_pct=role_relevance_pct,
            matched_skills=matched_skills_list,
            missing_skills=missing_skills_list,
            competition_level=competition_level,
        )

    def get_job_intelligence(self, user: User, job: Job) -> JobIntelligenceOut:
        opp_score = self.calculate_opportunity_score(user, job)
        
        # Company Intelligence
        comp_svc = CompanyIntelligenceService(self.db)
        comp_intel = comp_svc.get_company_intelligence(job.company.name) if job.company else None

        # Readiness Summary
        readiness_eng = ReadinessEngine(self.db)
        readiness_val, readiness_bdown, top_imps = readiness_eng.compute_readiness(user, job)
        readiness_summary = ReadinessOut(
            job_id=job.id,
            overall_readiness=readiness_val,
            breakdown=readiness_bdown,
            top_improvements=top_imps,
        )

        # Key Responsibilities & Recommended Actions
        key_responsibilities = [
            f"Deliver high quality code for {job.title} features",
            "Collaborate across engineering and product teams",
            "Participate in design, code reviews, and system optimizations",
        ]

        recommended_actions = []
        if opp_score.missing_skills:
            recommended_actions.append(f"Review core concepts for missing skill: {opp_score.missing_skills[0]}")
        recommended_actions.append("Tailor target resume to emphasize relevant project achievements")
        recommended_actions.append("Practice top technical interview topics for this role")

        return JobIntelligenceOut(
            job_id=job.id,
            opportunity_score=opp_score,
            company_intelligence=comp_intel,
            readiness_summary=readiness_summary,
            key_responsibilities=key_responsibilities,
            recommended_actions=recommended_actions,
        )
