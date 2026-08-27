
# JobBlitz

A mobile-first AI job-search co-pilot that aggregates listings from multiple applicant tracking systems, ranks them against a candidate's actual resumes, and helps them apply faster.

**Android build:** distributed as a standalone `JobBlitz.apk` via EAS Cloud Build

---

## The Problem

As a student, it is easy to miss internships and job roles that would have been a genuine fit - not because they don't exist, but because they are scattered. Postings live across LinkedIn, Naukri, and dozens of individual company career pages, and following any one source means missing what the others have.

Student life already runs on a tight budget of time: classes, building projects, networking, and having some semblance of a personal life. Into that same narrow window, the traditional job search asks for a lot more - check LinkedIn, check Naukri, check career pages, filter out roles that do not fit, pick or prepare the right resume, read through inconsistent job descriptions, manually match each one against your own experience, and only then apply. One listing at a time. This is the process that has been followed for decades, and it quietly consumes the hours students need for everything else that actually builds a career.

## The Solution

JobBlitz collapses that entire workflow into one place. It addresses the problem directly, on three fronts:

- **Multi-ATS ingestion pipeline.** Jobs are pulled continuously from (Greenhouse, Lever, Ashby, Workday, RemoteOK, Internshala, Wellfound, LinkedIn/Indeed and more scrapers) using 4 core libraries (jobspy, httpx, beautifulsoup4, celery) and stored in a unified PostgreSQL schema.
- **Multi-dimensional matching engine.** Each job is scored against the candidate's resume using a weighted model: title relevance (25%), resume keyword overlap (40%), experience level (15%), work type (10%), and salary/location (10%). Candidates can maintain multiple categorized resumes (for example, Fullstack, Mobile, AI/ML) and get matched against the right one.
- **Text sanitization layer.** A dedicated utility decodes HTML entities and strips markup and tags from every job card, modal, and detail view before it reaches the UI.

## Technology Stack

**Mobile**
- React Native with Expo SDK 51, TypeScript
- State and data fetching: `@tanstack/react-query`, Zustand
- Custom animated loading indicator, Clearbit CDN for company logos


<img width="300" height="600" alt="WhatsApp Image 2026-08-27 at 20 25 04 (2)" src="https://github.com/user-attachments/assets/2b9f34cf-c971-46fd-89ba-be87e35d7d0f" />
<img width="300" height="600" alt="WhatsApp Image 2026-08-27 at 20 25 06" src="https://github.com/user-attachments/assets/282632e0-fd94-4d46-a26f-d4d1d6000eec" />


**Backend**
- Python 3.12, FastAPI, Uvicorn (async endpoints)
- PostgreSQL with SQLAlchemy 2.0 and connection pooling
- Celery with Redis for background ingestion tasks
- JWT authentication with refresh token rotation, bcrypt password hashing

**Infrastructure**
- Backend deployed on Render
- Android builds via EAS Cloud Build
- Source control on GitHub

## Core Features

- Multi-ATS job ingestion pipeline pulling continuously from Greenhouse, Lever, Ashby, and Workday into a unified, standardized database
- Weighted matching engine scoring every job against a candidate's resume across title, skill/keyword overlap, experience level, work type, and salary/location fit
- Multiple categorized resumes per candidate (Fullstack, Mobile, AI/ML, etc.), with automated keyword extraction from uploaded PDF or DOCX files, so matching is run against the right resume for each role
- AI-generated, role-specific cover letters tailored to the candidate's experience and the job's requirements
- Automatic high-match alerts when a new job crosses the 75% threshold, tied to the resume category it matched against
- Advanced multi-select filtering by company, work type (including internship, apprenticeship, research), experience level, and salary across multiple currencies
- Persistent application tracker covering the full lifecycle: saved, applied, online assessment, interview, offer, rejected
- Company watchlist for monitoring target employers for new postings

<img width="300" height="600" alt="WhatsApp Image 2026-08-27 at 20 25 06 (1)" src="https://github.com/user-attachments/assets/7c4ebbc2-bc23-48c7-aa17-4f00636bb629" />
<img width="300" height="600" alt="WhatsApp Image 2026-08-27 at 20 25 05" src="https://github.com/user-attachments/assets/01bb408f-baeb-4b18-a759-d0f1d5505c59" />


## Project Structure

```
jobblitz/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # Auth, jobs, resumes, applications, AI, watchlist
│   │   ├── core/             # Config, database, security
│   │   ├── models/           # SQLAlchemy ORM models (User, Job, Company, Resume)
│   │   ├── schemas/          # Pydantic schemas, tier-one company registry
│   │   ├── services/         # Matching engine, resume parser, AI service
│   │   └── worker/           # Celery background ingestion tasks
│   ├── Dockerfile            # Multi-stage production build
│   ├── render.yaml           # Render deployment blueprint
│   └── requirements.txt
│
├── mobile/
│   ├── src/
│   │   ├── api/client.ts     # Type-safe API client
│   │   ├── components/       # Loader, job card, filter sheet, cover letter modal
│   │   ├── screens/          # Home, job detail, applications, profile
│   │   ├── theme/            # Design tokens and theme context
│   │   └── utils/cleanText.ts
│   ├── app.json
│   └── eas.json
│
└── docker-compose.yml         # Local multi-container development setup
```

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Or with Docker:

```bash
docker compose up --build
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

To build a standalone Android APK:

```bash
eas build --platform android --profile preview
```

## License

Licensed By MIT.
