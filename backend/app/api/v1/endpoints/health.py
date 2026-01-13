from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api import deps

router = APIRouter()

@router.get("/db")
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


@router.get("/debug-user")
def debug_user_hash(db: Session = Depends(deps.get_db)):
    """
    Debug endpoint to check user hash (TEMPORARY - remove in production)
    """
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    try:
        result = db.execute(text("""
            SELECT id, username, email, hashed_password 
            FROM users WHERE username = 'engineer'
        """)).fetchone()
        
        if not result:
            return {"error": "User not found"}
        
        user_id, username, email, hashed_password = result
        
        # Test passwords
        test_passwords = ["test123", "Xazrat_ali571"]
        password_tests = {}
        for pwd in test_passwords:
            try:
                password_tests[pwd] = pwd_context.verify(pwd, hashed_password)
            except Exception as e:
                password_tests[pwd] = f"Error: {e}"
        
        return {
            "user_id": user_id,
            "username": username,
            "email": email,
            "hash_preview": hashed_password[:40] + "...",
            "hash_length": len(hashed_password),
            "password_tests": password_tests
        }
    except Exception as e:
        return {"error": str(e)}








