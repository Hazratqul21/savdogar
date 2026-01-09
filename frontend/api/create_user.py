#!/usr/bin/env python3
"""
Create admin user in database.
Run this script locally or on Vercel to create the first user.

Usage:
    python create_user.py

Make sure DATABASE_URL environment variable is set.
"""
import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from urllib.parse import quote_plus

def create_admin_user():
    """Create admin user in database."""
    
    # Get DATABASE_URL from environment or use default
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        # Default Supabase connection
        password = quote_plus("Xazrat_ali571")
        database_url = f"postgresql://postgres:{password}@db.twzxefwfjbupealjasum.supabase.co:5432/postgres?sslmode=require"
        print("⚠️ Using default DATABASE_URL")
    
    print(f"🔗 Connecting to database...")
    
    try:
        engine = create_engine(database_url, connect_args={"connect_timeout": 15})
        
        with engine.connect() as conn:
            # Test connection
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ Connected to PostgreSQL: {version[:50]}...")
            
            # Check if users table exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'users'
                )
            """))
            if not result.fetchone()[0]:
                print("❌ Users table does not exist. Run migrations first: alembic upgrade head")
                return False
            
            # Hash password
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            hashed_password = pwd_context.hash("admin123")
            
            # Check if user already exists
            result = conn.execute(text("""
                SELECT id FROM users WHERE username = :username OR email = :email
            """), {"username": "engineer", "email": "xazratabduraufov@gmail.com"})
            
            existing = result.fetchone()
            if existing:
                print(f"⚠️ User already exists with ID: {existing[0]}")
                return True
            
            # Create user
            conn.execute(text("""
                INSERT INTO users (username, email, hashed_password, full_name, role, is_active)
                VALUES (:username, :email, :password, :full_name, :role, true)
            """), {
                "username": "engineer",
                "email": "xazratabduraufov@gmail.com",
                "password": hashed_password,
                "full_name": "Xazratqul",
                "role": "admin"
            })
            
            conn.commit()
            print("✅ User created successfully!")
            print("   Username: engineer")
            print("   Email: xazratabduraufov@gmail.com")
            print("   Password: admin123")
            print("   Role: admin")
            return True
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    success = create_admin_user()
    sys.exit(0 if success else 1)
