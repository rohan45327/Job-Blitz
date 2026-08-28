# JobBlitz Product Specification & Feature Map

## 1. Product Vision & Value Proposition

JobBlitz is an **AI Job Search & Readiness Co-Pilot Platform**. It guides software engineering candidates through the complete career journey:

**DISCOVER** → **UNDERSTAND** → **MEASURE FIT** → **PREPARE** → **APPLY** → **PRACTICE** → **INTERVIEW** → **TRACK** → **IMPROVE**.

## 2. Core Feature Specifications

### 2.1 Job Health & Freshness Intelligence
- **Freshness**: `VERY_FRESH` (< 2 hours), `FRESH` (< 24 hours), `AGING` (< 7 days), `STALE` (> 14 days).
- **Hiring Signal**: Computes activity signals (`HIGH`, `MEDIUM`, `LOW`, `UNKNOWN`) based on posting history, re-posting intervals, and active ATS endpoints.

### 2.2 Dual Scoring Engine
- **Match Score (0-100%)**: Fit between user profile/resumes and job requirements.
- **Readiness Score (0-100%)**: Candidate readiness to pass screens, technical interviews, and defend projects.

### 2.3 Company & Candidate Intelligence
- **"How This Company Hires"**: Stage breakdown (Recruiter screen -> OA -> Technical interview -> Behavioral -> System Design -> Offer).
- **Candidate Benchmark**: Aggregated skill coverage & project depth indicators ("What successful candidates look like").
- **Data Provenance**: Every insight tags evidence sources (`OFFICIAL`, `PUBLIC SIGNAL`, `INFERENCE`).

### 2.4 Interview Readiness Hub
- **7-Day Personalized Prep Plan**: Day-by-day roadmap tailored to the role's readiness gaps.
- **Resume Defense Mode**: Generates candidate-specific questions an interviewer could ask about their resume/projects.
- **STAR Answer Coach**: Structuring Situation, Task, Action, Result for behavioral rounds using candidate's own history.
- **Project Interview Simulator**: Technical deep-dive questions (Architecture, Trade-offs, Scaling, Failure scenarios) per user project.
- **5-Minute Company Brief**: Pre-interview cheat sheet with company news, tech stack, and strategic questions to ask.

### 2.5 Mobile Navigation & Design System
- **Pure Black Theme (`#000000`)**: Inspired by modern minimalist technical platforms (X/Twitter dark mode & high-contrast light mode).
- **Primary Navigation**:
  - `Feed`: Daily Action Plan + Job list with dual Match % & Readiness % badges.
  - `Prepare`: 7-Day Prep Roadmap, STAR Coach, Resume Defense, Company Briefs, OA practice.
  - `Applied`: Application tracker pipeline (Saved -> Applied -> OA -> Interview -> Offer).
  - `Watch`: Company watchlist & hiring activity alerts.
  - `Profile`: User background, skills, resume variants, and Project Portfolio.
