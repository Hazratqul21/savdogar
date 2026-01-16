"""
Auto-Setup Module
=================

Handles automatic database setup, migrations, and seeding when the server starts.
"""

import asyncio
import subprocess
import logging
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.tenant import Tenant, BusinessType
from app.models.product_v2 import ProductV2, ProductVariant, ProductType
from app.models.serial_number import SerialNumber, SerialNumberStatus, MaintenanceStatus
from app.services.ai_service import ai_service
from datetime import date, timedelta

logger = logging.getLogger(__name__)


def check_database_connection() -> bool:
    """Check if database is accessible"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False


def run_migrations() -> bool:
    """Run database migrations using Alembic"""
    try:
        import os
        from pathlib import Path
        
        backend_dir = Path(__file__).parent.parent.parent
        
        # Run alembic upgrade head
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=backend_dir,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            logger.info("Database migrations completed successfully")
            return True
        else:
            # Check if error is just about tables already existing
            if "already exists" in result.stderr.lower() or "duplicate" in result.stderr.lower():
                logger.warning("Some tables may already exist, continuing...")
                return True
            logger.error(f"Migration failed: {result.stderr}")
            return False
    except Exception as e:
        logger.error(f"Error running migrations: {e}")
        return False


def seed_demo_data() -> bool:
    """Seed demo data for all business types"""
    db = SessionLocal()
    try:
        logger.info("Seeding demo data...")
        
        # Tenant A: Retail (Makro Market)
        tenant_retail = db.query(Tenant).filter(Tenant.name == "Makro Market").first()
        if not tenant_retail:
            tenant_retail = Tenant(
                name="Makro Market",
                business_type="retail",  # Now stored as string
                base_currency="UZS",
                usd_to_uzs_rate=12800.0,
                is_active=True
            )
            db.add(tenant_retail)
            db.commit()
            db.refresh(tenant_retail)
            logger.info(f"Created tenant: {tenant_retail.name}")
        
        # User for Retail
        user_retail = db.query(User).filter(User.email == "retail@demo.com").first()
        if not user_retail:
            user_retail = User(
                username="retail_admin",
                email="retail@demo.com",
                hashed_password=get_password_hash("123"),
                role="owner",  # Now stored as string
                is_active=True,
                tenant_id=tenant_retail.id,
                full_name="Retail Admin"
            )
            db.add(user_retail)
            db.commit()
            logger.info("Created user: retail@demo.com")
        else:
            user_retail.tenant_id = tenant_retail.id
            user_retail.hashed_password = get_password_hash("123")  # Update password hash
            db.commit()
        
        # Product: Coca-Cola
        product_coke_id = None
        try:
            result = db.execute(text("""
                SELECT id FROM products_v2 
                WHERE tenant_id = :tenant_id AND name = :name LIMIT 1
            """), {"tenant_id": tenant_retail.id, "name": "Coca-Cola"})
            row = result.fetchone()
            if row:
                product_coke_id = row[0]
        except Exception:
            pass
        if not product_coke_id:
            try:
                result = db.execute(text("""
                    INSERT INTO products_v2 (tenant_id, name, type, base_price, cost_price, is_active, metadata)
                    VALUES (:tenant_id, :name, :type, :base_price, :cost_price, :is_active, '{}'::JSONB)
                    RETURNING id
                """), {
                    "tenant_id": tenant_retail.id,
                    "name": "Coca-Cola",
                    "type": "simple",
                    "base_price": 14000.0,
                    "cost_price": 10000.0,
                    "is_active": True
                })
                product_coke_id = result.fetchone()[0]
                db.commit()
            except Exception as e:
                db.rollback()
                logger.error(f"Failed to create Coca-Cola product: {e}")
        if product_coke_id:
            # Check if variant already exists
            existing_variant = db.query(ProductVariant).filter(
                ProductVariant.tenant_id == tenant_retail.id,
                ProductVariant.sku == "COKE-001"
            ).first()
            
            if not existing_variant:
                variant_coke = ProductVariant(
                    product_id=product_coke_id,  # Fixed: was product_coke.id
                    tenant_id=tenant_retail.id,
                    sku="COKE-001",
                    price=14000.0,
                    cost_price=10000.0,
                    stock_quantity=100.0,
                    barcode_aliases=["123"],
                    is_active=True
                )
                db.add(variant_coke)
                db.commit()
                logger.info("Created product: Coca-Cola")
        
        # Tenant B: Horeca (Rayhon Milliy)
        tenant_horeca = db.query(Tenant).filter(Tenant.name == "Rayhon Milliy").first()
        if not tenant_horeca:
            tenant_horeca = Tenant(
                name="Rayhon Milliy",
                business_type="horeca",  # Now stored as string
                base_currency="UZS",
                usd_to_uzs_rate=12800.0,
                is_active=True
            )
            db.add(tenant_horeca)
            db.commit()
            db.refresh(tenant_horeca)
            logger.info(f"Created tenant: {tenant_horeca.name}")
        
        # User for Horeca
        user_horeca = db.query(User).filter(User.email == "horeca@demo.com").first()
        if not user_horeca:
            user_horeca = User(
                username="horeca_admin",
                email="horeca@demo.com",
                hashed_password=get_password_hash("123"),
                role="owner",  # Now stored as string
                is_active=True,
                tenant_id=tenant_horeca.id,
                full_name="Horeca Admin"
            )
            db.add(user_horeca)
            db.commit()
            logger.info("Created user: horeca@demo.com")
        else:
            user_horeca.tenant_id = tenant_horeca.id
            user_horeca.hashed_password = get_password_hash("123")  # Update password hash
            db.commit()
        
        # Product: Palov
        product_palov = db.query(ProductV2).filter(
            ProductV2.tenant_id == tenant_horeca.id,
            ProductV2.name == "Palov"
        ).first()
        if not product_palov:
            product_palov = ProductV2(
                tenant_id=tenant_horeca.id,
                name="Palov",
                type=ProductType.simple,
                base_price=35000.0,
                cost_price=20000.0,
                is_active=True
            )
            db.add(product_palov)
            db.commit()
            db.refresh(product_palov)
            
            variant_palov = ProductVariant(
                product_id=product_palov.id,
                tenant_id=tenant_horeca.id,
                sku="PALOV-001",
                price=35000.0,
                cost_price=20000.0,
                stock_quantity=1000.0,
                is_active=True
            )
            db.add(variant_palov)
            db.commit()
            logger.info("Created product: Palov")
        
        # Tenant C: Plumbing & HVAC (Master Santexnika)
        tenant_plumbing = db.query(Tenant).filter(Tenant.name == "Master Santexnika").first()
        if not tenant_plumbing:
            tenant_plumbing = Tenant(
                name="Master Santexnika",
                business_type="plumbing_hvac",  # Now stored as string
                base_currency="UZS",
                usd_to_uzs_rate=12800.0,
                is_active=True
            )
            db.add(tenant_plumbing)
            db.commit()
            db.refresh(tenant_plumbing)
            logger.info(f"Created tenant: {tenant_plumbing.name}")
        
        # User for Plumbing
        user_plumbing = db.query(User).filter(User.email == "plumbing@demo.com").first()
        if not user_plumbing:
            user_plumbing = User(
                username="plumbing_admin",
                email="plumbing@demo.com",
                hashed_password=get_password_hash("123"),
                role="owner",  # Now stored as string
                is_active=True,
                tenant_id=tenant_plumbing.id,
                full_name="Plumbing Admin"
            )
            db.add(user_plumbing)
            db.commit()
            logger.info("Created user: plumbing@demo.com")
        else:
            user_plumbing.tenant_id = tenant_plumbing.id
            user_plumbing.hashed_password = get_password_hash("123")  # Update password hash
            db.commit()
        
        # Product 1: Ariston Cares X (Serialized)
        product_ariston = db.query(ProductV2).filter(
            ProductV2.tenant_id == tenant_plumbing.id,
            ProductV2.name == "Ariston Cares X"
        ).first()
        if not product_ariston:
            product_ariston = ProductV2(
                tenant_id=tenant_plumbing.id,
                name="Ariston Cares X",
                type=ProductType.simple,
                base_price=5000000.0,
                cost_price=4000000.0,
                is_active=True
            )
            db.add(product_ariston)
            db.commit()
            db.refresh(product_ariston)
            
            variant_ariston = ProductVariant(
                product_id=product_ariston.id,
                tenant_id=tenant_plumbing.id,
                sku="ARISTON-X-001",
                price=5000000.0,
                cost_price=4000000.0,
                stock_quantity=0.0,
                requires_serial_number=True,
                is_serialized=True,
                is_active=True
            )
            db.add(variant_ariston)
            db.commit()
            db.refresh(variant_ariston)
            logger.info("Created product: Ariston Cares X")
        else:
            variant_ariston = db.query(ProductVariant).filter(
                ProductVariant.product_id == product_ariston.id
            ).first()
        
        # Product 2: PPR Pipe 32mm
        product_pipe = db.query(ProductV2).filter(
            ProductV2.tenant_id == tenant_plumbing.id,
            ProductV2.name == "PPR Pipe 32mm"
        ).first()
        if not product_pipe:
            product_pipe = ProductV2(
                tenant_id=tenant_plumbing.id,
                name="PPR Pipe 32mm",
                type=ProductType.simple,
                base_price=25600.0,
                cost_price=20000.0,
                is_active=True
            )
            db.add(product_pipe)
            db.commit()
            db.refresh(product_pipe)
            
            variant_pipe = ProductVariant(
                product_id=product_pipe.id,
                tenant_id=tenant_plumbing.id,
                sku="PPR-32-001",
                price=25600.0,
                cost_price=20000.0,
                stock_quantity=500.0,
                primary_unit="meter",
                is_active=True
            )
            db.add(variant_pipe)
            db.commit()
            logger.info("Created product: PPR Pipe 32mm")
        
        # Serial Number for Ariston
        if variant_ariston:
            serial = db.query(SerialNumber).filter(
                SerialNumber.tenant_id == tenant_plumbing.id,
                SerialNumber.serial_number == "SN-2024-X"
            ).first()
            if not serial:
                serial = SerialNumber(
                    tenant_id=tenant_plumbing.id,
                    variant_id=variant_ariston.id,
                    serial_number="SN-2024-X",
                    status=SerialNumberStatus.ACTIVE,
                    maintenance_status=MaintenanceStatus.UNDER_WARRANTY,
                    warranty_start_date=date.today(),
                    warranty_duration_months=24,
                    warranty_end_date=date.today() + timedelta(days=730),
                    is_active=True,
                    posting_date=date.today()
                )
                db.add(serial)
                variant_ariston.stock_quantity = 1.0
                db.commit()
                logger.info("Created serial number: SN-2024-X")
        
        logger.info("Demo data seeding completed")
        return True
        
    except Exception as e:
        db.rollback()
        logger.error(f"Seeding failed: {e}", exc_info=True)
        return False
    finally:
        db.close()


async def check_ai_connection() -> bool:
    """Check OpenAI connection"""
    try:
        result = await ai_service.test_connection()
        if result.get("success"):
            logger.info(f"OpenAI connected: {result.get('response', 'OK')}")
            return True
        else:
            logger.warning(f"OpenAI check failed: {result.get('error', 'Unknown error')}")
            return False
    except Exception as e:
        logger.warning(f"OpenAI check failed: {e}")
        return False


async def auto_setup() -> None:
    """
    Automatic setup that runs when the server starts.
    - Checks database connection
    - Runs migrations
    - Seeds demo data
    - Checks AI connection
    """
    logger.info("=" * 60)
    logger.info("Starting automatic setup...")
    logger.info("=" * 60)
    
    # Step 1: Check database connection
    logger.info("Step 1: Checking database connection...")
    if not check_database_connection():
        logger.error("Database connection failed! Please check your .env file.")
        return
    logger.info("✅ Database connection OK")
    
    # Step 2: Run migrations
    logger.info("Step 2: Running database migrations...")
    if not run_migrations():
        logger.error("Migrations failed! Please check the errors above.")
        return
    logger.info("✅ Migrations completed")
    
    # Step 3: Seed demo data
    logger.info("Step 3: Seeding demo data...")
    if not seed_demo_data():
        logger.error("Seeding failed! Please check the errors above.")
        return
    logger.info("✅ Demo data seeded")
    
    # Step 4: Check AI connection
    logger.info("Step 4: Checking OpenAI connection...")
    await check_ai_connection()
    
    logger.info("=" * 60)
    logger.info("✅ Automatic setup completed!")
    logger.info("=" * 60)
    logger.info("Access URLs:")
    logger.info("  👉 Retail POS: http://localhost:3000/login (retail@demo.com / 123)")
    logger.info("  👉 Plumbing POS: http://localhost:3000/login (plumbing@demo.com / 123)")
    logger.info("  👉 Horeca POS: http://localhost:3000/login (horeca@demo.com / 123)")
    logger.info("  👉 Backend Docs: http://localhost:8000/docs")
    logger.info("=" * 60)

