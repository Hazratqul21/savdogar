import os
import ssl
from sqlalchemy import create_engine, text
from urllib.parse import quote_plus

# Connection details
user = "engineer"
# Trying without curly braces
password = "Xazrat_ali571" 
host = "aifoundry-postgres-dev-postgre.postgres.database.azure.com"
port = "5432"
default_db = "postgres"
target_db = "smartpos"

# URL encode password
encoded_password = quote_plus(password)

# Connect to default 'postgres' database
db_url = f"postgresql+pg8000://{user}:{encoded_password}@{host}:{port}/{default_db}"

print(f"Connecting to {host} with password '{password}'...")

# Create SSL context
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

try:
    engine = create_engine(
        db_url, 
        isolation_level="AUTOCOMMIT",
        connect_args={"ssl_context": ssl_context}
    )
    with engine.connect() as conn:
        print("Connected successfully!")
        
        # Check if database exists
        result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{target_db}'"))
        if result.scalar():
            print(f"Database '{target_db}' already exists.")
        else:
            print(f"Creating database '{target_db}'...")
            conn.execute(text(f"CREATE DATABASE {target_db}"))
            print(f"Database '{target_db}' created successfully!")
            
except Exception as e:
    print(f"Error: {e}")
