# 🚨 500 Error Fix - Database FK Constraint

## ❗ Muammo

```
POST /api/v1/v2/products/ → 500 Internal Server Error
db.flush() fails at SQLAlchemy INSERT
```

**Root Cause:** Foreign Key constraint violation

- `products_v2.tenant_id` references `tenants.id`
- User `organization_id` ishlatmoqda (eski tizim)
- Backend `tenant_id = organization_id` deb o'rnatmoqda
- Lekin `organization_id` `tenants` jadvalida yo'q

## ✅ Yechim 1: Database Sync (Tavsiya etiladi)

### Supabase SQL Editor'da ishga tushiring:

```sql
-- Step 1: Organizations → Tenants sync
INSERT INTO tenants (id, name, business_type, is_active, created_at)
SELECT 
    id, 
    name, 
    'retail' as business_type,
    is_active,
    created_at
FROM organizations
WHERE id NOT IN (SELECT id FROM tenants)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Users tenant_id sync
UPDATE users 
SET tenant_id = organization_id 
WHERE tenant_id IS NULL AND organization_id IS NOT NULL;

-- Step 3: Verify
SELECT 
    u.id, u.username, u.tenant_id, u.organization_id,
    t.name as tenant_name
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
WHERE u.is_active = TRUE
LIMIT 5;
```

## ✅ Yechim 2: FK Constraint O'chirish (Tezkor, lekin tavsiya etilmaydi)

```sql
-- Temporarily remove FK constraint
ALTER TABLE products_v2 DROP CONSTRAINT IF EXISTS products_v2_tenant_id_fkey;
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_tenant_id_fkey;

-- Test product creation
-- ...

-- Re-add FK constraint (after fixing data)
ALTER TABLE products_v2 
ADD CONSTRAINT products_v2_tenant_id_fkey 
FOREIGN KEY (tenant_id) REFERENCES tenants(id);
```

## ✅ Yechim 3: Backend Code Fix (Alternative)

Agar database'ni o'zgartira olmasangiz, backend'da FK constraint'siz ishlash:

**Option A:** Mahsulot yaratishda error handling:

```python
# backend/app/api/v1/endpoints/products_v2.py
try:
    db.add(product_obj)
    db.flush()
except IntegrityError as e:
    # FK constraint violation
    if "tenant_id" in str(e):
        # Create missing tenant
        tenant = Tenant(id=tenant_id, name=f"Tenant {tenant_id}")
        db.add(tenant)
        db.commit()
        # Retry product creation
```

**Option B:** Tenantni auto-create qilish:

```python
# Ensure tenant exists before creating product
from app.models.tenant import Tenant
if not db.query(Tenant).filter(Tenant.id == tenant_id).first():
    tenant = Tenant(
        id=tenant_id,
        name=f"Organization {tenant_id}",
        business_type="retail"
    )
    db.add(tenant)
    db.flush()
```

## 🧪 Test Qilish

1. **Supabase SQL Editor'da yuqoridagi SQL'ni ishga tushiring**
2. **2-3 daqiqa kuting** (Vercel cache)
3. **Browser'ni yangilang** (Ctrl + Shift + R)
4. **Mahsulot qo'shishga harakat qiling**

## 📊 Status Check

```sql
-- Check if sync worked
SELECT 
    (SELECT COUNT(*) FROM users WHERE tenant_id IS NOT NULL) as users_with_tenant,
    (SELECT COUNT(*) FROM users WHERE organization_id IS NOT NULL AND tenant_id IS NULL) as users_missing_tenant,
    (SELECT COUNT(*) FROM tenants) as total_tenants;
```

---

**Created:** 2026-01-12 04:55 UTC  
**Status:** 🔄 Requires database migration  
**Priority:** HIGH
