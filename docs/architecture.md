# JobBlitz Architecture Specification

## 1. System Overview

JobBlitz is an AI-powered Job Discovery, Match Analysis, and Interview Readiness Platform built for software engineers and technology professionals.

```mermaid
graph TD
    subgraph Client Layer
        Mobile[React Native / Expo App]
    end

    subgraph API & Backend Layer
        FastAPI[FastAPI Backend Server]
        Auth[JWT & OAuth Security]
        Router[API Gateway & Routers]
    end

    subgraph Engine & Intelligence Layer
        Ingestion[Job Ingestion & Health Engine]
        Matching[Match Engine - 0..100%]
        Readiness[Readiness Engine - 8 Dimensions]
        PrepHub[Interview & Defense Hub Engine]
        CompIntel[Company & Public Signal Intelligence]
        AIService[AI Service & Sanitization Layer]
    end

    subgraph Data Layer
        Postgres[(PostgreSQL Database)]
        PersonalGraph[Personal Job Graph]
    end

    Mobile <--> FastAPI
    FastAPI --> Auth
    FastAPI --> Router
    Router --> Ingestion
    Router --> Matching
    Router --> Readiness
    Router --> PrepHub
    Router --> CompIntel
    
    Matching --> PersonalGraph
    Readiness --> PersonalGraph
    Ingestion --> Postgres
    PersonalGraph --> Postgres
    AIService --> PrepHub
    AIService --> Readiness
```

## 2. Ingestion & Health Architecture

The Job Ingestion Engine fetches postings from official company career pages (Greenhouse, Lever, Ashby, ATS adapters), normalizes metadata, and detects job freshness and hiring health signals.

```mermaid
sequenceDiagram
    participant ATS as Official ATS / Career Page
    participant Ingestion as Ingestion Engine
    participant DB as PostgreSQL
    participant Health as Ghost Job Signal Detector

    Ingestion->>ATS: Fetch JSON / Direct Board Feeds
    ATS-->>Ingestion: Raw Job Payloads
    Ingestion->>Ingestion: Content Hash & Deduplicate
    Ingestion->>Health: Compute Freshness (VERY_FRESH -> STALE)
    Health-->>Ingestion: Hiring Signal (HIGH, MEDIUM, LOW)
    Ingestion->>DB: Store Job & Source Provenance
```

## 3. Dual Engine Architecture: Match Score vs. Readiness Score

- **Match Score (0–100%)**: Measures how well the job requirements match the candidate's existing background (Role title, Skill overlap, Experience level, Work type, Salary/Location).
- **Readiness Score (0–100%)**: Measures candidate preparation across 8 dimensions:
  1. Resume Alignment
  2. Skill Coverage
  3. Experience Evidence
  4. Application Readiness
  5. Technical Screen Readiness
  6. Behavioral Screen Readiness
  7. Company Knowledge
  8. Online Assessment (OA) Readiness

## 4. Security & Data Provenance

1. **Strict Sanitization**: External job descriptions and public text pass through a strict sanitization pipeline to prevent prompt injection attempts.
2. **Data Provenance Rules**: Every piece of intelligence displays its source type:
   - `OFFICIAL`: Directly from official company ATS or career portal.
   - `PUBLIC SIGNAL`: Aggregated from public candidate reports and discussion feeds.
   - `INFERENCE`: Algorithmic suggestion based on structured data.
3. **Candidate Privacy**: Zero scraping or exposure of private candidate data. Only user-submitted or anonymized public evidence is utilized.
