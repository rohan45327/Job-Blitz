"""
Celery task implementations.
"""
from __future__ import annotations
import logging
from typing import List

from app.worker.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.models import Job, Company, Skill, User, PushToken, JobSource
from app.services.ingestion import (
    GreenhouseAdapter, LeverAdapter, AshbyAdapter,
    JobSpyAdapter, RemoteOKAdapter, InternshalaAdapter, WellfoundAdapter,
    RawJob, JobSourceAdapter
)
from app.services.matching import MatchingEngine

logger = logging.getLogger(__name__)

# Source Registry — add new boards here; worker polls every hour
SOURCE_REGISTRY: List[JobSourceAdapter] = [
    # ---- Confirmed Working Greenhouse Boards ----------------------------------
    GreenhouseAdapter("airbnb", "Airbnb", "airbnb.com"),
    GreenhouseAdapter("stripe", "Stripe", "stripe.com"),
    GreenhouseAdapter("cloudflare", "Cloudflare", "cloudflare.com"),
    GreenhouseAdapter("figma", "Figma", "figma.com"),
    GreenhouseAdapter("discord", "Discord", "discord.com"),
    GreenhouseAdapter("postman", "Postman", "postman.com"),
    GreenhouseAdapter("databricks", "Databricks", "databricks.com"),
    GreenhouseAdapter("coinbase", "Coinbase", "coinbase.com"),
    GreenhouseAdapter("airtable", "Airtable", "airtable.com"),
    GreenhouseAdapter("duolingo", "Duolingo", "duolingo.com"),
    GreenhouseAdapter("reddit", "Reddit", "reddit.com"),
    GreenhouseAdapter("brex", "Brex", "brex.com"),
    GreenhouseAdapter("intercom", "Intercom", "intercom.com"),
    # ---- AI / SaaS (Ashby) ----------------------------------------------------
    AshbyAdapter("openai", "OpenAI", "openai.com"),
    AshbyAdapter("anthropic", "Anthropic", "anthropic.com"),
    AshbyAdapter("linear", "Linear", "linear.app"),
    AshbyAdapter("notion", "Notion", "notion.so"),
    AshbyAdapter("vercel", "Vercel", "vercel.com"),
    AshbyAdapter("supabase", "Supabase", "supabase.com"),
    AshbyAdapter("canva", "Canva", "canva.com"),
    AshbyAdapter("rippling", "Rippling", "rippling.com"),
    AshbyAdapter("ramp", "Ramp", "ramp.com"),
    AshbyAdapter("plaid", "Plaid", "plaid.com"),
    AshbyAdapter("retool", "Retool", "retool.com"),
    AshbyAdapter("mercury", "Mercury", "mercury.com"),
    AshbyAdapter("faire", "Faire", "faire.com"),
    # ---- Lever ----------------------------------------------------------------
    LeverAdapter("palantir", "Palantir", "palantir.com"),
    # ---- Indian MNCs via targeted LinkedIn searches ---------------------------
    JobSpyAdapter(search_term="software engineer Google", location="India", site_names=["linkedin"], results_wanted=50),
    JobSpyAdapter(search_term="software engineer Microsoft", location="India", site_names=["linkedin"], results_wanted=50),
    JobSpyAdapter(search_term="software engineer Amazon", location="India", site_names=["linkedin"], results_wanted=50),
    JobSpyAdapter(search_term="software engineer Deloitte", location="India", site_names=["linkedin"], results_wanted=50),
    JobSpyAdapter(search_term="software engineer Wipro", location="India", site_names=["linkedin"], results_wanted=50),
    JobSpyAdapter(search_term="software engineer Infosys", location="India", site_names=["linkedin"], results_wanted=50),
    JobSpyAdapter(search_term="software engineer TCS", location="India", site_names=["linkedin"], results_wanted=50),
    JobSpyAdapter(search_term="software engineer HCL", location="India", site_names=["linkedin"], results_wanted=50),
    JobSpyAdapter(search_term="software engineer Accenture", location="India", site_names=["linkedin"], results_wanted=50),
    JobSpyAdapter(search_term="software engineer Capgemini", location="India", site_names=["linkedin"], results_wanted=50),
    JobSpyAdapter(search_term="software engineer Flipkart", location="India", site_names=["linkedin"], results_wanted=50),
    JobSpyAdapter(search_term="software engineer Razorpay", location="India", site_names=["linkedin"], results_wanted=50),
    JobSpyAdapter(search_term="software engineer Freshworks", location="India", site_names=["linkedin"], results_wanted=50),
    JobSpyAdapter(search_term="software engineer PhonePe", location="India", site_names=["linkedin"], results_wanted=50),
    # ---- General sweeps -------------------------------------------------------
    JobSpyAdapter(search_term="software engineer intern", location="India", site_names=["linkedin", "indeed"], results_wanted=100),
    JobSpyAdapter(search_term="machine learning engineer", location="India", site_names=["linkedin"], results_wanted=100),
    JobSpyAdapter(search_term="backend engineer", location="India", site_names=["linkedin", "indeed"], results_wanted=100),
    JobSpyAdapter(search_term="full stack developer", location="India", site_names=["linkedin", "indeed"], results_wanted=100),
    JobSpyAdapter(search_term="summer internship software", location="India", site_names=["linkedin", "indeed"], results_wanted=100),
    # ---- Internshala / RemoteOK / Wellfound -----------------------------------
    RemoteOKAdapter(),
    InternshalaAdapter(),
    WellfoundAdapter(),
]


@celery_app.task(name="app.worker.tasks.run_ingestion", bind=True, max_retries=3)
def run_ingestion(self):
    """Fetch jobs from all registered sources, normalise and store."""
    db = SessionLocal()
    try:
        total_new = 0
        seen_keys = set()
        for adapter in SOURCE_REGISTRY:
            raw_jobs: List[RawJob] = adapter.fetch_jobs()
            logger.info(f"[{adapter.source_name}] fetched {len(raw_jobs)} jobs")

            for rj in raw_jobs:
                key = (adapter.source_name, rj.external_id)
                if key in seen_keys:
                    continue

                # Upsert company
                company = db.query(Company).filter(
                    Company.name == rj.company_name
                ).first()
                if not company:
                    company = Company(
                        name=rj.company_name,
                        domain=rj.company_domain,
                        source_type=adapter.source_name,
                    )
                    db.add(company)
                    db.flush()

                # Deduplication: check by source + external_id
                existing = db.query(Job).filter(
                    Job.source == adapter.source_name,
                    Job.external_id == rj.external_id,
                ).first()
                if existing:
                    # Update title/location in case it changed
                    existing.title = rj.title
                    existing.location = rj.location
                    existing.work_type = rj.work_type
                    seen_keys.add(key)
                    continue

                seen_keys.add(key)

                # Resolve/create skills
                skill_objs = []
                for skill_name in rj.skills:
                    skill = db.query(Skill).filter(Skill.name == skill_name).first()
                    if not skill:
                        skill = Skill(name=skill_name)
                        db.add(skill)
                        db.flush()
                    skill_objs.append(skill)

                job = Job(
                    company_id=company.id,
                    source=adapter.source_name,
                    external_id=rj.external_id,
                    title=rj.title,
                    description=rj.description,
                    location=rj.location,
                    work_type=rj.work_type,
                    experience_level=rj.experience_level,
                    salary_min=rj.salary_min,
                    salary_max=rj.salary_max,
                    salary_currency=rj.salary_currency,
                    apply_url=rj.apply_url,
                    posted_at=rj.posted_at,
                    raw_data=rj.raw_data,
                )
                job.skills = skill_objs
                db.add(job)
                total_new += 1

        db.commit()
        logger.info(f"Ingestion complete. {total_new} new jobs stored.")
        return {"new_jobs": total_new}
    except Exception as e:
        db.rollback()
        logger.error(f"Ingestion failed: {e}")
        raise self.retry(exc=e, countdown=60)
    finally:
        db.close()


@celery_app.task(name="app.worker.tasks.run_matching")
def run_matching():
    """
    For every active user, find new jobs since last match run and
    compute match scores. Trigger push if score >= 0.75.
    """
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.is_active == True).all()
        engine = MatchingEngine(db)
        notifications = []

        for user in users:
            # Only score jobs the user hasn't interacted with yet
            applied_job_ids = {app.job_id for app in user.applications}
            new_jobs = (
                db.query(Job)
                .filter(Job.is_active == True, Job.id.notin_(applied_job_ids))
                .limit(200)  # cap per user per run
                .all()
            )

            top_matches = []
            for job in new_jobs:
                score, _ = engine.score_job(user, job)
                if score >= 0.75:
                    top_matches.append((score, job))

            top_matches.sort(key=lambda x: x[0], reverse=True)
            if top_matches:
                notifications.append((user, top_matches[:3]))

        db.close()

        # Fire push notifications for top matches
        for user, matches in notifications:
            send_push_notifications.delay(
                user_id=str(user.id),
                job_ids=[str(j.id) for _, j in matches],
                scores=[round(s, 2) for s, _ in matches],
            )

        logger.info(f"Matching complete. Notified {len(notifications)} users.")
        return {"users_processed": len(users), "users_notified": len(notifications)}
    except Exception as e:
        logger.error(f"Matching run failed: {e}")
        db.close()
        raise


@celery_app.task(name="app.worker.tasks.send_push_notifications")
def send_push_notifications(user_id: str, job_ids: List[str], scores: List[float]):
    """Send FCM push notification to a specific user about top job matches."""
    db = SessionLocal()
    try:
        tokens = (
            db.query(PushToken)
            .filter(PushToken.user_id == user_id)
            .all()
        )
        if not tokens:
            return

        jobs = db.query(Job).filter(Job.id.in_(job_ids)).all()
        job_titles = [j.title for j in jobs]

        if len(job_titles) == 1:
            body = f"New match: {job_titles[0]} ({int(scores[0]*100)}% match)"
        else:
            body = f"{len(job_titles)} new high-matching jobs found for you!"

        from app.services.push_service import PushService
        push = PushService()
        for token_obj in tokens:
            push.send(
                token=token_obj.token,
                title="⚡ JobBlitz Match",
                body=body,
                data={"job_ids": job_ids},
            )

        logger.info(f"Push sent to user {user_id}: {body}")
    except Exception as e:
        logger.error(f"Push notification failed: {e}")
    finally:
        db.close()


@celery_app.task(name="app.worker.tasks.cleanup_old_jobs")
def cleanup_old_jobs():
    """Delete jobs older than 1 week that haven't been applied to by any user."""
    from datetime import datetime, timezone, timedelta
    from sqlalchemy import or_, and_
    from app.models.models import Application
    db = SessionLocal()
    try:
        one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        applied_job_ids = [r[0] for r in db.query(Application.job_id).distinct().all()]
        
        query = db.query(Job).filter(
            or_(
                and_(Job.posted_at.isnot(None), Job.posted_at < one_week_ago),
                and_(Job.posted_at.is_(None), Job.created_at < one_week_ago)
            ),
            Job.id.notin_(applied_job_ids)
        )
        
        deleted_count = query.delete(synchronize_session=False)
        db.commit()
        logger.info(f"Cleanup complete. Deleted {deleted_count} jobs older than 1 week.")
        return {"deleted_jobs": deleted_count}
    except Exception as e:
        db.rollback()
        logger.error(f"Cleanup failed: {e}")
        raise
    finally:
        db.close()
