"""
Background Task Scheduler
✅ AI Audit & Automation - Scheduled tasks for daily audit scans
"""

import asyncio
import logging
from datetime import datetime, time
from typing import Optional
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.tenant import Tenant
from app.services.ai_audit_service import ai_audit_service

logger = logging.getLogger(__name__)

class TaskScheduler:
    """
    Simple task scheduler for background jobs
    Uses asyncio for scheduling (can be replaced with Celery in production)
    """
    
    def __init__(self):
        self.running = False
        self.tasks = []
    
    async def daily_audit_scan_all_tenants(self):
        """
        Run daily audit scan for all active tenants
        Should be called daily (e.g., at 2 AM)
        """
        logger.info("Starting daily audit scan for all tenants")
        
        db = SessionLocal()
        try:
            # Get all active tenants
            tenants = db.query(Tenant).filter(Tenant.is_active == True).all()
            
            for tenant in tenants:
                try:
                    logger.info(f"Running audit scan for tenant {tenant.id} ({tenant.name})")
                    await ai_audit_service.daily_audit_scan(
                        db=db,
                        tenant_id=tenant.id,
                        scan_date=None  # Today
                    )
                except Exception as e:
                    logger.error(f"Error scanning tenant {tenant.id}: {e}")
                    continue
            
            logger.info(f"Daily audit scan completed for {len(tenants)} tenants")
            
        except Exception as e:
            logger.error(f"Error in daily_audit_scan_all_tenants: {e}")
        finally:
            db.close()
    
    async def schedule_daily_audit(self, run_time: time = time(2, 0)):
        """
        Schedule daily audit scan at specified time
        
        Args:
            run_time: Time to run the scan (default: 2:00 AM)
        """
        while self.running:
            now = datetime.now()
            target_time = datetime.combine(now.date(), run_time)
            
            # If target time has passed today, schedule for tomorrow
            if target_time < now:
                from datetime import timedelta
                target_time = datetime.combine(
                    (now + timedelta(days=1)).date(),
                    run_time
                )
            
            # Calculate seconds until target time
            wait_seconds = (target_time - now).total_seconds()
            
            logger.info(f"Scheduled daily audit scan for {target_time} (in {wait_seconds:.0f} seconds)")
            
            # Wait until target time
            await asyncio.sleep(wait_seconds)
            
            # Run the scan
            await self.daily_audit_scan_all_tenants()
    
    def start(self):
        """Start the scheduler"""
        self.running = True
        logger.info("Task scheduler started")
    
    def stop(self):
        """Stop the scheduler"""
        self.running = False
        logger.info("Task scheduler stopped")

# Global scheduler instance
scheduler = TaskScheduler()

# For FastAPI startup/shutdown
async def start_scheduler():
    """Start scheduler on FastAPI startup"""
    scheduler.start()
    # Schedule daily audit scan
    asyncio.create_task(scheduler.schedule_daily_audit())

async def stop_scheduler():
    """Stop scheduler on FastAPI shutdown"""
    scheduler.stop()

