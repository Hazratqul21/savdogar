from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.employee_ai_insights import EmployeeAIInsights
from app.models.user import User, UserRole
from app.services.openai_service import openai_service
from datetime import datetime, date
import json

router = APIRouter()

@router.post("/generate/{employee_id}")
async def generate_employee_insights(
    employee_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Generate AI insights for a specific employee. Owner only.
    """
    if current_user.role not in [UserRole.OWNER, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Gather data for AI
    # TODO: Fetch real sales data and attendance
    sales_data = {
        "total_sales": 15000000,
        "transactions": 120,
        "avg_check": 125000,
        "hours_worked": 160,
        "lateness": 2
    }

    prompt = f"""
    Xodim tahlili: {employee.full_name}
    Lavozimi: {employee.role}
    
    Ma'lumotlar (Oylik):
    - Savdo: {sales_data['total_sales']} so'm
    - Tranzaksiyalar: {sales_data['transactions']}
    - O'rtacha chek: {sales_data['avg_check']} so'm
    - Ishlagan soati: {sales_data['hours_worked']} soat
    - Kechikishlar: {sales_data['lateness']} marta
    
    Vazifa:
    1. Samaradorlik bali (0-100)
    2. 3 ta asosiy tavsiya
    3. Bonus tavsiyasi (so'mda)
    
    JSON formatda qaytar:
    {{
        "score": 85,
        "recommendations": ["...", "...", "..."],
        "bonus": 500000
    }}
    """

    try:
        response = openai_service.client.chat.completions.create(
            model=openai_service.deployment_name,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        ai_data = json.loads(content)
        
        insight = EmployeeAIInsights(
            user_id=employee_id,
            month=date.today().replace(day=1),
            performance_score=ai_data.get("score", 0),
            recommendations=ai_data.get("recommendations", []),
            bonus_suggestion=ai_data.get("bonus", 0),
            generated_at=datetime.utcnow()
        )
        db.add(insight)
        db.commit()
        db.refresh(insight)
        
        return insight
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{employee_id}")
def get_employee_insights(
    employee_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get latest AI insights for employee
    """
    if current_user.role not in [UserRole.OWNER, UserRole.SUPER_ADMIN] and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    insight = db.query(EmployeeAIInsights).filter(
        EmployeeAIInsights.user_id == employee_id
    ).order_by(EmployeeAIInsights.generated_at.desc()).first()
    
    return insight
