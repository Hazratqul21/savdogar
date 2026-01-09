# Vercel + Supabase To'liq Sozlash Qo'llanmasi

## ⚠️ MUHIM: Vercel IPv4 bilan ishlamaydi!

Supabase Direct Connection (port 5432) **Vercel'da ishlamaydi** chunki Vercel IPv4-only platform.

**Yechim:** Session Pooler (port 6543) ishlatish kerak!

---

## 📋 Qadam 1: Supabase Session Pooler URL olish

### 1. Supabase Dashboard'ga kiring
- https://supabase.com/dashboard
- Loyihangizni tanlang: `twzxefwfjbupealjasum`

### 2. Settings → Database ga o'ting

### 3. Connection Pooling bo'limini toping

### 4. Session mode ni tanlang

### 5. Connection string ni nusxalang

**Format:**
```
postgresql://postgres.twzxefwfjbupealjasum:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

**Yoki sizning holatda:**
```
postgresql://postgres.twzxefwfjbupealjasum:Xazrat_ali571@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
```

⚠️ **Eslatma:** 
- Port **6543** bo'lishi kerak (5432 emas!)
- `pooler.supabase.com` bo'lishi kerak
- `?sslmode=require` oxiriga qo'shish kerak

---

## 📋 Qadam 2: Vercel Environment Variables qo'shish

### 1. Vercel Dashboard'ga kiring
- https://vercel.com/dashboard
- Loyihangizni tanlang

### 2. Settings → Environment Variables ga o'ting

### 3. Quyidagi variable'larni qo'shing:

#### ✅ 1. ENVIRONMENT
```
Name: ENVIRONMENT
Value: production
Environment: Production, Preview, Development (hammasiga)
```

#### ✅ 2. DATABASE_URL (Session Pooler)
```
Name: DATABASE_URL
Value: postgresql://postgres.twzxefwfjbupealjasum:Xazrat_ali571@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
Environment: Production, Preview, Development (hammasiga)
```

⚠️ **Muhim:** 
- Parolda maxsus belgilar bo'lsa (`[`, `]`), URL encode qilish kerak
- `Xazrat_ali571` parolida `[` va `]` bor, shuning uchun:
  - Agar `[Xazrat_ali571]` bo'lsa → `%5BXazrat_ali571%5D`
  - Agar `Xazrat_ali571` bo'lsa → `Xazrat_ali571` (unchanged)

**To'g'ri format:**
```
postgresql://postgres.twzxefwfjbupealjasum:Xazrat_ali571@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
```

#### ✅ 3. SECRET_KEY
```
Name: SECRET_KEY
Value: xazratqul-savdogar-secret-key-2024-production-min-32-chars
Environment: Production, Preview, Development (hammasiga)
```

⚠️ **Muhim:** SECRET_KEY kamida 32 belgi bo'lishi kerak!

#### ✅ 4. FRONTEND_URL (ixtiyoriy, lekin tavsiya etiladi)
```
Name: FRONTEND_URL
Value: https://savdo-gar.uz
Environment: Production
```

#### ✅ 5. OPENAI_API_KEY (agar AI funksiyalar kerak bo'lsa)
```
Name: OPENAI_API_KEY
Value: sk-proj-...
Environment: Production, Preview, Development (hammasiga)
```

---

## 📋 Qadam 3: Region tekshirish

Agar `aws-0-eu-central-1` ishlamasa, boshqa region'larni sinab ko'ring:

### Region variantlari:
1. `aws-0-eu-central-1` (Yevropa - Markaziy)
2. `aws-0-us-east-1` (AQSH - Sharqiy)
3. `aws-0-ap-southeast-1` (Osiyo - Janubi-Sharqiy)

**Qanday topish:**
1. Supabase Dashboard → Settings → Database
2. Connection Pooling → Session mode
3. U yerda region ko'rsatiladi

---

## 📋 Qadam 4: Parol URL Encoding

Agar parolda maxsus belgilar bo'lsa:

| Belgi | URL Encoded |
|-------|-------------|
| `[` | `%5B` |
| `]` | `%5D` |
| `@` | `%40` |
| `:` | `%3A` |
| `/` | `%2F` |
| `?` | `%3F` |
| `#` | `%23` |
| `%` | `%25` |

**Misol:**
- Parol: `[Xazrat_ali571]`
- Encoded: `%5BXazrat_ali571%5D`
- URL: `postgresql://postgres.twzxefwfjbupealjasum:%5BXazrat_ali571%5D@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require`

---

## 📋 Qadam 5: Tekshirish

### 1. Redeploy qiling
- Vercel Dashboard → Deployments
- Latest deployment → "..." → Redeploy

### 2. Health check
- `https://savdo-gar.uz/health` ga kiring
- Database status "healthy" bo'lishi kerak

### 3. Login test
- `https://savdo-gar.uz/login` ga kiring
- Username: `engineer`
- Password: `admin123`

---

## 🔍 Xatolarni tekshirish

### Xatolik: "Network is unreachable"
**Sabab:** Direct connection (port 5432) ishlatilgan  
**Yechim:** Session Pooler (port 6543) ishlatish

### Xatolik: "Tenant or user not found"
**Sabab:** Noto'g'ri project reference yoki region  
**Yechim:** To'g'ri region va project reference tekshiring

### Xatolik: "SSL connection required"
**Sabab:** `?sslmode=require` yo'q  
**Yechim:** URL oxiriga `?sslmode=require` qo'shing

### Xatolik: "Authentication failed"
**Sabab:** Noto'g'ri parol  
**Yechim:** Parolni to'g'ri URL encode qiling

---

## ✅ To'g'ri DATABASE_URL format

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

**Sizning holatda:**
```
postgresql://postgres.twzxefwfjbupealjasum:Xazrat_ali571@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
```

---

## 📝 Checklist

- [ ] Supabase Session Pooler URL olingan (port 6543)
- [ ] Vercel'ga DATABASE_URL qo'shilgan
- [ ] `?sslmode=require` qo'shilgan
- [ ] ENVIRONMENT=production qo'shilgan
- [ ] SECRET_KEY qo'shilgan (min 32 belgi)
- [ ] Redeploy qilingan
- [ ] Health check ishlayapti
- [ ] Login ishlayapti

---

## 🆘 Yordam kerak bo'lsa

1. Vercel Logs'ni tekshiring: Deployments → Latest → Logs
2. Health check endpoint: `/health`
3. Database connection xatoliklarini tekshiring
