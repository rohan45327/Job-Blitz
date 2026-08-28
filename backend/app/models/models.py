import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, String, Text, Enum, Table, UniqueConstraint, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


# ─── Association Tables ────────────────────────────────────────────────────────

user_skills = Table(
    "user_skills",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")),
    Column("skill_id", Integer, ForeignKey("skills.id", ondelete="CASCADE")),
)

job_skills = Table(
    "job_skills",
    Base.metadata,
    Column("job_id", UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE")),
    Column("skill_id", Integer, ForeignKey("skills.id", ondelete="CASCADE")),
)


# ─── Enums ─────────────────────────────────────────────────────────────────────

class WorkType(str, PyEnum):
    remote = "remote"
    hybrid = "hybrid"
    onsite = "onsite"
    internship = "internship"
    apprenticeship = "apprenticeship"
    research = "research"


class ExperienceLevel(str, PyEnum):
    entry = "entry"
    mid = "mid"
    senior = "senior"
    lead = "lead"
    executive = "executive"


class ApplicationStatus(str, PyEnum):
    saved = "saved"
    applied = "applied"
    online_assessment = "online_assessment"
    interview = "interview"
    offer = "offer"
    rejected = "rejected"
    withdrawn = "withdrawn"


class JobSource(str, PyEnum):
    greenhouse = "greenhouse"
    lever = "lever"
    ashby = "ashby"
    workday = "workday"
    scraped = "scraped"
    manual = "manual"
    jobspy = "jobspy"
    remoteok = "remoteok"
    internshala = "internshala"
    wellfound = "wellfound"


# ─── Skill ─────────────────────────────────────────────────────────────────────

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False, index=True)


# ─── Company ───────────────────────────────────────────────────────────────────

class Company(Base):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    domain = Column(String(255), unique=True, nullable=True)
    logo_url = Column(String(512), nullable=True)
    careers_url = Column(String(512), nullable=True)
    source_type = Column(Enum(JobSource), nullable=True)
    source_id = Column(String(255), nullable=True)  # e.g. greenhouse board token

    jobs = relationship("Job", back_populates="company", cascade="all, delete-orphan")
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


# ─── Job ───────────────────────────────────────────────────────────────────────

class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    source = Column(Enum(JobSource), nullable=False)
    external_id = Column(String(512), nullable=True)  # ID from the source ATS
    title = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    work_type = Column(Enum(WorkType), nullable=True)
    experience_level = Column(Enum(ExperienceLevel), nullable=True)
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    salary_currency = Column(String(10), default="USD")
    apply_url = Column(String(1024), nullable=False)
    is_active = Column(Boolean, default=True)
    posted_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    raw_data = Column(JSON, nullable=True)  # full raw payload from ATS

    company = relationship("Company", back_populates="jobs")
    skills = relationship("Skill", secondary=job_skills)
    applications = relationship("Application", back_populates="job")

    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    __table_args__ = (
        UniqueConstraint("source", "external_id", name="uq_job_source_external_id"),
    )


# ─── User ──────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(512), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # Profile fields
    title = Column(String(255), nullable=True)       # current/desired job title
    bio = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    experience_years = Column(Integer, nullable=True)
    experience_level = Column(Enum(ExperienceLevel), nullable=True)
    preferred_work_type = Column(Enum(WorkType), nullable=True)
    salary_expectation_min = Column(Float, nullable=True)
    salary_expectation_max = Column(Float, nullable=True)
    preferred_locations = Column(JSON, default=list)  # list of location strings
    open_to_relocation = Column(Boolean, default=False)
    resume_url = Column(String(1024), nullable=True)

    skills = relationship("Skill", secondary=user_skills)
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    push_tokens = relationship("PushToken", back_populates="user", cascade="all, delete-orphan")
    watchlist = relationship("Watchlist", back_populates="user", cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")

    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


# ─── Application ───────────────────────────────────────────────────────────────

class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.saved, nullable=False)
    cover_letter = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    applied_at = Column(DateTime(timezone=True), nullable=True)
    match_score = Column(Float, nullable=True)  # 0.0 to 1.0
    match_breakdown = Column(JSON, nullable=True)  # {"role": 0.9, "skills": 0.7, ...}

    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")

    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_application_user_job"),
    )


# ─── PushToken ─────────────────────────────────────────────────────────────────

class PushToken(Base):
    __tablename__ = "push_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(512), unique=True, nullable=False)
    platform = Column(String(20), nullable=True)  # "ios" | "android"
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="push_tokens")


# ─── Watchlist ─────────────────────────────────────────────────────────────────

class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="watchlist")
    company = relationship("Company")

    __table_args__ = (
        UniqueConstraint("user_id", "company_id", name="uq_watchlist_user_company"),
    )


# ─── Resume ────────────────────────────────────────────────────────────────────

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)  # e.g. "AI/ML", "SDE", "Data Analysis", "Product", "Internship"
    title = Column(String(255), nullable=False)
    content_text = Column(Text, nullable=True)
    defining_keywords = Column(JSON, default=list)  # User entered search/defining keywords e.g. ["PyTorch", "LLM", "CUDA"]
    skills = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="resumes")


# ─── Project ───────────────────────────────────────────────────────────────────

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    skills = Column(JSON, default=list)  # ["Python", "PyTorch", "FastAPI"]
    github_url = Column(String(512), nullable=True)
    live_url = Column(String(512), nullable=True)
    architecture_notes = Column(Text, nullable=True)
    tradeoffs = Column(Text, nullable=True)
    key_metrics = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="projects")


# ─── Preparation Plan & Readiness ──────────────────────────────────────────────

class PreparationPlan(Base):
    __tablename__ = "preparation_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    readiness_score = Column(Float, default=0.0)  # 0.0 to 1.0
    breakdown = Column(JSON, default=dict)
    days_plan = Column(JSON, default=list)  # List of daily roadmap tasks
    top_improvements = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


# ─── STAR Story ────────────────────────────────────────────────────────────────

class STARStory(Base):
    __tablename__ = "star_stories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    situation = Column(Text, nullable=False)
    task = Column(Text, nullable=False)
    action = Column(Text, nullable=False)
    result = Column(Text, nullable=False)
    skills = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utcnow)


# ─── Outcome Metric ────────────────────────────────────────────────────────────

class OutcomeMetric(Base):
    __tablename__ = "outcome_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    total_saved = Column(Integer, default=0)
    total_applied = Column(Integer, default=0)
    total_oa = Column(Integer, default=0)
    total_interviews = Column(Integer, default=0)
    total_offers = Column(Integer, default=0)
    total_rejections = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


