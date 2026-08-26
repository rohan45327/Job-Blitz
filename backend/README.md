# JobBlitz Backend

FastAPI-powered backend for JobBlitz — AI-driven job discovery and application assistant.

## Setup

```bash
python -m venv venv
.\venv\Scripts\activate       # Windows
pip install -r requirements.txt
```

## Run Dev Server

```bash
uvicorn app.main:app --reload --port 8000
```

## Run Workers (Celery)

```bash
celery -A app.worker.celery_app worker --loglevel=info
celery -A app.worker.celery_app beat --loglevel=info
```

## Database Migrations

```bash
alembic upgrade head
```

## Docker (Postgres + Redis)

From the root `/autopin` directory:

```bash
docker-compose up -d
```
