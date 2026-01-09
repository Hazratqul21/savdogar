# Environment Variables Setup Guide

## Vercel'da Environment Variable'lar Tartibi

Quyidagi tartibda Vercel Dashboard → Settings → Environment Variables'da sozlang:

### ✅ 1. ENVIRONMENT (REQUIRED)
```
ENVIRONMENT=production
```

### ✅ 2. DATABASE_URL (REQUIRED)
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

### ✅ 3. SECRET_KEY (REQUIRED - min 32 belgi)
```
SECRET_KEY=your-very-long-secret-key-minimum-32-characters-long
```

### ✅ 4. OPENAI_API_KEY (REQUIRED)
```
OPENAI_API_KEY=sk-proj-your-openai-api-key
```

### ✅ 5. CORS Sozlamalari
```
FRONTEND_URL=https://your-app.vercel.app
```
Yoki:
```
CORS_ORIGINS=https://your-app.vercel.app,https://www.your-app.com
```

### ⚙️ 6. Redis (Ixtiyoriy - Rate Limiting uchun)
```
REDIS_URL=redis://:password@host:6379/0
```

### ⚙️ 7. Supabase Storage (Ixtiyoriy)
```
STORAGE_TYPE=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=invoices
```

### ⚙️ 8. Frontend Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### ⚙️ 9. Logging
```
LOG_LEVEL=INFO
```

## To'liq Ro'yxat (Copy-Paste uchun)

Vercel'da quyidagi variable'larni qo'shing:

1. `ENVIRONMENT` = `production`
2. `DATABASE_URL` = `postgresql://...`
3. `SECRET_KEY` = `your-32-char-min-secret-key`
4. `OPENAI_API_KEY` = `sk-proj-...`
5. `FRONTEND_URL` = `https://your-app.vercel.app`
6. `REDIS_URL` = `redis://...` (ixtiyoriy)
7. `STORAGE_TYPE` = `supabase` (ixtiyoriy)
8. `SUPABASE_URL` = `https://...` (ixtiyoriy)
9. `SUPABASE_SERVICE_ROLE_KEY` = `...` (ixtiyoriy)
10. `SUPABASE_STORAGE_BUCKET` = `invoices` (ixtiyoriy)
11. `NEXT_PUBLIC_SUPABASE_URL` = `https://...` (ixtiyoriy)
12. `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `...` (ixtiyoriy)
13. `LOG_LEVEL` = `INFO` (ixtiyoriy)

## Muhim Eslatmalar

- ✅ **REQUIRED** - majburiy o'rnatish kerak
- ⚙️ **Ixtiyoriy** - faqat kerak bo'lsa o'rnating
- `SECRET_KEY` kamida 32 belgi bo'lishi kerak
- `DATABASE_URL` yoki alohida DB komponentlari kerak
- Production'da `ENVIRONMENT=production` majburiy
