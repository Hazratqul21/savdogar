from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

router = APIRouter()

# Schemas
class EmployeeCreate(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    password: str
    role: UserRole
    full_name: str
    phone_number: Optional[str] = None
    pin_code: Optional[str] = None  # 4 digits
    
class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    birth_date: Optional[date] = None
    passport_data: Optional[str] = None
    job_title: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class EmployeeResponse(BaseModel):
    id: int
    username: str
    email: Optional[str]
    role: UserRole
    is_active: bool
    full_name: Optional[str]
    phone_number: Optional[str]
    job_title: Optional[str]
    hired_date: Optional[date]
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[EmployeeResponse])
def read_employees(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve employees. Only for Owner/Manager.
    """
    if current_user.role not in [UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    employees = db.query(User).filter(User.role != UserRole.SUPER_ADMIN).offset(skip).limit(limit).all()
    return employees

@router.post("/", response_model=EmployeeResponse)
def create_employee(
    employee_in: EmployeeCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new employee. Only for Owner.
    """
    if current_user.role not in [UserRole.OWNER, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    user = db.query(User).filter(User.username == employee_in.username).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
        
    hashed_password = get_password_hash(employee_in.password)
    pin_hash = get_password_hash(employee_in.pin_code) if employee_in.pin_code else None
    
    db_obj = User(
        username=employee_in.username,
        email=employee_in.email,
        hashed_password=hashed_password,
        role=employee_in.role,
        full_name=employee_in.full_name,
        phone_number=employee_in.phone_number,
        pin_code_hash=pin_hash,
        is_active=True
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/{employee_id}", response_model=EmployeeResponse)
def read_employee(
    employee_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get employee by ID.
    """
    user = db.query(User).filter(User.id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if current_user.role not in [UserRole.OWNER, UserRole.MANAGER, UserRole.SUPER_ADMIN] and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    return user

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    employee_in: EmployeeUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update employee.
    """
    user = db.query(User).filter(User.id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if current_user.role not in [UserRole.OWNER, UserRole.SUPER_ADMIN] and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    update_data = employee_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
        
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
