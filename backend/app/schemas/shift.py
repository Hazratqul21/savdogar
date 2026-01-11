"""
Shift Schemas
=============
Smena uchun Pydantic schemalar.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field


class ShiftOpen(BaseModel):
    """Smena ochish"""
    opening_cash: float = Field(ge=0, description="Boshlang'ich naqd pul")
    notes: Optional[str] = Field(None, description="Eslatma")


class ShiftClose(BaseModel):
    """Smena yopish"""
    actual_cash: float = Field(ge=0, description="Kassadagi haqiqiy naqd pul")
    notes: Optional[str] = Field(None, description="Eslatma")


class CashMovementCreate(BaseModel):
    """Kassa harakati yaratish"""
    movement_type: str = Field(..., description="'in' (kirim) yoki 'out' (chiqim)")
    amount: float = Field(gt=0, description="Summa")
    reason: Optional[str] = Field(None, description="Sabab")
    notes: Optional[str] = Field(None, description="Eslatma")


class CashMovementResponse(BaseModel):
    """Kassa harakati javobi"""
    id: int
    shift_id: int
    movement_type: str
    amount: float
    reason: Optional[str]
    notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ShiftResponse(BaseModel):
    """Smena javobi"""
    id: int
    tenant_id: int
    cashier_id: int
    status: str
    
    opened_at: datetime
    closed_at: Optional[datetime]
    
    opening_cash: float
    
    # Savdo statistikasi
    total_sales: float
    total_transactions: int
    
    # To'lov usullari
    cash_sales: float
    card_sales: float
    transfer_sales: float
    debt_sales: float
    
    # Qaytarishlar
    total_refunds: float
    refund_count: int
    
    # Chegirmalar
    total_discounts: float
    
    # Kassa holati
    expected_cash: float
    actual_cash: Optional[float]
    cash_difference: float
    cash_withdrawn: float
    
    # Eslatmalar
    opening_notes: Optional[str]
    closing_notes: Optional[str]
    
    # Kassir ma'lumotlari
    cashier_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class ZReport(BaseModel):
    """Z-Report (Smena hisoboti)"""
    shift_id: int
    shift_number: str
    
    # Vaqtlar
    opened_at: datetime
    closed_at: datetime
    duration_hours: float
    
    # Kassir
    cashier_name: str
    
    # Savdolar
    total_sales: float
    total_transactions: int
    average_sale: float
    
    # To'lov usullari bo'yicha
    cash_sales: float
    card_sales: float
    transfer_sales: float
    debt_sales: float
    
    # Qaytarishlar
    total_refunds: float
    refund_count: int
    
    # Chegirmalar
    total_discounts: float
    
    # Kassa holati
    opening_cash: float
    expected_cash: float
    actual_cash: float
    cash_difference: float
    cash_withdrawn: float
    
    # Status
    status: str  # "balanced", "shortage", "overage"
    
    # Eslatmalar
    notes: Optional[str]
    
    class Config:
        from_attributes = True


class ActiveShiftInfo(BaseModel):
    """Aktiv smena haqida qisqa ma'lumot"""
    has_active_shift: bool
    shift_id: Optional[int] = None
    opened_at: Optional[datetime] = None
    opening_cash: Optional[float] = None
    current_sales: Optional[float] = None
    transaction_count: Optional[int] = None
