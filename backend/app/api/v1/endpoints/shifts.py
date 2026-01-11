"""
Shift (Smena) API Endpoints
===========================
Kassa smenalarini boshqarish.
"""
from typing import Any, List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.api import deps
from app.models import User
from app.models.shift import Shift, CashMovement
from app.models.sale_v2 import SaleV2
from app.schemas import shift as schemas

router = APIRouter()


@router.get("/active", response_model=schemas.ActiveShiftInfo)
def get_active_shift(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Joriy kassirning aktiv smenasini olish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    # Aktiv smenani topish
    active_shift = db.query(Shift).filter(
        and_(
            Shift.tenant_id == current_user.tenant_id,
            Shift.cashier_id == current_user.id,
            Shift.status == "open"
        )
    ).first()
    
    if not active_shift:
        return schemas.ActiveShiftInfo(has_active_shift=False)
    
    # Joriy smena savdolarini hisoblash
    sales = db.query(SaleV2).filter(
        and_(
            SaleV2.tenant_id == current_user.tenant_id,
            SaleV2.cashier_id == current_user.id,
            SaleV2.created_at >= active_shift.opened_at
        )
    ).all()
    
    current_sales = sum(s.total_amount or 0 for s in sales)
    
    return schemas.ActiveShiftInfo(
        has_active_shift=True,
        shift_id=active_shift.id,
        opened_at=active_shift.opened_at,
        opening_cash=active_shift.opening_cash,
        current_sales=current_sales,
        transaction_count=len(sales)
    )


@router.post("/open", response_model=schemas.ShiftResponse)
def open_shift(
    *,
    db: Session = Depends(deps.get_db),
    shift_in: schemas.ShiftOpen,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Yangi smena ochish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    # Mavjud ochiq smena bormi tekshirish
    existing_shift = db.query(Shift).filter(
        and_(
            Shift.tenant_id == current_user.tenant_id,
            Shift.cashier_id == current_user.id,
            Shift.status == "open"
        )
    ).first()
    
    if existing_shift:
        raise HTTPException(
            status_code=400,
            detail="Sizda allaqachon ochiq smena bor. Avval uni yoping."
        )
    
    # Yangi smena yaratish
    shift = Shift(
        tenant_id=current_user.tenant_id,
        cashier_id=current_user.id,
        status="open",
        opening_cash=shift_in.opening_cash,
        opening_notes=shift_in.notes,
        opened_at=datetime.utcnow(),
    )
    
    db.add(shift)
    db.commit()
    db.refresh(shift)
    
    # Kassir ismini qo'shish
    response = _shift_to_response(shift, current_user.full_name or current_user.username)
    return response


@router.post("/close", response_model=schemas.ZReport)
def close_shift(
    *,
    db: Session = Depends(deps.get_db),
    close_data: schemas.ShiftClose,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Smenani yopish va Z-Report olish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    # Aktiv smenani topish
    shift = db.query(Shift).filter(
        and_(
            Shift.tenant_id == current_user.tenant_id,
            Shift.cashier_id == current_user.id,
            Shift.status == "open"
        )
    ).first()
    
    if not shift:
        raise HTTPException(
            status_code=404,
            detail="Ochiq smena topilmadi"
        )
    
    # Smena davomidagi savdolarni olish
    sales = db.query(SaleV2).filter(
        and_(
            SaleV2.tenant_id == current_user.tenant_id,
            SaleV2.cashier_id == current_user.id,
            SaleV2.created_at >= shift.opened_at,
            SaleV2.status == "completed"
        )
    ).all()
    
    # Inkassatsiyalarni hisoblash
    withdrawals = db.query(func.sum(CashMovement.amount)).filter(
        and_(
            CashMovement.shift_id == shift.id,
            CashMovement.movement_type == "out"
        )
    ).scalar() or 0
    
    deposits = db.query(func.sum(CashMovement.amount)).filter(
        and_(
            CashMovement.shift_id == shift.id,
            CashMovement.movement_type == "in"
        )
    ).scalar() or 0
    
    # Statistikalarni hisoblash
    shift.total_sales = sum(s.total_amount or 0 for s in sales)
    shift.total_transactions = len(sales)
    
    shift.cash_sales = sum(s.total_amount or 0 for s in sales if s.payment_method == "cash")
    shift.card_sales = sum(s.total_amount or 0 for s in sales if s.payment_method == "card")
    shift.transfer_sales = sum(s.total_amount or 0 for s in sales if s.payment_method == "transfer")
    shift.debt_sales = sum(s.total_amount or 0 for s in sales if s.payment_method == "debt")
    
    shift.total_discounts = sum(s.discount_amount or 0 for s in sales)
    
    # Qaytarishlar (refund)
    refunds = [s for s in sales if s.status == "refunded"]
    shift.total_refunds = sum(s.total_amount or 0 for s in refunds)
    shift.refund_count = len(refunds)
    
    # Kassa holati
    shift.cash_withdrawn = withdrawals - deposits
    shift.expected_cash = shift.opening_cash + shift.cash_sales - shift.total_refunds - shift.cash_withdrawn
    shift.actual_cash = close_data.actual_cash
    shift.cash_difference = close_data.actual_cash - shift.expected_cash
    
    # Smena yopish
    shift.status = "closed"
    shift.closed_at = datetime.utcnow()
    shift.closing_notes = close_data.notes
    
    db.commit()
    db.refresh(shift)
    
    # Z-Report yaratish
    duration = (shift.closed_at - shift.opened_at).total_seconds() / 3600
    average_sale = shift.total_sales / shift.total_transactions if shift.total_transactions > 0 else 0
    
    # Status
    if abs(shift.cash_difference) < 100:  # 100 so'm tolerans
        status_text = "balanced"
    elif shift.cash_difference < 0:
        status_text = "shortage"
    else:
        status_text = "overage"
    
    return schemas.ZReport(
        shift_id=shift.id,
        shift_number=f"Z-{shift.id:06d}",
        opened_at=shift.opened_at,
        closed_at=shift.closed_at,
        duration_hours=round(duration, 2),
        cashier_name=current_user.full_name or current_user.username,
        total_sales=shift.total_sales,
        total_transactions=shift.total_transactions,
        average_sale=round(average_sale, 2),
        cash_sales=shift.cash_sales,
        card_sales=shift.card_sales,
        transfer_sales=shift.transfer_sales,
        debt_sales=shift.debt_sales,
        total_refunds=shift.total_refunds,
        refund_count=shift.refund_count,
        total_discounts=shift.total_discounts,
        opening_cash=shift.opening_cash,
        expected_cash=shift.expected_cash,
        actual_cash=shift.actual_cash,
        cash_difference=shift.cash_difference,
        cash_withdrawn=shift.cash_withdrawn,
        status=status_text,
        notes=shift.closing_notes
    )


@router.post("/cash-movement", response_model=schemas.CashMovementResponse)
def create_cash_movement(
    *,
    db: Session = Depends(deps.get_db),
    movement_in: schemas.CashMovementCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Inkassatsiya yoki pul qo'shish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    # Aktiv smenani topish
    shift = db.query(Shift).filter(
        and_(
            Shift.tenant_id == current_user.tenant_id,
            Shift.cashier_id == current_user.id,
            Shift.status == "open"
        )
    ).first()
    
    if not shift:
        raise HTTPException(
            status_code=404,
            detail="Ochiq smena topilmadi. Avval smenani oching."
        )
    
    if movement_in.movement_type not in ["in", "out"]:
        raise HTTPException(
            status_code=400,
            detail="movement_type 'in' yoki 'out' bo'lishi kerak"
        )
    
    movement = CashMovement(
        tenant_id=current_user.tenant_id,
        shift_id=shift.id,
        movement_type=movement_in.movement_type,
        amount=movement_in.amount,
        reason=movement_in.reason,
        notes=movement_in.notes,
        created_by=current_user.id
    )
    
    db.add(movement)
    db.commit()
    db.refresh(movement)
    
    return movement


@router.get("/history", response_model=List[schemas.ShiftResponse])
def get_shift_history(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Smenalar tarixini olish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    shifts = db.query(Shift).filter(
        Shift.tenant_id == current_user.tenant_id
    ).order_by(Shift.opened_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for shift in shifts:
        cashier = db.query(User).filter(User.id == shift.cashier_id).first()
        cashier_name = cashier.full_name or cashier.username if cashier else "Noma'lum"
        result.append(_shift_to_response(shift, cashier_name))
    
    return result


@router.get("/{shift_id}", response_model=schemas.ShiftResponse)
def get_shift(
    *,
    db: Session = Depends(deps.get_db),
    shift_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Bitta smenani olish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    shift = db.query(Shift).filter(
        and_(
            Shift.id == shift_id,
            Shift.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not shift:
        raise HTTPException(status_code=404, detail="Smena topilmadi")
    
    cashier = db.query(User).filter(User.id == shift.cashier_id).first()
    cashier_name = cashier.full_name or cashier.username if cashier else "Noma'lum"
    
    return _shift_to_response(shift, cashier_name)


@router.get("/{shift_id}/z-report", response_model=schemas.ZReport)
def get_z_report(
    *,
    db: Session = Depends(deps.get_db),
    shift_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Smena uchun Z-Report olish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    shift = db.query(Shift).filter(
        and_(
            Shift.id == shift_id,
            Shift.tenant_id == current_user.tenant_id,
            Shift.status == "closed"
        )
    ).first()
    
    if not shift:
        raise HTTPException(
            status_code=404,
            detail="Yopilgan smena topilmadi"
        )
    
    cashier = db.query(User).filter(User.id == shift.cashier_id).first()
    cashier_name = cashier.full_name or cashier.username if cashier else "Noma'lum"
    
    duration = (shift.closed_at - shift.opened_at).total_seconds() / 3600 if shift.closed_at else 0
    average_sale = shift.total_sales / shift.total_transactions if shift.total_transactions > 0 else 0
    
    if abs(shift.cash_difference) < 100:
        status_text = "balanced"
    elif shift.cash_difference < 0:
        status_text = "shortage"
    else:
        status_text = "overage"
    
    return schemas.ZReport(
        shift_id=shift.id,
        shift_number=f"Z-{shift.id:06d}",
        opened_at=shift.opened_at,
        closed_at=shift.closed_at,
        duration_hours=round(duration, 2),
        cashier_name=cashier_name,
        total_sales=shift.total_sales,
        total_transactions=shift.total_transactions,
        average_sale=round(average_sale, 2),
        cash_sales=shift.cash_sales,
        card_sales=shift.card_sales,
        transfer_sales=shift.transfer_sales,
        debt_sales=shift.debt_sales,
        total_refunds=shift.total_refunds,
        refund_count=shift.refund_count,
        total_discounts=shift.total_discounts,
        opening_cash=shift.opening_cash,
        expected_cash=shift.expected_cash,
        actual_cash=shift.actual_cash or 0,
        cash_difference=shift.cash_difference,
        cash_withdrawn=shift.cash_withdrawn,
        status=status_text,
        notes=shift.closing_notes
    )


def _shift_to_response(shift: Shift, cashier_name: str) -> schemas.ShiftResponse:
    """Shift modelini response ga aylantirish"""
    return schemas.ShiftResponse(
        id=shift.id,
        tenant_id=shift.tenant_id,
        cashier_id=shift.cashier_id,
        status=shift.status,
        opened_at=shift.opened_at,
        closed_at=shift.closed_at,
        opening_cash=shift.opening_cash,
        total_sales=shift.total_sales or 0,
        total_transactions=shift.total_transactions or 0,
        cash_sales=shift.cash_sales or 0,
        card_sales=shift.card_sales or 0,
        transfer_sales=shift.transfer_sales or 0,
        debt_sales=shift.debt_sales or 0,
        total_refunds=shift.total_refunds or 0,
        refund_count=shift.refund_count or 0,
        total_discounts=shift.total_discounts or 0,
        expected_cash=shift.expected_cash or 0,
        actual_cash=shift.actual_cash,
        cash_difference=shift.cash_difference or 0,
        cash_withdrawn=shift.cash_withdrawn or 0,
        opening_notes=shift.opening_notes,
        closing_notes=shift.closing_notes,
        cashier_name=cashier_name
    )
