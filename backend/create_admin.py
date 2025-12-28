#!/usr/bin/env python3
"""Create admin user for SmartPOS"""

import sys
sys.path.insert(0, '/home/ali/dokon/backend')

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole

def create_admin():
    db = SessionLocal()
    
    # Check if admin exists
    user = db.query(User).filter(User.username == "admin").first()
    
    if user:
        print("✅ Admin foydalanuvchi allaqachon mavjud")
        print(f"   Username: admin")
        print(f"   Email: {user.email}")
        print(f"   Role: {user.role}")
        
        # Update password to 'admin123'
        user.hashed_password = get_password_hash("admin123")
        db.commit()
        print("\n🔑 Parol yangilandi: admin123")
    else:
        # Create new admin user
        user = User(
            username="admin",
            email="admin@smartpos.uz",
            hashed_password=get_password_hash("admin123"),
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
    print(f"Username: admin")
    print(f"Password: admin123")
    print("="*50)
    
    db.close()

if __name__ == "__main__":
    create_admin()
