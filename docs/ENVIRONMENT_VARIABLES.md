# Environment Variables Configuration Guide

Bu hujjat loyihadagi barcha environment variable'larning to'g'ri tartibini va sozlamalarini ko'rsatadi.

## Vercel Environment Variables Tartibi

Vercel'da quyidagi tartibda environment variable'larni sozlang:

### 1. Asosiy Environment Sozlamalari

```bash
# Environment type (REQUIRED)
ENVIRONMENT=production

# Yoki development uchun:
# ENVIRONMENT=development
```

### 2. Database Sozlamalari (REQUIRED)

```bash
# To'liq database URL (afzal)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Yoki alohida komponentlar:
# PGHOST=your-db-host
# PGUSER=your-db-user
# PGPASSWORD=your-db-password
# PGPORT=5432
# PGDATABASE=your-db-name
```

**Eslatma:** `DATABASE_URL` mavjud bo'lsa, u alohida komponentlardan ustun turadi.

### 3. Security Keys (REQUIRED)

```bash
# JWT token uchun secret key (min 32 belgi)
SECRET_KEY=your-very-long-secret-key-minimum-32-characters-long

# Token muddati (ixtiyoriy, default: 30 daqiqa)
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 4. CORS va Frontend Sozlamalari

```bash
# Frontend URL (production uchun)
FRONTEND_URL=https://your-domain.vercel.app

# Yoki CORS origins ro'yxati (vergul bilan ajratilgan)
CORS_ORIGINS=https://your-domain.vercel.app,https://www.your-domain.com
```

**Eslatma:** Agar `CORS_ORIGINS` o'rnatilgan bo'lsa, u `FRONTEND_URL` dan ustun turadi.

### 5. OpenAI API (REQUIRED)

```bash
# OpenAI API key
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
```

### 6. Redis Sozlamalari (Ixtiyoriy - Rate Limiting uchun)

```bash
# Redis URL (to'liq)
REDIS_URL=redis://:password@host:6379/0

# Yoki alohida komponentlar:
# REDIS_HOST=your-redis-host
# REDIS_PORT=6379
# REDIS_PASSWORD=your-redis-password
# REDIS_DB=0
```

**Eslatma:** Redis bo'lmasa, in-memory fallback ishlatiladi.

### 7. File Storage Sozlamalari (Ixtiyoriy)

```bash
# Storage turi: local yoki supabase
STORAGE_TYPE=supabase

# Supabase sozlamalari (STORAGE_TYPE=supabase bo'lsa)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_STORAGE_BUCKET=invoices
```

**Eslatma:** Production'da `STORAGE_TYPE=supabase` ishlatish tavsiya etiladi (serverless uchun).

### 8. Frontend Environment Variables (NEXT_PUBLIC_)

```bash
# API URL (ixtiyoriy - Vercel monorepo uchun bo'sh qoldirish mumkin)
NEXT_PUBLIC_API_URL=

# Supabase (Global Catalog uchun - ixtiyoriy)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Eslatma:** `NEXT_PUBLIC_API_URL` bo'sh bo'lsa, Vercel routing avtomatik ishlaydi.

### 9. Logging (Ixtiyoriy)

```bash
# Log level: DEBUG, INFO, WARNING, ERROR
LOG_LEVEL=INFO
```

## To'liq Misol (Production)

```bash
# Environment
ENVIRONMENT=production

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# Security
SECRET_KEY=your-very-long-secret-key-minimum-32-characters-long-for-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
FRONTEND_URL=https://your-app.vercel.app
# Yoki:
# CORS_ORIGINS=https://your-app.vercel.app,https://www.your-app.com

# OpenAI
OPENAI_API_KEY=sk-proj-your-openai-api-key

# Redis (ixtiyoriy)
REDIS_URL=redis://:password@host:6379/0

# Storage (ixtiyoriy)
STORAGE_TYPE=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=invoices

# Frontend
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Logging
LOG_LEVEL=INFO
```

## Muhim Eslatmalar

1. **SECRET_KEY** production'da majburiy va kamida 32 belgi bo'lishi kerak
2. **DATABASE_URL** yoki alohida database komponentlari majburiy
3. **OPENAI_API_KEY** AI funksiyalar uchun majburiy
4. **ENVIRONMENT=production** production deployment uchun majburiy
5. `NEXT_PUBLIC_` prefiksli variable'lar frontend'da ko'rinadi (xavfsizlik uchun ehtiyot bo'ling)

## Tekshirish

Environment variable'larni tekshirish uchun:

1. Vercel Dashboard → Settings → Environment Variables
2. Barcha variable'lar to'g'ri qiymatlarga ega ekanligini tekshiring
3. Production, Preview, va Development uchun alohida sozlash mumkin

## Xatoliklar

Agar login'da 405 xatosi bo'lsa:
- `CORS_ORIGINS` yoki `FRONTEND_URL` to'g'ri o'rnatilganligini tekshiring
- `ENVIRONMENT=production` o'rnatilganligini tekshiring
- Backend loglarida boshqa xatolar bo'lishi mumkin
