from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api import deps
from app.models.employee_ai_insights import EmployeeAIInsights
from app.models.user import User, UserRole
from app.models.sale_v2 import SaleV2
from app.models.attendance import Attendance, AttendanceStatus
from app.core.exceptions import handle_not_found_error, handle_permission_error, handle_generic_error
from app.services.openai_service import openai_service
from app.services.logging import get_logger
from datetime import datetime, date, timedelta
import json

router = APIRouter()
logger = get_logger(__name__)


def fetch_employee_sales_data(db: Session, employee_id: int, month: date) -> Dict[str, Any]:
    """
    Fetch real sales data for employee for the given month.
    
    Args:
        db: Database session
        employee_id: Employee user ID
        month: Month to fetch data for (first day of month)
    
    Returns:
        Dictionary with sales statistics
    """
    # Calculate month range
    next_month = (month.replace(day=28) + timedelta(days=4)).replace(day=1)
    
    # Query sales for this employee in this month
    sales_query = db.query(SaleV2).filter(
        SaleV2.cashier_id == employee_id,
        SaleV2.created_at >= month,
        SaleV2.created_at < next_month,
        SaleV2.status == "completed"
    )
    
    total_sales = db.query(func.sum(SaleV2.total_amount)).filter(
        SaleV2.cashier_id == employee_id,
        SaleV2.created_at >= month,
        SaleV2.created_at < next_month,
        SaleV2.status == "completed"
    ).scalar() or 0
    
    transaction_count = sales_query.count()
    avg_check = total_sales / transaction_count if transaction_count > 0 else 0
    
    return {
        "total_sales": float(total_sales),
        "transactions": transaction_count,
        "avg_check": float(avg_check),
    }


def fetch_employee_attendance_data(db: Session, employee_id: int, month: date) -> Dict[str, Any]:
    """
    Fetch real attendance data for employee for the given month.
    
    Args:
        db: Database session
        employee_id: Employee user ID
        month: Month to fetch data for (first day of month)
    
    Returns:
        Dictionary with attendance statistics
    """
    # Calculate month range
    next_month = (month.replace(day=28) + timedelta(days=4)).replace(day=1)
    
    # Query attendance records
    attendance_records = db.query(Attendance).filter(
        Attendance.user_id == employee_id,
        Attendance.date >= month,
        Attendance.date < next_month
    ).all()
    
    # Calculate statistics
    total_days = len(attendance_records)
    late_count = sum(1 for a in attendance_records if a.status == AttendanceStatus.LATE)
    
    # Calculate total hours worked (if check_in/check_out times are available)
    total_hours = 0
    for record in attendance_records:
        if record.check_in_time and record.check_out_time:
            delta = record.check_out_time - record.check_in_time
            total_hours += delta.total_seconds() / 3600
    
    # If no time data, estimate based on working days (8 hours per day)
    if total_hours == 0 and total_days > 0:
        total_hours = total_days * 8
    
    return {
        "hours_worked": round(total_hours, 1),
        "lateness": late_count,
        "working_days": total_days,
    }


@router.post("/generate/{employee_id}")
async def generate_employee_insights(
    employee_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Generate AI insights for a specific employee. Owner only.
    
    Fetches real sales and attendance data from database.
    """
    # Permission check (role is now a string)
    if current_user.role not in ["owner", "super_admin"]:
        raise handle_permission_error("Bu funksiyani faqat egasi yoki super admin ishlata oladi")

    # Get employee
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise handle_not_found_error("Xodim", employee_id)

    try:
        # Get current month (first day)
        current_month = date.today().replace(day=1)
        
        # Fetch real data from database
        sales_data = fetch_employee_sales_data(db, employee_id, current_month)
        attendance_data = fetch_employee_attendance_data(db, employee_id, current_month)
        
        # Combine data
        combined_data = {**sales_data, **attendance_data}
        
        logger.info(f"Fetched employee data for {employee_id}: {combined_data}")

        prompt = f"""
    Xodim tahlili: {employee.full_name or employee.username}
    Lavozimi: {employee.role}
    
    Ma'lumotlar (Oylik - {current_month.strftime('%Y-%m')}):
    - Savdo: {combined_data['total_sales']:,.0f} so'm
    - Tranzaksiyalar: {combined_data['transactions']}
    - O'rtacha chek: {combined_data['avg_check']:,.0f} so'm
    - Ishlagan soati: {combined_data['hours_worked']} soat
    - Kechikishlar: {combined_data['lateness']} marta
    - Ishlagan kunlar: {combined_data.get('working_days', 0)}
    
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

        # Generate AI insights
        response = openai_service.client.chat.completions.create(
            model=openai_service.model,
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
        
        # Create insight record
        insight = EmployeeAIInsights(
            user_id=employee_id,
            month=current_month,
            performance_score=ai_data.get("score", 0),
            recommendations=ai_data.get("recommendations", []),
            bonus_suggestion=ai_data.get("bonus", 0),
            generated_at=datetime.utcnow()
        )
        db.add(insight)
        db.commit()
        db.refresh(insight)
        
        logger.info(f"Generated AI insights for employee {employee_id}, score: {insight.performance_score}")
        return insight
        
    except HTTPException:
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response: {e}")
        raise handle_generic_error(e, context="AI javobini tahlil qilish")
    except Exception as e:
        raise handle_generic_error(e, context="Xodim tahlili yaratish")

@router.get("/{employee_id}")
def get_employee_insights(
    employee_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get latest AI insights for employee.
    
    Employees can view their own insights, owners can view any employee's insights.
    """
    # Permission check: employee can view own, owner can view any (role is now a string)
    if current_user.role not in ["owner", "super_admin"] and current_user.id != employee_id:
        raise handle_permission_error("Siz faqat o'z tahlilingizni ko'rishingiz mumkin")
    
    # Check if employee exists
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise handle_not_found_error("Xodim", employee_id)
        
    insight = db.query(EmployeeAIInsights).filter(
        EmployeeAIInsights.user_id == employee_id
    ).order_by(EmployeeAIInsights.generated_at.desc()).first()
    
    if not insight:
        raise handle_not_found_error("Xodim tahlili", employee_id)
    
    return insight
