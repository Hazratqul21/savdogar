from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api import deps

router = APIRouter()

@router.get("/health/db")
def check_database_health(db: Session = Depends(deps.get_db)):
    """
    Database connection health check
    """
    try:
        # Try to execute a simple query
        result = db.execute(text("SELECT 1")).scalar()
        
        # Check if users table exists
        users_exists = db.execute(
            text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'users'
                )
            """)
        ).scalar()
        
        # Check if tenants table exists (for v2)
        tenants_exists = db.execute(
            text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'tenants'
                )
            """)
        ).scalar()
        
        return {
            "status": "healthy",
            "database": "connected",
            "tables": {
                "users": users_exists,
                "tenants": tenants_exists,
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }








