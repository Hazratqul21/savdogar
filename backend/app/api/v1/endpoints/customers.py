from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.models import Customer, CustomerTransaction, User
from app.schemas import customer as customer_schema
from app.services.ai_service import ai_service

router = APIRouter()

@router.get("/", response_model=List[customer_schema.Customer])
def read_customers(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List customers."""
    query = db.query(Customer)
    if search:
        query = query.filter(
            (Customer.name.ilike(f"%{search}%")) | 
            (Customer.phone.ilike(f"%{search}%"))
        )
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=customer_schema.Customer)
def create_customer(
    *,
    db: Session = Depends(deps.get_db),
    customer_in: customer_schema.CustomerCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create customer."""
    # Check if phone exists
    existing = db.query(Customer).filter(Customer.phone == customer_in.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    customer = Customer(**customer_in.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.get("/{id}", response_model=customer_schema.Customer)
def read_customer(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get customer by ID."""
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.put("/{id}", response_model=customer_schema.Customer)
def update_customer(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    customer_in: customer_schema.CustomerUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update customer."""
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = customer_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/{id}")
def delete_customer(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Delete customer."""
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(customer)
    db.commit()
    return {"message": "Customer deleted"}

@router.get("/{id}/history", response_model=List[customer_schema.CustomerTransaction])
def get_customer_history(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get customer transaction history."""
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    transactions = db.query(CustomerTransaction).filter(
        CustomerTransaction.customer_id == id
    ).order_by(CustomerTransaction.created_at.desc()).all()
    return transactions

@router.get("/{id}/insights")
async def get_customer_insights(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get AI-generated customer insights."""
    try:
        summary = await ai_service.analyze_customer_habits(id, db)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/loyalty-points/add", response_model=customer_schema.Customer)
def add_loyalty_points(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    points_in: customer_schema.LoyaltyPointsAdd,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Add loyalty points to customer."""
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer.loyalty_points += points_in.points
    
    # Record transaction
    transaction = CustomerTransaction(
        customer_id=id,
        amount=0,
        points_earned=points_in.points,
        points_used=0,
        transaction_type="points_add",
    )
    db.add(transaction)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.post("/{id}/loyalty-points/use", response_model=customer_schema.Customer)
def use_loyalty_points(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    points_in: customer_schema.LoyaltyPointsUse,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Use loyalty points."""
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if customer.loyalty_points < points_in.points:
        raise HTTPException(status_code=400, detail="Insufficient loyalty points")
    
    customer.loyalty_points -= points_in.points
    
    # Record transaction
    transaction = CustomerTransaction(
        customer_id=id,
        amount=0,
        points_earned=0,
        points_used=points_in.points,
        transaction_type="points_use",
    )
    db.add(transaction)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer
