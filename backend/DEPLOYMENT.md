# Backend Deployment Guide - Vercel

Backend'ni Vercel'da deploy qilish uchun quyidagi qadamlarni bajaring.

## Vercel'da Alohida Project Yaratish

### 1. Vercel Dashboard'ga kiring
- https://vercel.com/dashboard ga kiring
- "Add New" → "Project" ni bosing

### 2. GitHub Repository'ni ulang
- Repository: `Hazratqul21/savdogar` ni tanlang
- Framework Preset: **"Other"** yoki **"Python"** ni tanlang

### 3. Project Settings'ni sozlang

#### Root Directory
```
backend
```
⚠️ **MUHIM**: Root directory `backend` bo'lishi kerak, root emas!

#### Build & Output Settings
- Build Command: (bo'sh qoldiring - `@vercel/python` avtomatik build qiladi)
- Output Directory: (bo'sh qoldiring)
- Install Command: (bo'sh qoldiring, Vercel `requirements.txt` dan avtomatik install qiladi)

#### Environment Variables
Quyidagi environment variables'ni qo'shing:

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
# yoki
PGHOST=your-host
PGUSER=your-user
PGPASSWORD=your-password
PGDATABASE=your-database
PGPORT=5432

# Security (REQUIRED)
SECRET_KEY=your-secret-key-at-least-32-characters-long

# OpenAI (REQUIRED for AI features)
OPENAI_API_KEY=sk-...

# Supabase (REQUIRED for file storage)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=invoices

# CORS (REQUIRED)
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000

# Environment
ENVIRONMENT=production
```

### 4. Deploy qiling
- "Deploy" ni bosing
- Vercel avtomatik ravishda `backend/vercel.json` ni topadi va deploy qiladi

## Verification

Deploy qilingandan keyin:

1. **Health Check**:
   ```
   https://your-backend.vercel.app/api/v1/health
   ```
   Response: `{"status": "ok"}` bo'lishi kerak

2. **API Docs**:
   ```
   https://your-backend.vercel.app/docs
   ```
   Swagger UI ochilishi kerak

3. **Test Endpoint**:
   ```
   https://your-backend.vercel.app/api/v1/auth/signup
   ```

## Troubleshooting

### Backend topilmayapti
- Root directory `backend` bo'lishini tekshiring
- `backend/vercel.json` fayli mavjudligini tekshiring
- `backend/index.py` fayli mavjudligini tekshiring

### Database ulanishi xato
- `DATABASE_URL` to'g'ri ekanligini tekshiring
- Supabase Session Pooler ishlatayotganingizni tekshiring (port: 6543)
- SSL mode `require` bo'lishini tekshiring

### Environment Variables
- Barcha required variables qo'shilganligini tekshiring
- Variable nomlari to'g'ri yozilganligini tekshiring (katta-kichik harf)

## Production Checklist

- [ ] Root directory: `backend`
- [ ] `DATABASE_URL` sozlangan
- [ ] `SECRET_KEY` sozlangan (min 32 character)
- [ ] `OPENAI_API_KEY` sozlangan
- [ ] `SUPABASE_URL` va `SUPABASE_SERVICE_ROLE_KEY` sozlangan
- [ ] `CORS_ORIGINS` frontend URL'ni o'z ichiga oladi
- [ ] Health check muvaffaqiyatli (`/api/v1/health`)
- [ ] API docs ochiladi (`/docs`)
