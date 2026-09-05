from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ────────────────────────────────────────────────────────────────────────────
# Auth Schemas
# ────────────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)
    full_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ────────────────────────────────────────────────────────────────────────────
# Skill Schemas
# ────────────────────────────────────────────────────────────────────────────

class SkillOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


# ────────────────────────────────────────────────────────────────────────────
# User / Profile Schemas
# ────────────────────────────────────────────────────────────────────────────

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    experience_years: Optional[int] = None
    experience_level: Optional[str] = None
    preferred_work_type: Optional[str] = None
    salary_expectation_min: Optional[float] = None
    salary_expectation_max: Optional[float] = None
    preferred_locations: Optional[List[str]] = None
    open_to_relocation: Optional[bool] = None
    skill_ids: Optional[List[int]] = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: str
    full_name: Optional[str]
    title: Optional[str]
    bio: Optional[str]
    location: Optional[str]
    experience_years: Optional[int]
    experience_level: Optional[str]
    preferred_work_type: Optional[str]
    salary_expectation_min: Optional[float]
    salary_expectation_max: Optional[float]
    preferred_locations: Optional[List[str]]
    open_to_relocation: bool
    resume_url: Optional[str]
    skills: List[SkillOut] = []
    created_at: datetime


# ────────────────────────────────────────────────────────────────────────────
# Company Schemas
# ────────────────────────────────────────────────────────────────────────────

# Companies in this set get priority treatment in the UI (crown badge, slightly elevated card)
# ONLY the companies explicitly listed by the user — no extras
TIER_ONE_COMPANIES = {
    # ─── Fintech Unicorns & Payments ──────────────────────────────────────────
    "paytm", "phonepe", "razorpay", "cred", "groww", "zeta", "mobikwik",
    "pine labs", "pinelabs", "policybazaar", "acko", "paypal", "visa",
    "intuit", "zerodha", "bharatpe",

    # ─── Top Product-Based MNCs & Tech Giants ─────────────────────────────────
    "google", "microsoft", "amazon", "adobe", "meta", "salesforce", "oracle",
    "sap", "apple", "uber", "linkedin", "goldman sachs", "flipkart", "zoho",
    "freshworks",

    # ─── Additional Tech & Product MNCs ───────────────────────────────────────
    "spotify", "netflix", "dropbox", "atlassian", "slack", "twilio",
    "stripe", "square", "airbnb", "pinterest", "uber", "lyft",

    # ─── Top IT Service-Based MNCs ────────────────────────────────────────────
    "tcs", "tata consultancy services", "infosys", "wipro",
    "hcl", "hcl technologies", "hcltech", "tech mahindra",
    "accenture", "cognizant", "capgemini", "deloitte", "ibm",
    "ltts", "l&t technology services", "l&t technology",
    "persistent", "persistent systems", "ltimindtree", "mindtree",
    "mphasis", "epam", "epam systems",

    # ─── Cloud & Infrastructure ───────────────────────────────────────────────
    "vmware", "red hat", "canonical", "SUSE", "Oracle", "IBM",
    "Nutanix", "Rancher", "Mesosphere", "HashiCorp", "Databricks",
    "Snowflake", "Confluent", "Cloudera", "Teradata",
}


class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    domain: Optional[str]
    logo_url: Optional[str]
    careers_url: Optional[str]
    is_top_company: bool = False

    @classmethod
    def from_orm_with_tier(cls, obj) -> "CompanyOut":
        """Build CompanyOut and compute is_top_company from the company name."""
        import re
        instance = cls.model_validate(obj)
        name_lower = (obj.name or "").lower()
        is_top = False
        for tier in TIER_ONE_COMPANIES:
            escaped_tier = re.escape(tier)
            if re.search(rf"\b{escaped_tier}\b", name_lower):
                is_top = True
                break
        instance.is_top_company = is_top
        return instance


# ────────────────────────────────────────────────────────────────────────────
# Job Schemas
# ────────────────────────────────────────────────────────────────────────────

class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    company: CompanyOut
    location: Optional[str]
    work_type: Optional[str]
    experience_level: Optional[str]
    salary_min: Optional[float]
    salary_max: Optional[float]
    salary_currency: str
    apply_url: str
    source: str
    skills: List[SkillOut] = []
    posted_at: Optional[datetime]
    is_active: bool


class JobDetailOut(JobOut):
    description: Optional[str]
    raw_data: Optional[dict] = None


class OpportunityScoreOut(BaseModel):
    overall_score: float  # 0.0 to 100.0
    skill_match_pct: float  # 0.0 to 100.0
    experience_fit_pct: float  # 0.0 to 100.0
    role_relevance_pct: float  # 0.0 to 100.0
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    competition_level: str = "Medium"  # Low | Medium | High


class MatchedJobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    job: JobOut
    match_score: float
    match_breakdown: dict
    readiness_score: float = 0.75
    readiness_breakdown: Optional[dict] = None
    freshness: str = "FRESH"  # VERY_FRESH | FRESH | AGING | STALE
    hiring_signal: str = "HIGH"  # HIGH | MEDIUM | LOW | UNKNOWN
    matched_resume_id: Optional[uuid.UUID] = None
    matched_resume_category: Optional[str] = None
    is_high_match: bool = False
    opportunity_score: Optional[OpportunityScoreOut] = None


class JobIntelligenceOut(BaseModel):
    job_id: uuid.UUID
    opportunity_score: OpportunityScoreOut
    company_intelligence: Optional[CompanyIntelligenceOut] = None
    readiness_summary: Optional[ReadinessOut] = None
    key_responsibilities: List[str] = []
    recommended_actions: List[str] = []


class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    skills: List[str] = []
    github_url: Optional[str] = None
    live_url: Optional[str] = None
    architecture_notes: Optional[str] = None
    tradeoffs: Optional[str] = None
    key_metrics: Optional[str] = None


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    description: Optional[str]
    skills: List[str] = []
    github_url: Optional[str]
    live_url: Optional[str]
    architecture_notes: Optional[str]
    tradeoffs: Optional[str]
    key_metrics: Optional[str]
    created_at: datetime


class ReadinessOut(BaseModel):
    job_id: uuid.UUID
    overall_readiness: float  # 0.0 to 1.0 (0-100%)
    breakdown: dict  # {"resume": 0.9, "skills": 0.8, "technical_interview": 0.7, ...}
    top_improvements: List[str]


class CompanyIntelligenceOut(BaseModel):
    company_name: str
    hiring_funnel: List[str]  # ["Application", "Recruiter Screen", "OA", "Technical Screen", "Behavioral", "Offer"]
    what_team_values: List[str]
    common_interview_topics: List[str]
    tech_stack: List[str]
    recent_news: List[str]
    salary_range: Optional[str]
    public_sentiment: str  # "Generally Positive" | "Neutral"
    provenance: str = "OFFICIAL & PUBLIC SIGNALS"  # OFFICIAL | PUBLIC SIGNAL | INFERENCE


class CandidateBenchmarkOut(BaseModel):
    role_title: str
    user_skill_coverage: float
    benchmark_skill_coverage: float
    user_project_count: int
    benchmark_project_count: int
    top_candidate_skills: List[str]
    data_label: str = "Aggregated evidence benchmark"


class PreparationPlanOut(BaseModel):
    job_id: uuid.UUID
    overall_readiness: float
    days_plan: List[dict]  # [{"day": 1, "topic": "...", "tasks": [...]}]
    top_improvements: List[str]


class ResumeVulnerability(BaseModel):
    area: str
    vulnerability: str
    mitigation: str


class ResumeDefenseResponse(BaseModel):
    job_id: uuid.UUID
    project_title: Optional[str] = None
    recommended_resume_category: Optional[str] = None
    potential_questions: List[dict]  # [{"question": "...", "focus": "...", "suggested_defense": "..."}]
    vulnerabilities: List[ResumeVulnerability] = []


class ResumeRecommendResponse(BaseModel):
    job_id: uuid.UUID
    recommended_category: str
    matching_score: float
    reasoning: str
    available_categories: List[str] = []


class STARStoryCreate(BaseModel):
    title: str
    situation: str
    task: str
    action: str
    result: str
    skills: List[str] = []


class STARStoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    situation: str
    task: str
    action: str
    result: str
    skills: List[str] = []
    created_at: datetime


class STARStoryReviewRequest(BaseModel):
    job_id: uuid.UUID
    title: str
    situation: str
    task: str
    action: str
    result: str


class STARStoryReviewResponse(BaseModel):
    star_score: float  # 0.0 to 100.0
    strengths: List[str]
    improvements: List[str]
    suggested_rewrite: Optional[str] = None


class CompanyBriefOut(BaseModel):
    company_name: str
    role_title: str
    summary_5min: str
    why_role_exists: str
    recent_developments: List[str]
    tech_signals: List[str]
    questions_to_ask_interviewer: List[str]
    provenance: str = "OFFICIAL & PUBLIC SIGNALS"


class OutcomeAnalyticsOut(BaseModel):
    total_saved: int
    total_applied: int
    total_oa: int
    total_interviews: int
    total_offers: int
    total_rejections: int
    response_rate_percent: float
    interview_rate_percent: float



class ResumeCreate(BaseModel):
    category: str  # e.g. "AI/ML", "SDE", "Data Analysis", "Product", "Internship"
    title: str
    content_text: Optional[str] = None
    defining_keywords: List[str] = []


class ResumeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    category: str
    title: str
    content_text: Optional[str] = None
    defining_keywords: List[str] = []
    created_at: datetime


class ResumeUploadResponse(BaseModel):
    resume: ResumeOut
    extracted_keywords: List[str]  # auto-detected from the file
    text_length: int               # char count for display


class JobFeedResponse(BaseModel):
    items: List[MatchedJobOut]
    total: int
    page: int
    page_size: int
    total_pages: int = 1


class JobFilterParams(BaseModel):
    work_type: Optional[str] = None
    experience_level: Optional[str] = None
    salary_min: Optional[float] = None
    location: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


# ────────────────────────────────────────────────────────────────────────────
# Application Schemas
# ────────────────────────────────────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    job_id: uuid.UUID
    cover_letter: Optional[str] = None
    notes: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    job: JobOut
    status: str
    cover_letter: Optional[str]
    notes: Optional[str]
    applied_at: Optional[datetime]
    match_score: Optional[float]
    match_breakdown: Optional[dict]
    created_at: datetime
    updated_at: datetime


# ────────────────────────────────────────────────────────────────────────────
# Watchlist Schemas
# ────────────────────────────────────────────────────────────────────────────

class WatchlistAdd(BaseModel):
    company_id: uuid.UUID


class WatchlistOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    company: CompanyOut
    created_at: datetime


# ────────────────────────────────────────────────────────────────────────────
# Notification Schemas
# ────────────────────────────────────────────────────────────────────────────

class PushTokenRegister(BaseModel):
    token: str
    platform: str = "ios"


# ────────────────────────────────────────────────────────────────────────────
# AI / Cover Letter Schemas
# ────────────────────────────────────────────────────────────────────────────

class CoverLetterRequest(BaseModel):
    job_id: uuid.UUID
    tone: Optional[str] = "professional"  # professional | casual | enthusiastic


class CoverLetterResponse(BaseModel):
    cover_letter: str
    job_id: uuid.UUID


# ────────────────────────────────────────────────────────────────────────────
# Phase 5: Evidence Map Schemas
# ────────────────────────────────────────────────────────────────────────────

class ProjectEvidenceRecord(BaseModel):
    """A user project mapped to one or more job requirements."""
    project_id: str
    project_title: str
    matched_requirements: List[str]
    matched_skills: List[str]
    strength: str          # "strong" | "moderate" | "weak"
    talking_point: str     # Ready-to-use interview talking point


class UnmappedRequirement(BaseModel):
    requirement: str
    suggestion: str        # How to address this gap


class EvidenceMapResponse(BaseModel):
    job_id: uuid.UUID
    job_title: str
    company: str
    coverage_pct: int                         # 0-100
    mapped_projects: List[ProjectEvidenceRecord]
    unmapped_requirements: List[UnmappedRequirement]
    overall_verdict: str                      # e.g. "Strong evidence for 4 of 6 requirements"


# ────────────────────────────────────────────────────────────────────────────
# Phase 6: Skill Gap Classifier Schemas
# ────────────────────────────────────────────────────────────────────────────

class SkillRemediation(BaseModel):
    """Categorized skill gap with actionable remediation strategy."""
    skill_name: str
    category: str              # "critical" | "secondary"
    remediation_strategy: str  # Practical recommendation to bridge the gap
    estimated_hours: int       # Hours required to build working proof/evidence
    priority: str              # "high" | "medium" | "low"


class SkillGapClassificationResponse(BaseModel):
    job_id: uuid.UUID
    role_title: str
    total_missing_count: int
    critical_gaps: List[SkillRemediation]
    secondary_gaps: List[SkillRemediation]
    summary: str


# ────────────────────────────────────────────────────────────────────────────
# Phase 7: Advanced Match Analytics & Role Fit Diagnostics
# ────────────────────────────────────────────────────────────────────────────

class RoleFitDiagnosticsResponse(BaseModel):
    job_id: uuid.UUID
    role_title: str
    company_name: str
    overall_fit_score: int                 # 0-100
    skills_fit_pct: int                    # 0-100
    experience_fit_pct: int                # 0-100
    title_relevance_pct: int               # 0-100
    work_type_location_pct: int            # 0-100
    matching_strengths: List[str]
    risk_factors: List[str]
    executive_verdict: str
