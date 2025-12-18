#!/usr/bin/env python3
"""
Login muammosini aniqlash va tuzatish uchun test script
"""
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.core import security
from app.models import User
from sqlalchemy import text

def test_database_connection():
    """Database connection ni tekshirish"""
    print("=" * 60)
    print("1. Database Connection Test")
    print("=" * 60)
    try:
        db = SessionLocal()
        result = db.execute(text("SELECT current_database(), version()"))
        row = result.fetchone()
        print(f"✅ Database connected: {row[0]}")
        print(f"✅ PostgreSQL version: {row[1][:60]}...")
        db.close()
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_users_table():
    """Users jadvali mavjudligini tekshirish"""
    print("\n" + "=" * 60)
    print("2. Users Table Test")
    print("=" * 60)
    try:
        db = SessionLocal()
        result = db.execute(text("SELECT COUNT(*) FROM users"))
        count = result.scalar()
        print(f"✅ Users table exists")
        print(f"✅ Total users: {count}")
        db.close()
        return True
    except Exception as e:
        print(f"❌ Users table error: {e}")
        return False

def list_all_users():
    """Barcha userlarni ko'rsatish"""
    print("\n" + "=" * 60)
    print("3. All Users in Database")
    print("=" * 60)
    try:
        db = SessionLocal()
        users = db.query(User).all()
        if not users:
            print("⚠️  Hech qanday user topilmadi!")
            print("   Signup qiling yoki test user yarating")
        else:
            print(f"✅ Found {len(users)} user(s):")
            for user in users:
                print(f"   - ID: {user.id}")
                print(f"     Username: {user.username}")
                print(f"     Email: {user.email}")
                print(f"     Phone: {user.phone_number or 'N/A'}")
                print(f"     Active: {user.is_active}")
                print(f"     Role: {user.role}")
                print()
        db.close()
        return users
    except Exception as e:
        print(f"❌ Error listing users: {e}")
        return []

def test_user_login(username_or_email_or_phone: str, password: str):
    """User login ni test qilish"""
    print("\n" + "=" * 60)
    print(f"4. Login Test: {username_or_email_or_phone}")
    print("=" * 60)
    try:
        db = SessionLocal()
        
        # Find user
        user = None
        user = db.query(User).filter(User.username == username_or_email_or_phone).first()
        if not user:
            user = db.query(User).filter(User.email == username_or_email_or_phone).first()
        if not user:
            user = db.query(User).filter(User.phone_number == username_or_email_or_phone).first()
        
        if not user:
            print(f"❌ User topilmadi: {username_or_email_or_phone}")
            print("   Quyidagi userlar mavjud:")
            list_all_users()
            return False
        
        print(f"✅ User topildi:")
        print(f"   - ID: {user.id}")
        print(f"   - Username: {user.username}")
        print(f"   - Email: {user.email}")
        print(f"   - Phone: {user.phone_number or 'N/A'}")
        print(f"   - Active: {user.is_active}")
        print(f"   - Hashed password: {user.hashed_password[:50]}...")
        
        # Test password verification
        print(f"\n🔐 Password verification test:")
        print(f"   - Input password: {password}")
        print(f"   - Stored hash: {user.hashed_password[:50]}...")
        
        is_valid = security.verify_password(password, user.hashed_password)
        if is_valid:
            print(f"✅ Password verification: SUCCESS")
            return True
        else:
            print(f"❌ Password verification: FAILED")
            print(f"\n💡 Muammo: Parol noto'g'ri yoki hash muammosi")
            print(f"   Yechim: Yangi user yarating yoki parolni qayta tiklang")
            return False
            
    except Exception as e:
        print(f"❌ Login test error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def create_test_user():
    """Test user yaratish"""
    print("\n" + "=" * 60)
    print("5. Creating Test User")
    print("=" * 60)
    try:
        db = SessionLocal()
        
        # Check if test user exists
        test_user = db.query(User).filter(User.username == "test_user_123").first()
        if test_user:
            print(f"⚠️  Test user allaqachon mavjud: test_user_123")
            print(f"   Parolni qayta tiklash...")
            test_user.hashed_password = security.get_password_hash("test123456")
            db.commit()
            print(f"✅ Test user paroli yangilandi")
            db.close()
            return test_user
        
        # Create new test user
        test_user = User(
            username="test_user_123",
            email="test@example.com",
            hashed_password=security.get_password_hash("test123456"),
            role="cashier",
            is_active=True,
            full_name="Test User"
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print(f"✅ Test user yaratildi:")
        print(f"   - Username: test_user_123")
        print(f"   - Email: test@example.com")
        print(f"   - Password: test123456")
        print(f"   - ID: {test_user.id}")
        db.close()
        return test_user
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Main test function"""
    print("\n" + "🔍 LOGIN MUAMMOSINI ANIQLASH" + "\n")
    
    # Test 1: Database connection
    if not test_database_connection():
        print("\n❌ Database connection muammosi! Backend ni tekshiring.")
        return
    
    # Test 2: Users table
    if not test_users_table():
        print("\n❌ Users table muammosi! Migration qiling: alembic upgrade head")
        return
    
    # Test 3: List all users
    users = list_all_users()
    
    # Test 4: Test login with test_user_123
    test_username = "test_user_123"
    test_password = "test123456"
    
    # Create test user if doesn't exist
    if not users or not any(u.username == test_username for u in users):
        create_test_user()
    
    # Test login
    login_success = test_user_login(test_username, test_password)
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    if login_success:
        print("✅ Login test: SUCCESS")
        print("✅ Tizim ishlayapti!")
        print("\n💡 Browser da quyidagi ma'lumotlar bilan kirish mumkin:")
        print(f"   Login: {test_username}")
        print(f"   Password: {test_password}")
    else:
        print("❌ Login test: FAILED")
        print("\n💡 Yechim:")
        print("   1. Test user yaratildi/yangilandi")
        print("   2. Browser da qayta urinib ko'ring")
        print("   3. Agar muammo davom etsa, backend logs ni tekshiring:")
        print("      pm2 logs smartpos-backend --lines 50")

if __name__ == "__main__":
    main()







