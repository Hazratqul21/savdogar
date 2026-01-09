#!/usr/bin/env python3
"""
Create admin user via MCP Supabase connection or direct database connection.
This script can be run locally or via MCP server connection.
"""
import sys
import os
from urllib.parse import quote_plus

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def create_user_via_database():
    """Create user via direct database connection."""
    from sqlalchemy import create_engine, text
    
    # Database connection (Session Pooler for Vercel compatibility)
    password = quote_plus("Xazrat_ali571")
    
    # Try Session Pooler first (port 6543) - works with Vercel
    database_urls = [
        # Session Pooler (recommended for Vercel)
        f"postgresql://postgres.twzxefwfjbupealjasum:{password}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require",
        f"postgresql://postgres.twzxefwfjbupealjasum:{password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require",
        # Direct connection (if Session Pooler doesn't work)
        f"postgresql://postgres:{password}@db.twzxefwfjbupealjasum.supabase.co:5432/postgres?sslmode=require",
    ]
    
    for db_url in database_urls:
        print(f"\n🔗 Trying: {db_url.split('@')[1].split('/')[0]}...")
        
        try:
            engine = create_engine(db_url, connect_args={"connect_timeout": 15})
            
            with engine.connect() as conn:
                # Test connection
                result = conn.execute(text("SELECT version()"))
                version = result.fetchone()[0]
                print(f"✅ Connected! PostgreSQL: {version[:60]}...")
                
                # Check if users table exists
                result = conn.execute(text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'users'
                    )
                """))
                
                if not result.fetchone()[0]:
                    print("❌ Users table does not exist. Run migrations first.")
                    return False
                
                # Hash password
                from passlib.context import CryptContext
                pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
                hashed_password = pwd_context.hash("admin123")
                
                # Check if user exists
                result = conn.execute(text("""
                    SELECT id FROM users 
                    WHERE username = :username OR email = :email
                """), {"username": "engineer", "email": "xazratabduraufov@gmail.com"})
                
                existing = result.fetchone()
                if existing:
                    print(f"⚠️ User already exists with ID: {existing[0]}")
                    # Update password anyway
                    conn.execute(text("""
                        UPDATE users 
                        SET hashed_password = :password,
                            full_name = :full_name,
                            role = :role,
                            is_active = true
                        WHERE username = :username
                    """), {
                        "username": "engineer",
                        "password": hashed_password,
                        "full_name": "Xazratqul",
                        "role": "super_admin"
                    })
                    conn.commit()
                    print("✅ User updated successfully!")
                    return True
                
                # Create tenant if not exists
                conn.execute(text("""
                    INSERT INTO tenants (name, business_type, subscription_plan, max_users, is_active)
                    VALUES ('Default Organization', 'retail', 'pro', 100, true)
                    ON CONFLICT DO NOTHING
                """))
                
                # Get tenant ID
                result = conn.execute(text("SELECT id FROM tenants LIMIT 1"))
                tenant_id = result.fetchone()[0] if result.fetchone() else None
                
                # Create user
                conn.execute(text("""
                    INSERT INTO users (
                        username, email, hashed_password, full_name, role, is_active, tenant_id
                    )
                    VALUES (
                        :username, :email, :password, :full_name, :role, true, :tenant_id
                    )
                """), {
                    "username": "engineer",
                    "email": "xazratabduraufov@gmail.com",
                    "password": hashed_password,
                    "full_name": "Xazratqul",
                    "role": "super_admin",
                    "tenant_id": tenant_id
                })
                
                conn.commit()
                print("✅ User created successfully!")
                print("\n📋 Login Credentials:")
                print("   Username: engineer")
                print("   Email: xazratabduraufov@gmail.com")
                print("   Password: admin123")
                print("   Role: super_admin")
                return True
                
        except Exception as e:
            error_str = str(e)
            if "Network is unreachable" in error_str:
                print(f"   ❌ Network unreachable (trying next URL...)")
                continue
            elif "Tenant or user not found" in error_str:
                print(f"   ❌ Wrong region (trying next URL...)")
                continue
            else:
                print(f"   ❌ Error: {error_str[:100]}")
                continue
    
    print("\n❌ Could not connect to database with any URL.")
    return False


if __name__ == "__main__":
    print("🚀 Creating admin user in Supabase database...")
    print("=" * 60)
    
    success = create_user_via_database()
    
    if success:
        print("\n✅ SUCCESS! You can now login with:")
        print("   Username: engineer")
        print("   Password: admin123")
    else:
        print("\n❌ FAILED! Please check:")
        print("   1. Database connection string")
        print("   2. Network connectivity")
        print("   3. Run migrations: alembic upgrade head")
    
    sys.exit(0 if success else 1)
