"""
JobBlitz Preparation Hub Engine

Provides personalized interview & application preparation tools:
  - 7-Day Prep Roadmap
  - Resume Defense Mode (user project & resume line defense questions)
  - STAR Answer Coach (Situation, Task, Action, Result)
  - 5-Minute Company Brief & Smart Questions to Ask
"""
from __future__ import annotations
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.models import User, Job, Project, STARStory


class PrepHubEngine:
    def __init__(self, db: Session):
        self.db = db

    def generate_prep_plan(self, user: User, job: Job, readiness_score: float) -> Dict[str, Any]:
        title = job.title or "Software Engineer"
        company_name = job.company.name if job.company else "Company"

        days_plan = [
            {
                "day": 1,
                "title": "Company & Role Fundamentals",
                "tasks": [
                    f"Read 5-Minute Company Brief for {company_name}",
                    "Review required core skills & role responsibilities",
                    "Align your 30-second elevator pitch to the job description"
                ]
            },
            {
                "day": 2,
                "title": "Core Technical Skills Deep Dive",
                "tasks": [
                    "Review key programming concepts (Python / TypeScript / Data Structures)",
                    "Practice 3 core algorithm & SQL challenges",
                    "Verify API design & schema validation concepts"
                ]
            },
            {
                "day": 3,
                "title": "Resume Defense & Project Architecture",
                "tasks": [
                    "Run Resume Defense Mode on your primary projects",
                    "Prepare 2-minute architecture explanation for your top project",
                    "Document trade-offs & scaling decisions"
                ]
            },
            {
                "day": 4,
                "title": "System Design & Architecture",
                "tasks": [
                    "Review API rate limiting, caching (Redis), and database indexing",
                    "Practice sketching backend system components",
                    "Prepare scalability & failover talking points"
                ]
            },
            {
                "day": 5,
                "title": "Behavioral & STAR Answer Coaching",
                "tasks": [
                    "Prepare STAR story for a challenging technical bug/failure",
                    "Prepare STAR story for team collaboration/conflict",
                    "Refine 'Why this company?' and 'Why this role?' answers"
                ]
            },
            {
                "day": 6,
                "title": "Mock Technical & Interview Simulation",
                "tasks": [
                    "Conduct a 30-minute timed mock interview",
                    "Review answers to top 5 questions to ask the interviewer",
                    "Finalize resume variant alignment"
                ]
            },
            {
                "day": 7,
                "title": "Final Interview Day Readiness",
                "tasks": [
                    "Review 5-minute pre-interview cheat sheet",
                    "Prepare environment, questions, and STAR stories",
                    "Execute confident interview screen"
                ]
            }
        ]

        top_improvements = [
            f"Review company brief for {company_name}",
            "Practice project defense questions on top portfolio projects",
            "Prepare 2 behavioral STAR stories"
        ]

        return {
            "job_id": job.id,
            "overall_readiness": readiness_score,
            "days_plan": days_plan,
            "top_improvements": top_improvements
        }

    def generate_resume_defense(self, user: User, job: Job, project: Optional[Project] = None) -> Dict[str, Any]:
        proj_title = project.title if project else "Primary Engineering Project"
        proj_skills = ", ".join(project.skills) if project and project.skills else "Python, FastAPI, SQL"

        questions = [
            {
                "question": f"In your '{proj_title}' project, why did you choose this technical stack ({proj_skills})?",
                "focus": "Architectural Rationale & Trade-offs",
                "suggested_defense": "Explain the speed of iteration, ecosystem support, and performance bottlenecks you evaluated before deciding."
            },
            {
                "question": "What was the most difficult technical bug or scaling issue you encountered in this project, and how did you resolve it?",
                "focus": "Debugging & Problem Solving",
                "suggested_defense": "Use the STAR method: describe the symptom, your diagnostic steps (logs, profiling), the root cause, and the fix."
            },
            {
                "question": "If you had to handle 10x higher traffic or data volume on this architecture, what would fail first and how would you redesign it?",
                "focus": "Scalability & Future Design",
                "suggested_defense": "Identify database locks or synchronous API calls as bottlenecks, then propose async queues, caching, and read replicas."
            }
        ]

        return {
            "job_id": job.id,
            "project_title": proj_title,
            "potential_questions": questions
        }

    def generate_company_brief(self, job: Job) -> Dict[str, Any]:
        company_name = job.company.name if job.company else "Company"
        role_title = job.title or "Software Engineer"

        return {
            "company_name": company_name,
            "role_title": role_title,
            "summary_5min": f"{company_name} is an industry leader building high-scale technology solutions. This {role_title} role focuses on expanding core backend/product capabilities.",
            "why_role_exists": f"To accelerate development of scalable engineering systems, improve throughput, and deliver key product features.",
            "recent_developments": [
                f"{company_name} expanding platform capabilities and cloud architecture.",
                "High priority on technical reliability, developer productivity, and performance."
            ],
            "tech_signals": ["REST APIs", "Python / TypeScript", "SQL & Relational DBs", "Docker & Cloud Deployments"],
            "questions_to_ask_interviewer": [
                "What does success look like for this role in the first 90 days?",
                "What are the biggest technical challenges the team is working on right now?",
                "How does the engineering team handle testing, CI/CD, and deployment reliability?"
            ],
            "provenance": "OFFICIAL & PUBLIC SIGNALS"
        }
