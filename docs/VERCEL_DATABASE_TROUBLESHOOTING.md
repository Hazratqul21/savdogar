# Vercel Database Connection Troubleshooting Guide

## Muammo: Vercel'dan database'ga ulanib bo'lmayapti

Agar siz Vercel loglarida faqat frontend GET so'rovlari ko'rsatilayotgan bo'lsa va database ulanish xatolari ko'rinmasa, quyidagi qadamlarni bajaring:

---

## 1. Vercel'da Batafsil Function Loglarini Ko'rish

Siz ko'rsatgan loglar faqat **overview** loglari. Asosiy muammo **function execution logs**da bo'lishi mumkin.

### Qanday ko'rish:

1. **Vercel Dashboard** → **Your Project** → **Deployments**
2. **Eng so'nggi deployment**ni tanlang
3. **Functions** tab'ini oching
4. **`frontend/api/index.py`** function'ini tanlang
5. **Logs** bo'limida batafsil loglarni ko'ring

Yoki:

1. **Vercel Dashboard** → **Your Project** → **Logs**
2. **Function** filter'ini tanlang
3. **`frontend/api/index.py`** ni tanlang
4. Barcha loglarni ko'ring

---

## 2. Health Endpoint'ni Test Qiling

Browser yoki `curl` bilan test qiling:

```bash
# Health check
curl https://www.savdo-gar.uz/health

# Diagnostic check (environment variables status)
curl https://www.savdo-gar.uz/health/diagnostic
```

Yoki browser'da oching:
- `https://www.savdo-gar.uz/health`
- `https://www.savdo-gar.uz/health/diagnostic`

Bu endpoint'lar quyidagilarni ko'rsatadi:
- Database connection status
- Environment variables to'g'ri o'rnatilganligi
- Database URL konfiguratsiyasi (masked)

---

## 3. Vercel Environment Variables'ni Tekshiring

### Vercel Dashboard'da:

1. **Settings** → **Environment Variables**
2. Quyidagi o'zgaruvchilar mavjudligini tekshiring:

#### ✅ Majburiy Environment Variables:

```
ENVIRONMENT=production
DATABASE_URL=postgresql://postgres.twzxefwfjbupealjasum:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
SECRET_KEY=[min 32 characters]
FRONTEND_URL=https://www.savdo-gar.uz
```

#### ⚠️ Muhim Eslatmalar:

1. **DATABASE_URL** Supabase **Session Pooler** (port **6543**) bo'lishi kerak:
   ```
   ✅ TO'G'RI: ...pooler.supabase.com:6543...
   ❌ NOTO'G'RI: ...supabase.co:5432...
   ```

2. **Parol URL-encoded** bo'lishi kerak:
   - Agar parol: `Xazrat_ali571`
   - URL-encoded: `Xazrat_ali571` (bu holatda encoding kerak emas)
   - Lekin agar parol: `pass@word#123` bo'lsa, `pass%40word%23123` bo'lishi kerak

3. **sslmode=require** bo'lishi kerak:
   ```
   ?sslmode=require
   ```

---

## 4. Supabase Session Pooler URL'ni Olish

### To'g'ri URL format:

1. **Supabase Dashboard** → **Project Settings** → **Database**
2. **Connection Pooling** bo'limini oching
3. **Session mode** ni tanlang
4. **Connection string** ni oling

**Format:**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

**Misol:**
```
postgresql://postgres.twzxefwfjbupealjasum:Xazrat_ali571@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
```

---

## 5. Environment Variables'ni To'g'ri Qo'shish

### Vercel Dashboard'da:

1. **Settings** → **Environment Variables**
2. **Add New** tugmasini bosing
3. Har bir o'zgaruvchini qo'shing:

| Key | Value | Production | Preview | Development |
|-----|-------|------------|---------|-------------|
| `ENVIRONMENT` | `production` | ✅ | ✅ | ✅ |
| `DATABASE_URL` | `postgresql://...` | ✅ | ✅ | ✅ |
| `SECRET_KEY` | `[32+ chars]` | ✅ | ✅ | ✅ |
| `FRONTEND_URL` | `https://www.savdo-gar.uz` | ✅ | ✅ | ✅ |

4. **Save** tugmasini bosing
5. **Redeploy** qiling

---

## 6. Redeploy Qilish

Environment variables'ni o'zgartirgandan keyin **majburiy redeploy** qilish kerak:

1. **Deployments** → **Latest Deployment**
2. **Redeploy** tugmasini bosing
3. Yoki **git push** qiling (automatic redeploy)

---

## 7. Loglarni Tekshirish

Redeploy'dan keyin:

1. **Logs** bo'limiga kiring
2. Quyidagi loglarni qidiring:

```
✅ Mangum handler initialized successfully
📊 Database Host: aws-0-eu-central-1.pooler.supabase.com:6543
📊 Connection Type: Session Pooler (✅)
📊 Has SSL: ✅
✅ DATABASE_URL is configured
```

Agar quyidagi xatolarni ko'rsangiz:

```
❌ DATABASE_URL or POSTGRES_URL not set in environment variables!
```

Bu environment variable o'rnatilmaganligini anglatadi.

---

## 8. Test Qilish

### Browser'da:

1. `https://www.savdo-gar.uz/health` - Database connection status
2. `https://www.savdo-gar.uz/health/diagnostic` - Environment variables status
3. `https://www.savdo-gar.uz/api/v1/auth/login` - Login endpoint (POST)

### cURL bilan:

```bash
# Health check
curl https://www.savdo-gar.uz/health

# Diagnostic
curl https://www.savdo-gar.uz/health/diagnostic

# Login test (POST)
curl -X POST https://www.savdo-gar.uz/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=engineer&password=admin123"
```

---

## 9. Umumiy Xatolar va Yechimlar

### Xatolik 1: "DATABASE_URL not set"
**Yechim:** Vercel'da `DATABASE_URL` environment variable'ni qo'shing

### Xatolik 2: "Connection timeout"
**Yechim:** 
- Session Pooler (port 6543) ishlatilayotganini tekshiring
- `sslmode=require` borligini tekshiring

### Xatolik 3: "SSL error"
**Yechim:** 
- `?sslmode=require` URL'ga qo'shing
- Direct connection (5432) o'rniga Session Pooler (6543) ishlating

### Xatolik 4: "Authentication failed"
**Yechim:**
- Parol to'g'riligini tekshiring
- Parol URL-encoded bo'lishi kerak (agar maxsus belgilar bo'lsa)

### Xatolik 5: "Not IPv4 compatible"
**Yechim:**
- Direct connection (5432) o'rniga **Session Pooler (6543)** ishlating
- Bu muammo Supabase'da keng tarqalgan

---

## 10. Tekshiruv Ro'yxati

Redeploy'dan oldin tekshiring:

- [ ] `ENVIRONMENT=production` o'rnatilgan
- [ ] `DATABASE_URL` Session Pooler (port 6543) formatida
- [ ] `DATABASE_URL` da `sslmode=require` bor
- [ ] `SECRET_KEY` kamida 32 belgi
- [ ] `FRONTEND_URL` to'g'ri o'rnatilgan
- [ ] Barcha environment variables **Production** environment uchun enabled
- [ ] Redeploy qilingan

---

## 11. Qo'shimcha Yordam

Agar muammo hal bo'lmasa:

1. **Vercel Function Logs**'ni to'liq ko'ring (faqat overview emas)
2. `/health/diagnostic` endpoint'ni ochib, natijani ko'ring
3. Database connection xatolarini aniq ko'rsating
4. Environment variables'lar ro'yxatini ko'rsating (sensitive ma'lumotlarsiz)

---

## 12. To'g'ri DATABASE_URL Misoli

```bash
# ✅ TO'G'RI FORMAT (Session Pooler)
DATABASE_URL=postgresql://postgres.twzxefwfjbupealjasum:Xazrat_ali571@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require

# ❌ NOTO'G'RI (Direct connection - IPv6 muammosi)
DATABASE_URL=postgresql://postgres:Xazrat_ali571@db.twzxefwfjbupealjasum.supabase.co:5432/postgres

# ❌ NOTO'G'RI (SSL yo'q)
DATABASE_URL=postgresql://postgres.twzxefwfjbupealjasum:Xazrat_ali571@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

---

**Eslatma:** Agar siz hali ham muammo ko'rsangiz, `/health/diagnostic` endpoint'ni ochib, natijani menga yuboring. Bu men muammoni aniqroq tushunishimga yordam beradi.
