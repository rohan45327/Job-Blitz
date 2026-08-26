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

    # ─── Top IT Service-Based MNCs ────────────────────────────────────────────
    "tcs", "tata consultancy services", "infosys", "wipro",
    "hcl", "hcl technologies", "hcltech", "tech mahindra",
    "accenture", "cognizant", "capgemini", "deloitte", "ibm",
    "ltts", "l&t technology services", "l&t technology",
    "persistent", "persistent systems", "ltimindtree", "mindtree",
    "mphasis", "epam", "epam systems",
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


class MatchedJobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    job: JobOut
    match_score: float
    match_breakdown: dict
    matched_resume_id: Optional[uuid.UUID] = None
    matched_resume_category: Optional[str] = None
    is_high_match: bool = False


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
