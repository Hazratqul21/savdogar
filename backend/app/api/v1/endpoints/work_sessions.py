from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.work_session import WorkSession, SessionStatus
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class SessionResponse(BaseModel):
    id: int
    start_time: datetime
    end_time: datetime | None
    status: SessionStatus
    total_minutes: float
    
    class Config:
        from_attributes = True

@router.post("/clock-in", response_model=SessionResponse)
def clock_in(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Start work session (Clock In)
    """
    # Check if already active
    active_session = db.query(WorkSession).filter(
        WorkSession.user_id == current_user.id,
        WorkSession.status == SessionStatus.ACTIVE
    ).first()
    
    if active_session:
        raise HTTPException(status_code=400, detail="You already have an active session")
        
    session = WorkSession(
        user_id=current_user.id,
        start_time=datetime.utcnow(),
        status=SessionStatus.ACTIVE
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.post("/clock-out", response_model=SessionResponse)
def clock_out(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    End work session (Clock Out)
    """
    active_session = db.query(WorkSession).filter(
        WorkSession.user_id == current_user.id,
        WorkSession.status == SessionStatus.ACTIVE
    ).first()
    
    if not active_session:
        raise HTTPException(status_code=400, detail="No active session found")
        
    end_time = datetime.utcnow()
    duration = (end_time - active_session.start_time).total_seconds() / 60
    
    active_session.end_time = end_time
    active_session.status = SessionStatus.COMPLETED
    active_session.total_minutes = duration
    
    db.commit()
    db.refresh(active_session)
    return active_session

@router.get("/active", response_model=Optional[SessionResponse])
def get_active_session(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current active session
    """
    active_session = db.query(WorkSession).filter(
        WorkSession.user_id == current_user.id,
        WorkSession.status == SessionStatus.ACTIVE
    ).first()
    return active_session
