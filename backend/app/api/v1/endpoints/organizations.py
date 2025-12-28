from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api import deps
from app.models import Organization, User, UserRole

router = APIRouter()

class OrganizationBase(BaseModel):
    name: str
    description: str = None
    address: str = None
    phone: str = None
    email: str = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(OrganizationBase):
    pass

class OrganizationResponse(OrganizationBase):
    id: int
    is_active: bool
    created_at: str
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[OrganizationResponse])
def read_organizations(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List all organizations. Super admin sees all, others see only their own."""
    if current_user.role == UserRole.SUPER_ADMIN:
        organizations = db.query(Organization).filter(
            Organization.is_active == True
        ).offset(skip).limit(limit).all()
    else:
        if not current_user.organization_id:
            return []
        organizations = db.query(Organization).filter(
            Organization.id == current_user.organization_id,
            Organization.is_active == True
        ).offset(skip).limit(limit).all()
    
    return organizations

@router.post("/", response_model=OrganizationResponse)
def create_organization(
    *,
    db: Session = Depends(deps.get_db),
    organization_in: OrganizationCreate,
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Create new organization (admin only)."""
    organization = Organization(**organization_in.model_dump())
    db.add(organization)
    db.commit()
    db.refresh(organization)
    return organization

@router.get("/{id}", response_model=OrganizationResponse)
def read_organization(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get organization by ID."""
    query = db.query(Organization).filter(Organization.id == id)
    
    # Non-super-admin can only see their own organization
    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.organization_id != id:
            raise HTTPException(status_code=403, detail="Not authorized to view this organization")
        query = query.filter(Organization.is_active == True)
    
    organization = query.first()
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    return organization

@router.put("/{id}", response_model=OrganizationResponse)
def update_organization(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    organization_in: OrganizationUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update organization."""
    query = db.query(Organization).filter(Organization.id == id)
    
    # Non-super-admin can only update their own organization
    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.organization_id != id:
            raise HTTPException(status_code=403, detail="Not authorized to update this organization")
        query = query.filter(Organization.is_active == True)
    
    organization = query.first()
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    for field, value in organization_in.model_dump(exclude_unset=True).items():
        setattr(organization, field, value)
    
    db.add(organization)
    db.commit()
    db.refresh(organization)
    return organization

@router.post("/{id}/assign-user/{user_id}")
def assign_user_to_organization(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    user_id: int,
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Assign user to organization (admin only)."""
    organization = db.query(Organization).filter(Organization.id == id).first()
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.organization_id = id
    db.add(user)
    db.commit()
    
    return {"message": f"User {user.username} assigned to organization {organization.name}"}

