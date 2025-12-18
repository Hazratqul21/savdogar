# Azure PostgreSQL SSL Configuration Guide

## 🎯 Overview

Azure Database for PostgreSQL Flexible Server **requires SSL/TLS encryption** for all connections. This guide explains how to properly configure SSL connections.

---

## ✅ Current Configuration

The database connection has been updated to:
1. **Automatically detect Azure databases**
2. **Enable SSL for Azure connections**
3. **Support certificate verification**
4. **Work with both local and Azure databases**

---

## 🔧 Configuration Details

### 1. Automatic Detection

The system automatically detects:
- **Azure Database**: If URL contains `azure` or `postgres.database.azure.com`
- **Local Database**: If server is `127.0.0.1` or `localhost`
- **Production Mode**: Based on `ENVIRONMENT=production` variable

### 2. SSL Modes

#### Azure Database (Production)
```python
# Full certificate verification (recommended)
ssl_context.check_hostname = True
ssl_context.verify_mode = ssl.CERT_REQUIRED
```

#### Azure Database (Development)
```python
# Skip verification (for development only)
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE
```

#### Local Database
- SSL is **optional** for local databases
- Set `POSTGRES_REQUIRE_SSL=true` to enable SSL locally

---

## 📋 Setup Instructions

### Option 1: Use Azure Root CA Certificate (Recommended for Production)

1. **Download Azure Root CA:**
```bash
cd /home/ali/dokon/backend
./download_azure_ca.sh
```

2. **Set Environment Variable:**
```bash
export AZURE_POSTGRES_CA_PATH="/home/ali/dokon/backend/certs/DigiCertGlobalRootG2.crt.pem"
```

3. **Update PM2 Config:**
Add to `ecosystem.config.js`:
```javascript
env: {
  AZURE_POSTGRES_CA_PATH: '/home/ali/dokon/backend/certs/DigiCertGlobalRootG2.crt.pem',
  ENVIRONMENT: 'production',  // For production mode
  // ... other vars
}
```

### Option 2: Use System Certificates (Default)

The system will use Python's default certificate store:
```python
ssl_context = ssl.create_default_context()  # Loads system certificates
```

### Option 3: Development Mode (Skip Verification)

For development, verification can be skipped:
```python
# Automatically done if ENVIRONMENT != "production"
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE
```

---

## 🔍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Full database connection string | Auto-generated |
| `AZURE_POSTGRES_CA_PATH` | Path to Azure root CA certificate | None (uses system certs) |
| `ENVIRONMENT` | Environment mode (`production`/`development`) | `development` |
| `POSTGRES_REQUIRE_SSL` | Force SSL for local database | `false` |

---

## 🚀 Testing

### Test Azure Connection
```bash
cd /home/ali/dokon/backend
source venv/bin/activate

# Test with Azure CA
export AZURE_POSTGRES_CA_PATH="/home/ali/dokon/backend/certs/DigiCertGlobalRootG2.crt.pem"
export DATABASE_URL="postgresql+pg8000://engineer:Xazrat_ali571@aifoundry-postgres-dev-postgre.postgres.database.azure.com:5432/smartpos"

python3 -c "
from app.core.database import engine, SessionLocal
from sqlalchemy import text
db = SessionLocal()
try:
    result = db.execute(text('SELECT version()'))
    print('✅ Connected:', result.scalar())
except Exception as e:
    print('❌ Error:', e)
finally:
    db.close()
"
```

### Test Local Connection
```bash
export POSTGRES_SERVER="127.0.0.1"
export POSTGRES_PORT="5433"
export POSTGRES_DB="smartpos"

python3 -c "
from app.core.database import engine, SessionLocal
from sqlalchemy import text
db = SessionLocal()
try:
    result = db.execute(text('SELECT version()'))
    print('✅ Connected:', result.scalar())
except Exception as e:
    print('❌ Error:', e)
finally:
    db.close()
"
```

---

## 📝 PM2 Configuration

Update `ecosystem.config.js`:

```javascript
env: {
  DATABASE_URL: 'postgresql+pg8000://engineer:Xazrat_ali571@aifoundry-postgres-dev-postgre.postgres.database.azure.com:5432/smartpos',
  AZURE_POSTGRES_CA_PATH: '/home/ali/dokon/backend/certs/DigiCertGlobalRootG2.crt.pem',  // Optional
  ENVIRONMENT: 'production',  // Set to 'production' for full SSL verification
  // ... other vars
}
```

---

## 🔒 Security Best Practices

### Production
1. ✅ **Always use SSL** for Azure connections
2. ✅ **Enable certificate verification** (`CERT_REQUIRED`)
3. ✅ **Use Azure's root CA certificate**
4. ✅ **Set `ENVIRONMENT=production`**

### Development
1. ⚠️ **SSL verification can be skipped** for development
2. ⚠️ **Never skip verification in production**

---

## 🐛 Troubleshooting

### Error: "no pg_hba.conf entry"
- **Cause**: IP not whitelisted in Azure firewall
- **Fix**: Add your IP to Azure Portal → Networking → Firewall rules

### Error: "SSL connection required"
- **Cause**: SSL not enabled
- **Fix**: Code automatically enables SSL for Azure (already fixed)

### Error: "certificate verify failed"
- **Cause**: Certificate verification failing
- **Fix**: 
  1. Download Azure CA: `./download_azure_ca.sh`
  2. Set `AZURE_POSTGRES_CA_PATH` environment variable
  3. Or set `ENVIRONMENT=development` (development only)

### Error: "connection timeout"
- **Cause**: Network/firewall issue
- **Fix**: Check Azure firewall rules and network connectivity

---

## ✅ Verification

After configuration, verify the connection:

```bash
# Check if SSL is working
curl http://localhost:8000/api/v1/health/db

# Test signup (requires database connection)
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123456"}'
```

---

## 📚 References

- [Azure PostgreSQL SSL/TLS](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/how-to-connect-tls-ssl)
- [DigiCert Root CA](https://cacerts.digicert.com/DigiCertGlobalRootG2.crt.pem)
- [SQLAlchemy SSL](https://docs.sqlalchemy.org/en/14/core/engines.html#ssl-arguments)

---

## 🎯 Summary

✅ **SSL is automatically enabled** for Azure databases
✅ **Certificate verification** can be configured
✅ **Works with both local and Azure** databases
✅ **Production-ready** SSL configuration

**Next Step**: Download Azure CA certificate and set `AZURE_POSTGRES_CA_PATH` for production use.








