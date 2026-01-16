from sqlalchemy.orm import Session
from app.models.product_v2 import ProductVariant
from app.models.inventory import Supplier

class ProcurementEngineService:
    """
    Mutloq Mantiq: Avtonom Xarid Tizimi (JIT & EOQ Modeling).
    Tizim pul oqimini saqlab qolgan holda omborni to'ldirishni rejalashtiradi.
    """

    @staticmethod
    def calculate_jit_restock(db: Session, tenant_id: int):
        # 1. Barcha variantlarni olish
        variants = db.query(ProductVariant).filter(ProductVariant.tenant_id == tenant_id).all()
        
        procurement_plan = []
        for v in variants:
            daily_velocity = v.velocity_score or 0.1
            current_stock = v.stock_quantity
            
            # Lead Time (etkazib berish vaqti) - Odatiy 3 kun 
            # (Kelajakda supplier history dan olinadi)
            lead_time_days = 3 
            
            # Safety Stock (Xavfsizlik zaxirasi)
            safety_stock = daily_velocity * 2 
            
            # Reorder Point (Qachon buyurtma berish kerak?)
            reorder_point = (daily_velocity * lead_time_days) + safety_stock
            
            if current_stock <= reorder_point:
                # Economic Order Quantity (EOQ namuna mantiqi)
                # 15 kunlik zaxira uchun buyurtma
                order_qty = daily_velocity * 15 
                
                procurement_plan.append({
                    "sku": v.sku,
                    "item_name": v.product_v2.name if v.product_v2 else v.sku,
                    "current_stock": current_stock,
                    "suggested_order_qty": round(order_qty, 1),
                    "urgency": "HIGH" if current_stock < safety_stock else "MEDIUM",
                    "reason": f"Sotuv tezligi ({daily_velocity}/kun) asosida zaxira {round(current_stock/daily_velocity, 1)} kunga etadi."
                })
        
        return procurement_plan
