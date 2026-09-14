# JobBlitz — Backend Architecture Specification

## 1. Stack & Principles

- **Framework**: FastAPI (Python 3.12)
- **Database**: PostgreSQL (SQLAlchemy 2.0 ORM + Alembic migrations)
- **Caching & Queue**: Redis
- **Security**: JWT authentication, OAuth2 password bearer flow, Argon2/Bcrypt password hashing.

## 2. Modular Service Domain Structure

```
backend/app/
├── api/
│   ├── deps.py             # Auth dependencies & database sessions
│   └── routes/
│       ├── auth.py          # User registration, login, refresh
│       ├── users.py         # Profile management
│       ├── jobs.py          # Job feed & detail routes
│       ├── readiness.py     # Readiness engine & skill gap endpoints
│       ├── resumes.py       # Resume variants & defense generator
│       ├── applications.py  # Application tracker pipeline
│       ├── watchlist.py     # Company hiring activity alerts
│       ├── analytics.py     # Application outcome metrics
│       ├── ai.py            # AI cover letter & prompt gateway
│       └── projects.py      # Project evidence records
├── core/
│   ├── config.py           # Pydantic environment settings
│   ├── database.py         # SQLAlchemy engine & sessionmaker
│   └── security.py         # JWT tokens & password hashing
├── models/
│   └── models.py           # SQLAlchemy ORM database models
├── schemas/
│   └── schemas.py          # Pydantic request/response validation schemas
└── services/
    ├── ai_service.py       # AI orchestration & sanitization
    ├── matching.py         # Match score algorithm (0-100%)
    ├── readiness.py        # 8-dimensional readiness engine
    ├── prep_hub.py         # 7-day plan & defense generator
    ├── company_intelligence.py # Public hiring signal aggregation
    └── fast_seed.py        # Seed MNC job postings
```

## 3. Data Ingestion & Health Architecture

```
Official Career Page / ATS Adapter (Greenhouse, Lever, Ashby, JobSpy)
                               │
                               ▼
                       Validate & Hash
                               │
                               ▼
                        Deduplicate
                               │
                               ▼
                     Compute Freshness Status
             (VERY_FRESH, FRESH, AGING, STALE)
                               │
                               ▼
                   Detect Hiring Signal Health
                   (HIGH, MEDIUM, LOW, UNKNOWN)
                               │
                               ▼
                   Save Job to PostgreSQL
```
