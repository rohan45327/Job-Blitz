from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.models import User, Watchlist, Company, PushToken
from app.schemas.schemas import WatchlistAdd, WatchlistOut, PushTokenRegister

router = APIRouter(prefix="/watchlist", tags=["watchlist"])
push_router = APIRouter(prefix="/push", tags=["push"])


# ─── Watchlist ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[WatchlistOut])
def get_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Watchlist).filter(Watchlist.user_id == current_user.id).all()


@router.post("/", response_model=WatchlistOut, status_code=status.HTTP_201_CREATED)
def add_to_watchlist(
    payload: WatchlistAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = db.query(Company).filter(Company.id == payload.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    existing = (
        db.query(Watchlist)
        .filter(Watchlist.user_id == current_user.id, Watchlist.company_id == payload.company_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Already in watchlist")

    entry = Watchlist(user_id=current_user.id, company_id=payload.company_id)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{company_id}", status_code=204)
def remove_from_watchlist(
    company_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = (
        db.query(Watchlist)
        .filter(Watchlist.user_id == current_user.id, Watchlist.company_id == company_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Not in watchlist")
    db.delete(entry)
    db.commit()


# ─── Push Tokens ───────────────────────────────────────────────────────────────

@push_router.post("/register", status_code=201)
def register_push_token(
    payload: PushTokenRegister,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(PushToken).filter(PushToken.token == payload.token).first()
    if existing:
        return {"message": "Token already registered"}

    token = PushToken(user_id=current_user.id, token=payload.token, platform=payload.platform)
    db.add(token)
    db.commit()
    return {"message": "Token registered"}


@push_router.delete("/register/{token}", status_code=204)
def unregister_push_token(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = (
        db.query(PushToken)
        .filter(PushToken.token == token, PushToken.user_id == current_user.id)
        .first()
    )
    if entry:
        db.delete(entry)
        db.commit()
