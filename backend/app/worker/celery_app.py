"""
Celery worker + task definitions for JobBlitz background processing.

Tasks:
  - run_ingestion: Fetch jobs from all registered ATS sources
  - run_matching:  Compute match scores for all active users
  - send_push_notifications: Send push alerts to matched users
"""
from __future__ import annotations
import logging
from typing import Optional

from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "jobblitz",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# ─── Beat Schedule ─────────────────────────────────────────────────────────────
celery_app.conf.beat_schedule = {
    "ingest-jobs-every-hour": {
        "task": "app.worker.tasks.run_ingestion",
        "schedule": crontab(minute=0, hour="*"),  # every hour
    },
    "match-jobs-every-hour": {
        "task": "app.worker.tasks.run_matching",
        "schedule": crontab(minute=15, hour="*"),  # 15 mins after ingestion
    },
    "cleanup-jobs-every-hour": {
        "task": "app.worker.tasks.cleanup_old_jobs",
        "schedule": crontab(minute=30, hour="*"),  # 30 mins after ingestion
    },
}
