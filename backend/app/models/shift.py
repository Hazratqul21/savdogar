"""
Shift (Smena) Model
===================
Kassa smenalarini boshqarish.
Har bir smena ochilganda boshlang'ich pul, yopilganda jami hisobot.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Boolean, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
import enum

from app.db.base_class import Base


class ShiftStatus(str, enum.Enum):
    """Smena holatlari"""
    OPEN = "open"
    CLOSED = "closed"
    SUSPENDED = "suspended"


class Shift(Base):
    """
    Smena (Kassa sessiyasi)
    
    Har bir kassir smenani ochadi, savdo qiladi, va smenani yopadi.
    Smena yopilganda Z-Report chiqariladi.
    """
    __tablename__ = "shifts"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    
    # Kassir
    cashier_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Smena holati
    status = Column(String(20), default="open", nullable=False, index=True)
    
    # Vaqtlar
    opened_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    closed_at = Column(DateTime, nullable=True)
    
    # Boshlang'ich kassa
    opening_cash = Column(Float, default=0.0, nullable=False)
    
    # Yopilishdagi hisob-kitob (Z-Report uchun)
    # Savdolar
    total_sales = Column(Float, default=0.0)  # Jami sotuv summasi
    total_transactions = Column(Integer, default=0)  # Jami tranzaksiyalar soni
    
    # To'lov usullari bo'yicha
    cash_sales = Column(Float, default=0.0)  # Naqd pulda
    card_sales = Column(Float, default=0.0)  # Karta bilan
    transfer_sales = Column(Float, default=0.0)  # O'tkazma
    debt_sales = Column(Float, default=0.0)  # Nasiya/Qarz
    
    # Qaytarishlar
    total_refunds = Column(Float, default=0.0)  # Jami qaytarishlar
    refund_count = Column(Integer, default=0)  # Qaytarishlar soni
    
    # Chegirmalar
    total_discounts = Column(Float, default=0.0)  # Jami chegirmalar
    
    # Kassadagi pul
    expected_cash = Column(Float, default=0.0)  # Kutilgan naqd (opening + cash_sales - refunds)
    actual_cash = Column(Float, nullable=True)  # Haqiqiy naqd (kassir sanaganda)
    cash_difference = Column(Float, default=0.0)  # Farq (actual - expected)
    
    # Inkassatsiya
    cash_withdrawn = Column(Float, default=0.0)  # Inkassatsiya qilingan
    
    # Eslatmalar
    opening_notes = Column(Text, nullable=True)
    closing_notes = Column(Text, nullable=True)
    
    # Metadata
    shift_metadata = Column(JSONB, default={})
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    cashier = relationship("User", foreign_keys=[cashier_id])
    tenant = relationship("Tenant")
    
    def calculate_expected_cash(self):
        """Kutilgan naqd pulni hisoblash"""
        return self.opening_cash + self.cash_sales - self.total_refunds - self.cash_withdrawn
    
    def calculate_totals(self, sales):
        """Savdolardan jami hisoblarni hisoblash"""
        self.total_sales = sum(s.total_amount for s in sales)
        self.total_transactions = len(sales)
        
        self.cash_sales = sum(s.total_amount for s in sales if s.payment_method == "cash")
        self.card_sales = sum(s.total_amount for s in sales if s.payment_method == "card")
        self.transfer_sales = sum(s.total_amount for s in sales if s.payment_method == "transfer")
        self.debt_sales = sum(s.total_amount for s in sales if s.payment_method == "debt")
        
        self.total_discounts = sum(s.discount_amount or 0 for s in sales)
        
        self.expected_cash = self.calculate_expected_cash()


class CashMovement(Base):
    """
    Kassa harakatlari (Inkassatsiya, Pul qo'shish)
    """
    __tablename__ = "cash_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=False, index=True)
    
    # Harakat turi
    movement_type = Column(String(20), nullable=False)  # "in" (kirim), "out" (chiqim/inkassatsiya)
    amount = Column(Float, nullable=False)
    
    # Sabab
    reason = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Kim tomonidan
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    shift = relationship("Shift")
    user = relationship("User", foreign_keys=[created_by])
