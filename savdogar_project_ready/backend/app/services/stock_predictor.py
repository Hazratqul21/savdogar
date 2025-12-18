from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.models.sale_v2 import SaleItemV2, SaleV2
from app.models.product_v2 import ProductVariant

class StockPredictorService:
    """
    Sotuvlar asosida zaxira qachon tugashini bashorat qilish.
    """
    
    @staticmethod
    def calculate_velocity(db: Session, tenant_id: int):
        # Oxirgi 7 kundagi sotuvlarni olish
        last_7_days = datetime.utcnow() - timedelta(days=7)
        
        sales_velocity = db.query(
            SaleItemV2.variant_id,
            func.sum(SaleItemV2.quantity).label('total_qty')
        ).join(SaleV2).filter(
            SaleV2.tenant_id == tenant_id,
            SaleV2.created_at >= last_7_days
        ).group_by(SaleItemV2.variant_id).all()
        
        for v_id, total_qty in sales_velocity:
            daily_velocity = total_qty / 7.0
            
            # Variantni yangilash
            variant = db.query(ProductVariant).filter(ProductVariant.id == v_id).first()
            if variant:
                variant.velocity_score = daily_velocity
        
        db.commit()
        return True

    @staticmethod
    def get_stock_alerts(db: Session, tenant_id: int):
        """Tugash ehtimoli bor tovarlarni qaytarish"""
        variants = db.query(ProductVariant).filter(
            ProductVariant.tenant_id == tenant_id,
            ProductVariant.velocity_score > 0
        ).all()
        
        alerts = []
        for v in variants:
            days_left = v.stock_quantity / v.velocity_score
            if days_left <= 3: # 3 kundan kam qolgan bo'lsa
                alerts.append({
                    "sku": v.sku,
                    "stock": v.stock_quantity,
                    "velocity": v.velocity_score,
                    "days_left": round(days_left, 1)
                })
        return alerts
