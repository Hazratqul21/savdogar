from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.api import deps
from app.models import Branch, BranchStock, StockTransfer, Product, User, TransferStatus

router = APIRouter()

# Schemas
class BranchBase(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    manager_id: Optional[int] = None

class BranchCreate(BranchBase):
    pass

class BranchUpdate(BranchBase):
    name: Optional[str] = None

class BranchResponse(BranchBase):
    id: int
    is_active: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class TransferCreate(BaseModel):
    from_branch_id: int
    to_branch_id: int
    product_id: int
    quantity: float
    notes: Optional[str] = None

class TransferResponse(BaseModel):
    id: int
    from_branch_id: int
    to_branch_id: int
    product_id: int
    quantity: float
    status: TransferStatus
    notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Branch CRUD
@router.get("/", response_model=List[BranchResponse])
def read_branches(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List all branches."""
    return db.query(Branch).filter(Branch.is_active == 1).all()

@router.post("/", response_model=BranchResponse)
def create_branch(
    *,
    db: Session = Depends(deps.get_db),
    branch_in: BranchCreate,
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Create new branch (admin only)."""
    branch = Branch(**branch_in.model_dump())
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return branch

@router.put("/{id}", response_model=BranchResponse)
def update_branch(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    branch_in: BranchUpdate,
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Update branch."""
    branch = db.query(Branch).filter(Branch.id == id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    for field, value in branch_in.model_dump(exclude_unset=True).items():
        setattr(branch, field, value)
    
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return branch

@router.delete("/{id}")
def delete_branch(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Deactivate branch."""
    branch = db.query(Branch).filter(Branch.id == id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    branch.is_active = 0
    db.commit()
    return {"message": "Branch deactivated"}

# Branch Stock
@router.get("/{branch_id}/stock")
def get_branch_stock(
    *,
    db: Session = Depends(deps.get_db),
    branch_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get stock for a branch."""
    stocks = db.query(BranchStock).filter(BranchStock.branch_id == branch_id).all()
    return [{
        "product_id": s.product_id,
        "product_name": s.product.name if s.product else "Unknown",
        "quantity": s.quantity,
        "min_quantity": s.min_quantity,
    } for s in stocks]

@router.post("/{branch_id}/stock")
def set_branch_stock(
    *,
    db: Session = Depends(deps.get_db),
    branch_id: int,
    product_id: int,
    quantity: float,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Set stock for product in branch."""
    stock = db.query(BranchStock).filter(
        BranchStock.branch_id == branch_id,
        BranchStock.product_id == product_id
    ).first()
    
    if stock:
        stock.quantity = quantity
    else:
        stock = BranchStock(
            branch_id=branch_id,
            product_id=product_id,
            quantity=quantity
        )
        db.add(stock)
    
    db.commit()
    return {"message": "Stock updated"}

# Stock Transfers
@router.get("/transfers/", response_model=List[TransferResponse])
def get_transfers(
    db: Session = Depends(deps.get_db),
    status: TransferStatus = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """List stock transfers."""
    query = db.query(StockTransfer)
    if status:
        query = query.filter(StockTransfer.status == status)
    return query.order_by(StockTransfer.created_at.desc()).all()

@router.post("/transfers/", response_model=TransferResponse)
def create_transfer(
    *,
    db: Session = Depends(deps.get_db),
    transfer_in: TransferCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create stock transfer request."""
    # Verify from_branch has enough stock
    from_stock = db.query(BranchStock).filter(
        BranchStock.branch_id == transfer_in.from_branch_id,
        BranchStock.product_id == transfer_in.product_id
    ).first()
    
    if not from_stock or from_stock.quantity < transfer_in.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock in source branch")
    
    transfer = StockTransfer(
        **transfer_in.model_dump(),
        created_by=current_user.id,
        status=TransferStatus.PENDING
    )
    db.add(transfer)
    db.commit()
    db.refresh(transfer)
    return transfer

@router.post("/transfers/{id}/approve")
def approve_transfer(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Approve and complete stock transfer."""
    transfer = db.query(StockTransfer).filter(StockTransfer.id == id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    if transfer.status != TransferStatus.PENDING:
        raise HTTPException(status_code=400, detail="Transfer is not pending")
    
    # Update from_branch stock
    from_stock = db.query(BranchStock).filter(
        BranchStock.branch_id == transfer.from_branch_id,
        BranchStock.product_id == transfer.product_id
    ).first()
    
    if not from_stock or from_stock.quantity < transfer.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    from_stock.quantity -= transfer.quantity
    
    # Update to_branch stock
    to_stock = db.query(BranchStock).filter(
        BranchStock.branch_id == transfer.to_branch_id,
        BranchStock.product_id == transfer.product_id
    ).first()
    
    if to_stock:
        to_stock.quantity += transfer.quantity
    else:
        to_stock = BranchStock(
            branch_id=transfer.to_branch_id,
            product_id=transfer.product_id,
            quantity=transfer.quantity
        )
        db.add(to_stock)
    
    transfer.status = TransferStatus.COMPLETED
    transfer.approved_by = current_user.id
    transfer.completed_at = datetime.utcnow()
    
    db.commit()
    return {"message": "Transfer completed"}

@router.post("/transfers/{id}/reject")
def reject_transfer(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_admin),
) -> Any:
    """Reject stock transfer."""
    transfer = db.query(StockTransfer).filter(StockTransfer.id == id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    transfer.status = TransferStatus.REJECTED
    transfer.approved_by = current_user.id
    db.commit()
    return {"message": "Transfer rejected"}
