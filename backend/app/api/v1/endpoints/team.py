"""
Team Management API
====================
Jamoa a'zolarini boshqarish: qo'shish, o'zgartirish, o'chirish.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.core.security import get_password_hash
from app.core.permissions import check_permission, get_role_label, get_role_permissions, ROLE_LABELS

router = APIRouter()


# =============================================================================
# Schemas
# =============================================================================

class TeamMemberCreate(BaseModel):
    """Yangi jamoa a'zosi yaratish"""
    username: str
    password: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    role: str = "cashier"  # cashier, manager, warehouse_manager


class TeamMemberUpdate(BaseModel):
    """Jamoa a'zosini yangilash"""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class TeamMemberResponse(BaseModel):
    """Jamoa a'zosi response"""
    id: int
    username: str
    email: Optional[str]
    full_name: Optional[str]
    phone_number: Optional[str]
    role: str
    role_label: str
    is_active: bool
    created_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# =============================================================================
# Endpoints
# =============================================================================

@router.get("", response_model=List[TeamMemberResponse])
async def get_team_members(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Jamoa a'zolari ro'yxati.
    Faqat owner va manager ko'rishi mumkin.
    """
    check_permission(current_user, "team")
    
    # Get all users in the same tenant
    members = db.query(User).filter(
        User.tenant_id == current_user.tenant_id,
        User.id != current_user.id  # Exclude current user
    ).order_by(User.created_at.desc()).all()
    
    result = []
    for member in members:
        result.append(TeamMemberResponse(
            id=member.id,
            username=member.username,
            email=member.email,
            full_name=member.full_name,
            phone_number=member.phone_number,
            role=member.role.value if member.role else "cashier",
            role_label=get_role_label(member.role) if member.role else "Kassir",
            is_active=member.is_active,
            created_at=member.created_at if hasattr(member, 'created_at') else None
        ))
    
    return result


@router.post("", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
async def create_team_member(
    member_data: TeamMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Yangi jamoa a'zosi qo'shish.
    Faqat owner qo'shishi mumkin.
    """
    check_permission(current_user, "team.invite")
    
    # Check tenant limits
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi")
    
    current_user_count = db.query(User).filter(
        User.tenant_id == current_user.tenant_id,
        User.is_active == True
    ).count()
    
    if current_user_count >= tenant.max_users:
        raise HTTPException(
            status_code=400,
            detail=f"Foydalanuvchilar limiti tugadi. Maksimum: {tenant.max_users}"
        )
    
    # Check if username exists
    existing_user = db.query(User).filter(User.username == member_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu username band")
    
    # Check if email exists
    if member_data.email:
        existing_email = db.query(User).filter(User.email == member_data.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Bu email band")
    
    # Parse role
    try:
        role = UserRole(member_data.role.lower())
    except ValueError:
        role = UserRole.CASHIER
    
    # Don't allow creating super_admin or owner
    if role in [UserRole.SUPER_ADMIN, UserRole.OWNER]:
        raise HTTPException(status_code=400, detail="Bu rolni berish mumkin emas")
    
    # Create user
    new_user = User(
        username=member_data.username,
        email=member_data.email,
        hashed_password=get_password_hash(member_data.password),
        full_name=member_data.full_name,
        phone_number=member_data.phone_number,
        role=role,
        tenant_id=current_user.tenant_id,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return TeamMemberResponse(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        full_name=new_user.full_name,
        phone_number=new_user.phone_number,
        role=new_user.role.value,
        role_label=get_role_label(new_user.role),
        is_active=new_user.is_active,
        created_at=None
    )


@router.patch("/{member_id}", response_model=TeamMemberResponse)
async def update_team_member(
    member_id: int,
    update_data: TeamMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Jamoa a'zosini yangilash.
    Faqat owner o'zgartirishi mumkin.
    """
    check_permission(current_user, "team.edit")
    
    # Get member
    member = db.query(User).filter(
        User.id == member_id,
        User.tenant_id == current_user.tenant_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Xodim topilmadi")
    
    # Can't edit yourself
    if member.id == current_user.id:
        raise HTTPException(status_code=400, detail="O'zingizni o'zgartira olmaysiz")
    
    # Can't edit owner
    if member.role == UserRole.OWNER:
        raise HTTPException(status_code=400, detail="Egasini o'zgartirish mumkin emas")
    
    # Update fields
    if update_data.full_name is not None:
        member.full_name = update_data.full_name
    if update_data.email is not None:
        member.email = update_data.email
    if update_data.phone_number is not None:
        member.phone_number = update_data.phone_number
    if update_data.is_active is not None:
        member.is_active = update_data.is_active
    
    # Update role
    if update_data.role is not None:
        try:
            new_role = UserRole(update_data.role.lower())
            if new_role not in [UserRole.SUPER_ADMIN, UserRole.OWNER]:
                member.role = new_role
        except ValueError:
            pass  # Keep existing role
    
    db.commit()
    db.refresh(member)
    
    return TeamMemberResponse(
        id=member.id,
        username=member.username,
        email=member.email,
        full_name=member.full_name,
        phone_number=member.phone_number,
        role=member.role.value,
        role_label=get_role_label(member.role),
        is_active=member.is_active,
        created_at=None
    )


@router.delete("/{member_id}")
async def delete_team_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Jamoa a'zosini o'chirish (deactivate).
    Faqat owner o'chirishi mumkin.
    """
    check_permission(current_user, "team.delete")
    
    # Get member
    member = db.query(User).filter(
        User.id == member_id,
        User.tenant_id == current_user.tenant_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Xodim topilmadi")
    
    # Can't delete yourself
    if member.id == current_user.id:
        raise HTTPException(status_code=400, detail="O'zingizni o'chira olmaysiz")
    
    # Can't delete owner
    if member.role == UserRole.OWNER:
        raise HTTPException(status_code=400, detail="Egasini o'chirish mumkin emas")
    
    # Soft delete - just deactivate
    member.is_active = False
    db.commit()
    
    return {"success": True, "message": "Xodim o'chirildi"}


@router.get("/roles")
async def get_available_roles(
    current_user: User = Depends(get_current_user)
):
    """
    Mavjud rollar va ularning ruxsatlari.
    Onboarding wizard uchun.
    """
    roles = []
    for role in [UserRole.MANAGER, UserRole.CASHIER, UserRole.WAREHOUSE_MANAGER]:
        roles.append({
            "value": role.value,
            "label": get_role_label(role),
            "permissions": get_role_permissions(role)
        })
    
    return {"roles": roles}
