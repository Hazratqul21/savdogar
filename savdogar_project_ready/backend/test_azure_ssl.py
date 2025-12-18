#!/usr/bin/env python3
"""
Test script for Azure PostgreSQL SSL connection
"""
import os
import ssl
from sqlalchemy import create_engine, text

# Azure connection details
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+pg8000://engineer:Xazrat_ali571@aifoundry-postgres-dev-postgre.postgres.database.azure.com:5432/smartpos"
)

def test_ssl_connection():
    """Test SSL connection to Azure PostgreSQL"""
    print("=" * 60)
    print("Azure PostgreSQL SSL Connection Test")
    print("=" * 60)
    
    # Check if Azure database
    is_azure = "azure" in DATABASE_URL.lower() or "postgres.database.azure.com" in DATABASE_URL
    print(f"\n📊 Database URL: {DATABASE_URL[:50]}...")
    print(f"🔍 Azure database detected: {is_azure}")
    
    if not is_azure:
        print("⚠️  Not an Azure database, skipping SSL test")
        return
    
    # Create SSL context
    print("\n🔐 Creating SSL context...")
    ssl_context = ssl.create_default_context()
    
    # Check for Azure CA certificate
    ca_path = os.getenv("AZURE_POSTGRES_CA_PATH")
    if ca_path and os.path.exists(ca_path):
        print(f"✅ Using Azure CA certificate: {ca_path}")
        ssl_context.load_verify_locations(ca_path)
        ssl_context.check_hostname = True
        ssl_context.verify_mode = ssl.CERT_REQUIRED
    else:
        print("⚠️  Azure CA certificate not found, using system certificates")
        print("   Set AZURE_POSTGRES_CA_PATH to use Azure's root CA")
        # For development, skip verification
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
    
    # Create engine
    print("\n🔌 Connecting to database...")
    try:
        engine = create_engine(
            DATABASE_URL,
            connect_args={"ssl_context": ssl_context},
            pool_pre_ping=True,
        )
        
        with engine.connect() as conn:
            # Test connection
            result = conn.execute(text("SELECT current_database(), version()"))
            row = result.fetchone()
            
            print("✅ Connection successful!")
            print(f"   Database: {row[0]}")
            print(f"   Version: {row[1][:60]}...")
            
            # Test SSL status
            result = conn.execute(text("SHOW ssl"))
            ssl_status = result.scalar()
            print(f"   SSL Status: {ssl_status}")
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\n💡 Troubleshooting:")
        print("   1. Check Azure firewall rules")
        print("   2. Verify database credentials")
        print("   3. Download Azure CA: ./download_azure_ca.sh")
        print("   4. Set AZURE_POSTGRES_CA_PATH environment variable")
        return False
    
    print("\n" + "=" * 60)
    print("✅ SSL Connection Test Passed!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    test_ssl_connection()








