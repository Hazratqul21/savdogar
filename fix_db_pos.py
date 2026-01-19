import asyncio
import sys
import os

# Add parent directory to path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.tenant import Tenant
from app.models.product_v2 import ProductVariant
from sqlalchemy import select, update

async def fix_pos_issues():
    db = SessionLocal()
    try:
        # 1. Barcha tenantlar uchun manfiy qoldiqqa ruxsat berish
        print("--- Tenant sozlamalarini yangilash ---")
        tenants = db.query(Tenant).all()
        if not tenants:
            print("Hech qanday tenant topilmadi.")
        
        for tenant in tenants:
            config = tenant.config or {}
            # Manfiy qoldiqqa ruxsat berishni yoqamiz
            config["allow_negative_stock"] = True
            tenant.config = config
            print(f"Tenant '{tenant.name}' uchun manfiy qoldiqqa (allow_negative_stock) ruxsat berildi.")
        
        # 2. Mavjud mahsulotlarning ombor qoldig'ini yangilash (xatoni yo'qotish uchun)
        print("\n--- Mahsulot qoldiqlarini yangilash ---")
        variants = db.query(ProductVariant).all()
        for variant in variants:
            # Agar mahsulot qoldig'i 0 dan kichik bo'lsa yoki 0 bo'lsa, test uchun 100 qilamiz
            if variant.stock_quantity <= 0:
                variant.stock_quantity = 100.0
                print(f"Variant SKU: {variant.sku} qoldig'i 100 ga yangilandi.")
            
        db.commit()
        print("\n✅ Barcha o'zgarishlar bazada saqlandi!")
        print("Endi 'To'lov' tugmasi xatosiz ishlashi kerak.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Xatolik yuz berdi: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # check if app is available
    try:
        import app
    except ImportError:
        print("❌ 'app' papkasi topilmadi. Skriptni loyiha ildizida (root) ishga tushiring.")
        sys.exit(1)
        
    asyncio.run(fix_pos_issues())
