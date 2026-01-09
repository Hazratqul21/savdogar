# MCP Serverlar orqali Supabase Database'ga Ulanish

## ✅ MCP Serverlar Nima?

MCP (Model Context Protocol) serverlar orqali siz Supabase database'ga to'g'ridan-to'g'ri ulanish va SQL so'rovlar bajarishingiz mumkin.

---

## 📋 Qadam 1: MCP Serverlar Sozlash

### Cursor Settings → MCP Servers

1. **Cursor Settings** ga kiring (Ctrl+,)
2. **MCP Servers** bo'limini toping
3. **Supabase MCP Server** ni qo'shing

**Config format:**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server"
      ],
      "env": {
        "SUPABASE_URL": "https://twzxefwfjbupealjasum.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

---

## 📋 Qadam 2: Service Role Key olish

1. **Supabase Dashboard** → **Settings** → **API**
2. **Service Role Key** ni ko'ring (⚠️ Bu maxfiy kalit!)
3. Nusxalang

---

## 📋 Qadam 3: Database'ga Ulanish va Foydalanuvchi Yaratish

### Variant A: MCP Serverlar orqali (Cursor ichida)

Cursor'da quyidagi buyruqni bering:

```
MCP Supabase server orqali database'ga ulaning va quyidagi SQL kodni ishga tushiring:

1. Avval tenants jadvalini yarating (agar yo'q bo'lsa)
2. Keyin foydalanuvchi yarating:
   - Username: engineer
   - Email: xazratabduraufov@gmail.com
   - Password: admin123 (bcrypt hash)
   - Full name: Xazratqul
   - Role: super_admin
```

### Variant B: SQL Editor orqali (Supabase Dashboard)

1. **Supabase Dashboard** → **SQL Editor**
2. Quyidagi SQL kodni nusxalang va ishga tushiring:

```sql
-- Create tenants table if not exists
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    business_type VARCHAR(50) DEFAULT 'retail',
    subscription_plan VARCHAR(50) DEFAULT 'pro',
    max_users INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default tenant
INSERT INTO tenants (name, business_type, subscription_plan, max_users, is_active)
VALUES ('Default Organization', 'retail', 'pro', 100, true)
ON CONFLICT DO NOTHING;

-- Insert admin user
INSERT INTO users (
    username, 
    email, 
    hashed_password, 
    full_name, 
    role, 
    is_active,
    tenant_id
)
VALUES (
    'engineer',
    'xazratabduraufov@gmail.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4nFJsWQxqgqKqaWi',  -- admin123
    'Xazratqul',
    'super_admin',  -- ✅ CORRECT enum value
    true,
    (SELECT id FROM tenants LIMIT 1)
)
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Verify
SELECT id, username, email, full_name, role, is_active 
FROM users 
WHERE username = 'engineer';
```

---

## 📋 Qadam 4: Vercel Environment Variables

MCP serverlar orqali database'ga ulanish **faqat lokal** uchun. Vercel'da ham ishlashi uchun environment variable'lar kerak.

### Vercel Dashboard → Settings → Environment Variables:

#### 1. DATABASE_URL (Session Pooler)
```
Name: DATABASE_URL
Value: postgresql://postgres.twzxefwfjbupealjasum:Xazrat_ali571@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
```

⚠️ **Muhim:** 
- Port **6543** (Session Pooler)
- `pooler.supabase.com` host
- `?sslmode=require` oxirida

#### 2. ENVIRONMENT
```
Name: ENVIRONMENT
Value: production
```

#### 3. SECRET_KEY
```
Name: SECRET_KEY
Value: xazratqul-savdogar-secret-key-2024-production-min-32-chars
```

#### 4. FRONTEND_URL
```
Name: FRONTEND_URL
Value: https://savdo-gar.uz
```

---

## 🔍 MCP Serverlar Imkoniyatlari

MCP serverlar orqali siz:

1. ✅ Database'ga ulanish
2. ✅ SQL so'rovlar bajarish
3. ✅ Jadval yaratish/o'zgartirish
4. ✅ Ma'lumot qo'shish/o'chirish
5. ✅ Migration'lar ishga tushirish

**Lekin:**
- ❌ Vercel production'da ishlamaydi (faqat lokal)
- ✅ Vercel uchun environment variable'lar kerak

---

## 📝 To'liq SQL Script

`docs/CREATE_USER_CORRECT.sql` faylida to'liq SQL script bor.

---

## ✅ Checklist

- [ ] MCP Supabase server sozlangan
- [ ] Service Role Key olingan
- [ ] SQL Editor orqali foydalanuvchi yaratilgan
- [ ] Vercel'ga DATABASE_URL qo'shilgan (Session Pooler)
- [ ] Vercel'ga boshqa environment variable'lar qo'shilgan
- [ ] Redeploy qilingan
- [ ] Login test qilingan

---

## 🆘 Yordam

Agar MCP serverlar ishlamasa:
1. SQL Editor orqali to'g'ridan-to'g'ri yarating (yuqoridagi SQL kod)
2. Vercel environment variable'larini to'g'ri sozlang
3. Redeploy qiling
