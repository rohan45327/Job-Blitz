---
title: JobBlitz
emoji: 🚀
colorFrom: blue
colorTo: purple
sdk: gradio
sdk_version: "4.44.1"
app_file: app.py
pinned: false
---

# Job Blitz 🚀

Job Blitz is an AI-powered Job Application Productivity Agent that reduces the repetitive work involved in finding, understanding, preparing for, applying to, and tracking job opportunities.

Instead of treating job hunting as a collection of disconnected tasks, Job Blitz turns it into one intelligent workflow.

## 🌟 The Solution

Job Blitz acts as an AI productivity layer over the complete job application workflow. It helps a candidate:
- Discover relevant opportunities
- Understand job requirements
- Calculate explainable job-fit and readiness scores
- Identify missing skills and generate a prioritized preparation roadmap
- Tailor resumes and cover letters
- Prepare for role-specific interviews
- Apply and track applications
- Receive reminders and follow-ups

## 🏗 Architecture & Tech Stack

### Frontend (Mobile App)
Located in the `/mobile` directory, the frontend is a cross-platform mobile application.
- **Framework:** React Native with Expo (SDK 51)
- **Language:** TypeScript
- **State Management:** Zustand
- **Data Fetching:** TanStack React Query
- **Navigation:** React Navigation (Bottom Tabs & Native Stack)

### Backend (API & Background Workers)
Located in the `/backend` directory, this drives the core logic, AI integrations, and data processing.
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL (ORM via SQLAlchemy & migrations via Alembic)
- **Background Tasks:** Celery + Redis (Worker & Beat Scheduler)
- **AI Integration:** Google Generative AI (Gemini) & OpenAI
- **Utilities:** PDF/Docx Parsing (`pdfplumber`, `python-docx`) and Job Scraping (`python-jobspy`, `beautifulsoup4`)

## 📂 Project Structure

```text
autopin/
├── backend/               # FastAPI Backend Service
│   ├── app/               # Application source code (Models, Routers, Services)
│   ├── alembic/           # Database migration scripts
│   ├── Dockerfile         # Docker configuration for backend services
│   ├── requirements.txt   # Python dependencies
│   └── .env.example       # Example environment variables
├── mobile/                # Expo/React Native Mobile App
│   ├── src/               # Application source code (Components, Screens, Navigation)
│   ├── App.tsx            # App Entry Point
│   ├── app.json           # Expo configuration
│   ├── eas.json           # Expo Application Services build config
│   └── package.json       # Node dependencies
├── docker-compose.yml     # Local orchestration for DB, Redis, API, and Celery
├── render.yaml            # Render Cloud deployment pipeline
└── README.md              # Project documentation
```

## 🚀 Pipelines & Deployment

### 1. Local Development Pipeline (`docker-compose.yml`)
You can spin up the entire backend stack locally using Docker Compose. This pipeline automatically orchestrates:
- **PostgreSQL Database** (`db`)
- **Redis Cache/Broker** (`redis`)
- **Database Migrations** (`migrate` - runs Alembic upgrades on startup)
- **FastAPI Server** (`api` - runs with hot-reload)
- **Celery Worker & Celery Beat** (`celery_worker`, `celery_beat`)

**Command:**
```bash
docker-compose up --build
```

### 2. Backend Production Pipeline (`render.yaml`)
The backend is configured for continuous deployment on **Render**. The pipeline defines:
- A `jobblitz-backend` Web Service running Python.
- A managed PostgreSQL instance (`jobblitz-db`).
- Auto-provisioning of environment variables including DB connection strings.

### 3. Mobile Build Pipeline (`eas.json`)
The mobile application is integrated with **Expo Application Services (EAS)** for cloud building.
- Build Android APKs via the configured preview profile.
**Command:**
```bash
cd mobile && npm run build:apk
```

## 🛠 Features in Detail

1. **AI Job Intelligence:** Extracts skills, responsibilities, and keywords from scraped job descriptions.
2. **Match & Readiness Engine:** Produces an explainable fit score based on your profile.
3. **Skill Gap Engine:** Identifies missing or weak skills.
4. **Resume & Cover Letter Tailoring:** Adapts documents preserving factual candidate information.
5. **Interview Copilot:** Generates mock interviews and questions specific to the role.
6. **Application Tracker:** Centralized workspace for tracking deadlines, follow-ups, and outcomes.

## 📜 License
Licensed under the **MIT License**. See the `LICENSE` file for more details.
