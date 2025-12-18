"""
AI Chatbot API Endpoints
"""

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.services.ai_chatbot import (
    chat_with_ai,
    get_quick_answers
)
from pydantic import BaseModel

router = APIRouter()


class ChatMessage(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = None


@router.post("/chat")
def chat(
    chat_data: ChatMessage,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    organization_id: Optional[int] = Depends(deps.get_user_organization),
) -> Any:
    """
    Chat with AI assistant.
    """
    try:
        response = chat_with_ai(
            db,
            chat_data.message,
            organization_id,
            chat_data.conversation_history
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Xatolik: {str(e)}")


@router.get("/quick/{question_type}")
def quick_answer(
    question_type: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    organization_id: Optional[int] = Depends(deps.get_user_organization),
) -> Any:
    """
    Get quick answer for common questions.
    question_type: today_sales, low_stock, top_products
    """
    try:
        answer = get_quick_answers(db, question_type, organization_id)
        return answer
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Xatolik: {str(e)}")



