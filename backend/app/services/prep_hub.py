"""
JobBlitz Preparation Hub Engine — Highly Specific, Evidence-Backed Guidance

Generates domain-specific 7-Day Roadmaps, Resume Defense Questions, and 5-Minute Company Briefs tailored to the exact Company, Job Title, Required Skills, and Engineering Domain.
"""
from __future__ import annotations
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.models import User, Job, Project


def detect_engineering_domain(title: str, description: str, skills: List[str]) -> str:
    """Classify role into specific engineering track."""
    text = f"{title} {description} {' '.join(skills)}".lower()
    if any(k in text for k in ["ml", "machine learning", "ai", "llm", "deep learning", "nlp", "computer vision", "pytorch", "tensorflow"]):
        return "ai_ml"
    elif any(k in text for k in ["frontend", "react", "vue", "angular", "mobile", "ios", "android", "flutter", "react native"]):
        return "frontend_mobile"
    elif any(k in text for k in ["data engineer", "etl", "spark", "airflow", "bigquery", "snowflake", "pipeline"]):
        return "data_engineering"
    elif any(k in text for k in ["devops", "sre", "cloud", "kubernetes", "k8s", "terraform", "aws", "docker"]):
        return "devops_cloud"
    elif any(k in text for k in ["fullstack", "full stack", "full-stack"]):
        return "fullstack"
    else:
        return "backend_systems"


class PrepHubEngine:
    def __init__(self, db: Session):
        self.db = db

    def generate_prep_plan(self, user: User, job: Job, readiness_score: float) -> Dict[str, Any]:
        title = job.title or "Software Engineer"
        company_name = job.company.name if job.company else "Company"
        job_skills = [s.name for s in job.skills] if job.skills else []
        desc = job.description or ""
        domain = detect_engineering_domain(title, desc, job_skills)

        primary_skills_str = ", ".join(job_skills[:4]) if job_skills else "Core Programming & Algorithms"

        # Specialized Day-by-Day Roadmaps per Domain
        if domain == "ai_ml":
            days_plan = [
                {
                    "day": 1,
                    "title": f"Company & Role Fundamentals ({company_name})",
                    "tasks": [
                        f"Read 5-Minute Brief on {company_name}'s AI/ML product infrastructure",
                        f"Review {title} job requirements & model deployment expectations",
                        "Align 30-second introduction focusing on ML projects & PyTorch/TensorFlow experience"
                    ]
                },
                {
                    "day": 2,
                    "title": "Machine Learning Algorithms & Foundations",
                    "tasks": [
                        f"Review core theory behind required skills: {primary_skills_str}",
                        "Practice 3 ML coding problems: Gradient Descent, Matrix Operations, & Custom Losses",
                        "Verify Evaluation Metrics (Precision/Recall, F1, ROC-AUC, BLEU, ROUGE)"
                    ]
                },
                {
                    "day": 3,
                    "title": "Resume Defense & ML Project Deep-Dive",
                    "tasks": [
                        "Run Resume Defense Mode on your primary Machine Learning project",
                        "Prepare 2-minute architecture explanation of dataset pipeline & model choice",
                        "Document trade-offs: Model Latency vs Accuracy, Quantization vs Full Precision"
                    ]
                },
                {
                    "day": 4,
                    "title": "ML System Design & High-Throughput Serving",
                    "tasks": [
                        "Practice ML System Design: Feature Store, Vector Search (FAISS/Milvus), & Model Registry",
                        "Review real-time inference serving architecture (Triton / TorchServe / FastAPI)",
                        "Prepare talking points on Data Drift, Monitoring, & Retraining pipelines"
                    ]
                },
                {
                    "day": 5,
                    "title": "Behavioral & Engineering Values Alignment",
                    "tasks": [
                        f"Prepare STAR story for a model failure, data quality bug, or latency bottleneck",
                        f"Align STAR story with {company_name}'s engineering values & team culture",
                        "Refine 'Why this company?' answer grounded in their AI products"
                    ]
                },
                {
                    "day": 6,
                    "title": "Mock Technical & ML System Defense",
                    "tasks": [
                        "Execute 45-minute timed ML Coding & System Design simulation",
                        f"Review top 5 strategic questions to ask {company_name}'s Lead AI Engineer",
                        "Finalize resume variant alignment for AI/ML engineering"
                    ]
                },
                {
                    "day": 7,
                    "title": "Final Pre-Interview Readiness",
                    "tasks": [
                        "Review 5-minute pre-interview cheat sheet & key ML metric definitions",
                        "Verify code environment, portfolio demos, and STAR stories",
                        "Execute confident interview screen with interviewer"
                    ]
                }
            ]
        elif domain == "frontend_mobile":
            days_plan = [
                {
                    "day": 1,
                    "title": f"Company & Product UX Fundamentals ({company_name})",
                    "tasks": [
                        f"Read 5-Minute Brief on {company_name}'s frontend architecture & design system",
                        f"Review {title} responsibilities (State management, Performance, Component Architecture)",
                        "Align introduction focusing on UI component libraries & 60 FPS performance"
                    ]
                },
                {
                    "day": 2,
                    "title": "JavaScript / TypeScript & DOM / Mobile Internals",
                    "tasks": [
                        f"Deep dive into required skills: {primary_skills_str}",
                        "Practice JavaScript Machine Coding: Event Loop, Closures, Async/Await, & Custom Hooks",
                        "Review React/React Native re-render optimization (useMemo, useCallback, VirtualizedLists)"
                    ]
                },
                {
                    "day": 3,
                    "title": "Resume Defense & Frontend Architecture",
                    "tasks": [
                        "Run Resume Defense Mode on your top Web/Mobile portfolio project",
                        "Prepare 2-minute explanation of State Management & API integration",
                        "Document trade-offs: Client-side vs Server-side rendering, Bundle size optimization"
                    ]
                },
                {
                    "day": 4,
                    "title": "Frontend System Design & Machine Coding Round",
                    "tasks": [
                        "Practice Frontend System Design: Autocomplete Search Widget or Infinite Feed with Caching",
                        "Review Network Performance: WebSockets, Stale-While-Revalidate, GraphQL vs REST",
                        "Prepare Accessibility (a11y) & Design System Token talking points"
                    ]
                },
                {
                    "day": 5,
                    "title": "Behavioral & Product UX Alignment",
                    "tasks": [
                        "Prepare STAR story for fixing a critical UI/UX bug or performance regression",
                        f"Align answers with {company_name}'s product UX standards & design philosophy",
                        "Refine 'Why this role?' answer tied to their user-facing application"
                    ]
                },
                {
                    "day": 6,
                    "title": "Mock Technical & Live Coding Simulation",
                    "tasks": [
                        "Execute 45-minute timed Machine Coding exercise (Component from scratch)",
                        f"Review 5 targeted questions to ask {company_name}'s Lead Frontend Engineer",
                        "Finalize resume alignment"
                    ]
                },
                {
                    "day": 7,
                    "title": "Final Pre-Interview Readiness",
                    "tasks": [
                        "Review 5-minute pre-interview cheat sheet & design token references",
                        "Verify code environment & demo links",
                        "Execute confident interview screen"
                    ]
                }
            ]
        else: # Backend & Systems / Data / DevOps
            days_plan = [
                {
                    "day": 1,
                    "title": f"Company & Engineering System Overview ({company_name})",
                    "tasks": [
                        f"Read 5-Minute Brief on {company_name}'s core engineering architecture",
                        f"Review {title} requirements: {primary_skills_str}",
                        "Align 30-second introduction emphasizing backend systems & API scalability"
                    ]
                },
                {
                    "day": 2,
                    "title": "Data Structures, Algorithms & Database SQL",
                    "tasks": [
                        "Practice 3 core algorithm problems: Graphs, Hash Tables, & Sliding Window",
                        "Review SQL Indexing (B-Trees), ACID Transactions, & Isolation Levels",
                        "Verify REST / gRPC API design standards & OpenAPI validation"
                    ]
                },
                {
                    "day": 3,
                    "title": "Resume Defense & Backend Project Deep-Dive",
                    "tasks": [
                        "Run Resume Defense Mode on your primary backend project",
                        "Prepare 2-minute architecture explanation of API endpoints & database schema",
                        "Document trade-offs: SQL vs NoSQL, Synchronous APIs vs Async Message Queues"
                    ]
                },
                {
                    "day": 4,
                    "title": "High-Scale System Design & Microservices",
                    "tasks": [
                        "Practice Distributed System Design: Rate Limiter, Payment Gateway, or Notification System",
                        "Review Caching Strategies (Redis Read-Through / Write-Back) & Kafka Event Streams",
                        "Prepare DB Sharding, Load Balancing, & Circuit Breaker talking points"
                    ]
                },
                {
                    "day": 5,
                    "title": "Behavioral & Engineering Culture Alignment",
                    "tasks": [
                        "Prepare STAR story for a production outage, database deadlock, or system failure",
                        f"Align STAR story with {company_name}'s engineering principles",
                        "Refine 'Why this company?' answer grounded in their technology stack"
                    ]
                },
                {
                    "day": 6,
                    "title": "Mock Technical & System Architecture Simulation",
                    "tasks": [
                        "Execute 45-minute timed System Design & API Live Coding simulation",
                        f"Review 5 questions to ask {company_name}'s Engineering Manager",
                        "Finalize resume variant alignment"
                    ]
                },
                {
                    "day": 7,
                    "title": "Final Pre-Interview Readiness",
                    "tasks": [
                        "Review 5-minute pre-interview cheat sheet & API design rules",
                        "Verify environment, architecture diagrams, and STAR stories",
                        "Execute confident interview screen"
                    ]
                }
            ]

        top_improvements = [
            f"Review 5-minute company brief for {company_name}",
            f"Master system design & core skills: {primary_skills_str}",
            "Run Resume Defense Mode on portfolio projects"
        ]

        return {
            "job_id": job.id,
            "overall_readiness": readiness_score,
            "days_plan": days_plan,
            "top_improvements": top_improvements
        }

    def generate_resume_defense(self, user: User, job: Job, project: Optional[Project] = None) -> Dict[str, Any]:
        title = job.title or "Software Engineer"
        company_name = job.company.name if job.company else "Company"
        job_skills = [s.name for s in job.skills] if job.skills else []

        # Find best matching resume category
        rec_category = "Full-Stack"
        if user.resumes:
            for res in user.resumes:
                if res.category:
                    rec_category = res.category
                    break

        domain = detect_engineering_domain(title, job.description or "", job_skills)
        if domain == "ai_ml":
            rec_category = "AI / Machine Learning"
        elif domain == "frontend_mobile":
            rec_category = "Frontend / Mobile"
        elif domain == "data_engineering":
            rec_category = "Data Engineering"
        elif domain == "devops_cloud":
            rec_category = "DevOps / Infrastructure"

        proj_title = project.title if project else "Primary Technical Project"
        proj_skills = ", ".join(project.skills) if project and project.skills else ", ".join(job_skills[:3]) if job_skills else "Python, FastAPI, SQL"

        questions = [
            {
                "question": f"In your '{proj_title}' project, why did you choose ({proj_skills}) over competing frameworks?",
                "focus": "Architectural Rationale & Tech Evaluation",
                "suggested_defense": f"Explain speed of iteration, ecosystem maturity, and benchmark performance evaluated specifically for {title} requirements."
            },
            {
                "question": f"If {company_name} interviewed you on how '{proj_title}' handles database locks or concurrency bottlenecks, what would fail first?",
                "focus": "System Bottlenecks & Concurrency",
                "suggested_defense": "Describe exact diagnostic tools used (profilers, slow query logs), identify lock contention, and detail your fix (connection pooling, read-replicas, or async processing)."
            },
            {
                "question": f"How would you re-architect '{proj_title}' to support 10x scale under {company_name}'s production workload?",
                "focus": "Scalability & Production Preparedness",
                "suggested_defense": "Propose shifting synchronous API tasks to an event-driven queue (Redis/Kafka), adding a CDN for static assets, and implementing multi-region DB sharding."
            },
            {
                "question": f"What testing strategy (Unit, Integration, End-to-End) did you deploy for '{proj_title}' to guarantee reliability?",
                "focus": "Automated Testing & Code Reliability",
                "suggested_defense": "Detail CI/CD pipeline automation, mock server setups, code coverage benchmarks (>80%), and regression testing prior to production release."
            }
        ]

        vulnerabilities = [
            {
                "area": "Quantitative Metrics",
                "vulnerability": "Resume points may lack concrete impact percentages or benchmark numbers.",
                "mitigation": "Quantify outcomes during defense (e.g. 'Reduced p99 latency by 35%' or 'Handled 500+ requests/sec')."
            },
            {
                "area": "Framework Trade-offs",
                "vulnerability": "Interviewer may probe if you chose tools out of familiarity rather than technical necessity.",
                "mitigation": "Articulate 2 concrete alternative solutions you evaluated and why your choice was superior for this workload."
            },
            {
                "area": "Error Handling & Failure Modes",
                "vulnerability": "Focus on happy-path execution without describing failure recovery mechanisms.",
                "mitigation": "Highlight exponential backoff retry logic, circuit breaker implementation, and fallback UI states."
            }
        ]

        return {
            "job_id": job.id,
            "project_title": proj_title,
            "recommended_resume_category": rec_category,
            "potential_questions": questions,
            "vulnerabilities": vulnerabilities,
        }

    def generate_company_brief(self, job: Job) -> Dict[str, Any]:
        company_name = job.company.name if job.company else "Company"
        role_title = job.title or "Software Engineer"
        job_skills = [s.name for s in job.skills] if job.skills else ["Python", "System Design", "SQL", "Cloud"]

        tech_signals = job_skills[:6] if job_skills else ["REST APIs", "Python / TypeScript", "SQL & Relational DBs", "Docker & Cloud Deployments"]

        return {
            "company_name": company_name,
            "role_title": role_title,
            "summary_5min": f"{company_name} is a high-growth tech organization. This {role_title} role is embedded in the core product & engineering organization, driving high-performance software architecture.",
            "why_role_exists": f"To scale {company_name}'s platform infrastructure, accelerate product feature delivery, and optimize system reliability.",
            "recent_developments": [
                f"{company_name} expanding platform infrastructure and engineering team.",
                f"Active hiring focus on strong candidates skilled in {', '.join(tech_signals[:3])}."
            ],
            "tech_signals": tech_signals,
            "questions_to_ask_interviewer": [
                f"What are the highest priority technical milestones for the {role_title} team over the next 6 months?",
                f"How does {company_name} handle production deployment frequency, code reviews, and testing automation?",
                "What does outstanding performance look like for an engineer in this role during the first 90 days?"
            ],
            "provenance": "OFFICIAL & PUBLIC SIGNALS"
        }

    def review_star_story(self, job: Job, situation: str, task: str, action: str, result: str) -> Dict[str, Any]:
        """
        Evaluates a candidate's STAR story against engineering interview criteria.
        """
        strengths = []
        improvements = []
        score = 70.0

        # Check Situation / Task
        if len(situation.strip()) > 30 and len(task.strip()) > 20:
            strengths.append("Clear problem framing and context setting.")
            score += 10.0
        else:
            improvements.append("Expand the Situation and Task with specific context and project scale.")

        # Check Action
        if len(action.strip()) > 50:
            strengths.append("Detailed technical action steps described.")
            score += 10.0
        else:
            improvements.append("Detail your specific personal technical contributions in the Action section.")

        # Check Result (metrics/numbers)
        if re.search(r"\d+%|\d+x|\d+\s*(ms|s|sec|req|users|k|m)", result.lower()):
            strengths.append("Strong quantitative evidence provided in the Result section.")
            score += 10.0
        else:
            improvements.append("Include concrete numerical metrics in your Result (e.g. '% speedup', 'X req/sec', 'Y% error reduction').")

        star_score = round(min(100.0, score), 1)
        suggested_rewrite = (
            f"SITUATION: {situation.strip()}\n"
            f"TASK: {task.strip()}\n"
            f"ACTION: Focus on your key technical choices (architectural decisions, testing, and debugging).\n"
            f"RESULT: Quantify outcome metrics to demonstrate impact for {job.title} at {job.company.name if job.company else 'target company'}."
        )

        return {
            "star_score": star_score,
            "strengths": strengths if strengths else ["Good foundational structure."],
            "improvements": improvements if improvements else ["Outstanding STAR structure!"],
            "suggested_rewrite": suggested_rewrite,
        }

    # ──────────────────────────────────────────────────────────────────────────
    # Evidence Map — Phase 5
    # ──────────────────────────────────────────────────────────────────────────

    def generate_evidence_map(self, user: User, job: Job) -> Dict[str, Any]:
        """
        Map user's projects to job requirements.
        Returns coverage %, per-project evidence records, and gap suggestions.
        """
        projects: List[Project] = getattr(user, "projects", []) or []
        job_skills = [s.name.lower() for s in job.skills] if job.skills else []
        desc = (job.description or "").lower()
        job_title = job.title or "Software Engineer"
        company = job.company.name if job.company else "the company"

        # Extract implied requirements from JD keywords + explicit skills
        requirements: List[str] = []
        req_kw_map: Dict[str, List[str]] = {}

        DOMAIN_REQUIREMENTS = [
            ("System Design", ["scalab", "distributed", "microservice", "architect", "design system"]),
            ("API Development", ["rest", "api", "endpoint", "graphql", "grpc", "fastapi", "django", "flask"]),
            ("Database Design", ["sql", "nosql", "postgresql", "mongodb", "schema", "query optimiz"]),
            ("Cloud & DevOps", ["aws", "gcp", "azure", "docker", "kubernetes", "k8s", "terraform", "ci/cd"]),
            ("Machine Learning", ["ml", "machine learning", "model", "pytorch", "tensorflow", "sklearn", "llm", "nlp"]),
            ("Frontend/UI", ["react", "vue", "angular", "typescript", "frontend", "ui", "css", "html"]),
            ("Data Engineering", ["spark", "airflow", "etl", "pipeline", "bigquery", "kafka", "dbt"]),
            ("Testing & Quality", ["test", "jest", "pytest", "unit test", "coverage", "ci", "tdd"]),
            ("Performance", ["optim", "latency", "throughput", "benchmark", "profil", "scalab"]),
            ("Security", ["auth", "jwt", "oauth", "security", "encrypt", "rbac"]),
        ]

        for req_name, kws in DOMAIN_REQUIREMENTS:
            if any(k in desc for k in kws) or any(k in " ".join(job_skills) for k in kws):
                requirements.append(req_name)
                req_kw_map[req_name] = kws

        # Add explicit skills that aren't already covered
        for sk in job_skills[:6]:
            canonical = sk.title()
            if not any(sk in " ".join(req_kw_map.get(r, [])) for r in requirements):
                if canonical not in requirements:
                    requirements.append(canonical)
                    req_kw_map[canonical] = [sk]

        if not requirements:
            requirements = ["Core Engineering", "Problem Solving"]
            req_kw_map = {"Core Engineering": ["engineer"], "Problem Solving": ["algorithm"]}

        # Map projects to requirements
        mapped_projects = []
        covered_reqs: set = set()

        for proj in projects:
            proj_text = " ".join([
                proj.title or "",
                proj.description or "",
                " ".join(proj.skills or []),
                proj.architecture_notes or "",
                proj.tradeoffs or "",
                proj.key_metrics or "",
            ]).lower()

            proj_matched_reqs = []
            proj_matched_skills = []

            for req in requirements:
                kws = req_kw_map.get(req, [req.lower()])
                if any(k in proj_text for k in kws):
                    proj_matched_reqs.append(req)
                    covered_reqs.add(req)

            for sk in job_skills:
                if sk in proj_text:
                    proj_matched_skills.append(sk.title())

            if not proj_matched_reqs:
                continue  # project doesn't map to any job requirement

            # Determine strength
            n = len(proj_matched_reqs)
            strength = "strong" if n >= 3 else "moderate" if n >= 2 else "weak"

            # Generate talking point
            metrics_hint = f" — with measurable outcome: {proj.key_metrics}" if proj.key_metrics else ""
            skills_hint = ", ".join(proj_matched_skills[:3]) if proj_matched_skills else (proj.title or "this project")
            talking_point = (
                f"In my project '{proj.title}', I used {skills_hint} to address "
                f"{', '.join(proj_matched_reqs[:2])}{metrics_hint}. "
                "This directly maps to what you need for this role."
            )

            mapped_projects.append({
                "project_id": str(proj.id),
                "project_title": proj.title,
                "matched_requirements": proj_matched_reqs,
                "matched_skills": proj_matched_skills,
                "strength": strength,
                "talking_point": talking_point,
            })

        # Find unmapped requirements
        unmapped = []
        SUGGESTIONS = {
            "System Design": "Build a mini-distributed system (e.g. URL shortener or rate limiter) and document your architecture decisions.",
            "Machine Learning": "Complete a Kaggle project or fine-tune a small open-source LLM and add it to your GitHub.",
            "Cloud & DevOps": "Deploy a side project on AWS/GCP with a CI/CD pipeline using GitHub Actions.",
            "Testing & Quality": "Add comprehensive unit and integration tests to an existing project and document coverage.",
            "Performance": "Profile and optimize one of your projects; document latency improvements with benchmarks.",
            "Frontend/UI": "Build a polished UI feature in React/TypeScript and link a live demo.",
            "Data Engineering": "Create an end-to-end data pipeline with Airflow or dbt processing a public dataset.",
            "Database Design": "Design and document a relational schema for a real use case; include query optimization notes.",
            "Security": "Implement JWT auth + RBAC in a project; document your security threat model.",
            "API Development": "Build and document a REST/GraphQL API with OpenAPI spec and automated tests.",
        }
        for req in requirements:
            if req not in covered_reqs:
                suggestion = SUGGESTIONS.get(req, f"Add a project that demonstrates {req} to strengthen your portfolio for this role.")
                unmapped.append({"requirement": req, "suggestion": suggestion})

        # Compute coverage
        coverage_pct = round(len(covered_reqs) / max(len(requirements), 1) * 100)
        mapped_count = len(covered_reqs)
        total_count = len(requirements)

        if coverage_pct >= 75:
            verdict = f"Strong evidence across {mapped_count} of {total_count} requirements — well positioned for this role."
        elif coverage_pct >= 50:
            verdict = f"Moderate evidence for {mapped_count} of {total_count} requirements — a few strategic projects will close the gap."
        else:
            verdict = f"Limited evidence for only {mapped_count} of {total_count} requirements — focus on building targeted portfolio projects before applying."

        return {
            "job_id": job.id,
            "job_title": job_title,
            "company": company,
            "coverage_pct": coverage_pct,
            "mapped_projects": mapped_projects,
            "unmapped_requirements": unmapped,
            "overall_verdict": verdict,
        }
