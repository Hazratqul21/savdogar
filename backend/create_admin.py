#!/usr/bin/env python3
"""Create admin user for Savdogar

Usage:
    # Development (uses default password)
    python create_admin.py
    
    # Production (requires environment variables)
    ADMIN_USERNAME=admin ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secure_password python create_admin.py
"""

import os
import sys
from pathlib import Path

# Add backend to path (works from project root or backend directory)
backend_path = Path(__file__).parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.core.config import settings
from app.models.user import User, UserRole

def create_admin(
    username: str = None,
    email: str = None,
    password: str = None,
    update_existing: bool = False
):
    """
    Create or update admin user.
    
    Args:
        username: Admin username (default: from ADMIN_USERNAME env or 'admin')
        email: Admin email (default: from ADMIN_EMAIL env or 'admin@smartpos.uz')
        password: Admin password (default: from ADMIN_PASSWORD env or 'admin123' for dev)
        update_existing: Whether to update password if user exists
    """
    # Get values from environment or use defaults
    admin_username = username or os.getenv("ADMIN_USERNAME", "admin")
    admin_email = email or os.getenv("ADMIN_EMAIL", "admin@smartpos.uz")
    admin_password = password or os.getenv("ADMIN_PASSWORD")
    
    # Security check: In production, require password to be set via env var
    if settings.is_production() and not admin_password:
        raise ValueError(
            "ADMIN_PASSWORD environment variable is required in production! "
            "Do not use default passwords in production."
        )
    
    # Development fallback (not secure, but convenient)
    if not admin_password:
        admin_password = "admin123"
        print("⚠️  WARNING: Using default password 'admin123'. This is INSECURE for production!")
        print("   Set ADMIN_PASSWORD environment variable for production use.\n")
    
    db = SessionLocal()
    
    try:
        # Check if admin exists
        user = db.query(User).filter(User.username == admin_username).first()
        
        if user:
            print(f"✅ Admin foydalanuvchi allaqachon mavjud")
            print(f"   Username: {user.username}")
            print(f"   Email: {user.email}")
            print(f"   Role: {user.role}")
            
            if update_existing or os.getenv("ADMIN_PASSWORD"):
                # Update password if explicitly requested or env var is set
                user.hashed_password = get_password_hash(admin_password)
                db.commit()
                print(f"\n🔑 Parol yangilandi")
            else:
                print(f"\n⚠️  Parol o'zgartirilmadi (--update flag yoki ADMIN_PASSWORD env var kerak)")
        else:
            # Create new admin user
            user = User(
                username=admin_username,
                email=admin_email,
                hashed_password=get_password_hash(admin_password),
                role=UserRole.SUPER_ADMIN,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print("✅ Admin foydalanuvchi yaratildi!")
        
        print("\n" + "="*50)
        print("LOGIN MA'LUMOTLARI:")
        print("="*50)
        print(f"Username: {admin_username}")
        if not settings.is_production():
            print(f"Password: {admin_password}")
        else:
            print(f"Password: [Set via ADMIN_PASSWORD env var]")
        print("="*50)
        
    except Exception as e:
        db.rollback()
        print(f"❌ Xatolik: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Create or update admin user")
    parser.add_argument("--username", help="Admin username")
    parser.add_argument("--email", help="Admin email")
    parser.add_argument("--password", help="Admin password (or use ADMIN_PASSWORD env var)")
    parser.add_argument("--update", action="store_true", help="Update password if user exists")
    
    args = parser.parse_args()
    
    create_admin(
        username=args.username,
        email=args.email,
        password=args.password,
        update_existing=args.update
    )
