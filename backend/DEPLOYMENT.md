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

#### ⚠️ MUHIM: Root Directory
```
backend
```
**CRITICAL**: Root directory `backend` bo'lishi kerak, root emas!

#### Build & Output Settings
- Build Command: (bo'sh qoldiring - Vercel avtomatik Python detect qiladi)
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
- Vercel avtomatik ravishda `backend/api/index.py` ni topadi va deploy qiladi

## Vercel.json Configuration

**MUHIM**: Yangi Vercel versiyasida (2024-2025) FastAPI uchun zero-configuration support bor.

Minimal `vercel.json`:

```json
{
  "functions": {
    "api/index.py": {
      "maxDuration": 60
    }
  }
}
```

**NOTA BENE**: 
- `api/index.py` fayli `backend/api/` papkasida bo'lishi kerak (Vercel Python funksiyalari uchun `api/` papkasi talab qilinadi)
- `builds` property deprecated - ishlatilmaydi
- `rewrites` kerak emas - Vercel avtomatik detect qiladi
- `memory` limit optional - default ishlatiladi

## File Structure

Backend project strukturasi:

```
backend/
├── api/
│   └── index.py          # Vercel entry point (MUHIM!)
├── app/
│   ├── main.py           # FastAPI app
│   ├── api/v1/endpoints/ # API endpoints
│   └── ...
├── requirements.txt      # Python dependencies
├── vercel.json          # Vercel config (minimal)
└── ...
```

**MUHIM**: `api/index.py` fayli mavjudligini tekshiring!

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

### Error: "The pattern 'api/index.py' defined in `functions` doesn't match any Serverless Functions"

**Sabab**: `api/index.py` fayli topilmagan yoki `.vercelignore` da ignore qilingan.

**Yechim**:
1. `backend/api/index.py` fayli mavjudligini tekshiring
2. `.vercelignore` da `api/` ignore qilinmaganini tekshiring
3. Git'da `backend/api/index.py` commit qilinganligini tekshiring
4. Root directory `backend` bo'lishini tekshiring

### Backend topilmayapti
- Root directory `backend` bo'lishini tekshiring
- `backend/vercel.json` fayli mavjudligini tekshiring
- `backend/api/index.py` fayli mavjudligini tekshiring

### Builds va Functions conflict xatosi
- `vercel.json` da `builds` property yo'qligini tekshiring
- Faqat `functions` bo'lishi kerak

### Database ulanishi xato
- `DATABASE_URL` to'g'ri ekanligini tekshiring
- Supabase Session Pooler ishlatayotganingizni tekshiring (port: 6543)
- SSL mode `require` bo'lishini tekshiring

### Environment Variables
- Barcha required variables qo'shilganligini tekshiring
- Variable nomlari to'g'ri yozilganligini tekshiring (katta-kichik harf)

## Production Checklist

- [ ] Root directory: `backend`
- [ ] `backend/api/index.py` mavjud (NOT `backend/index.py`)
- [ ] `backend/vercel.json` da `builds` yo'q
- [ ] `backend/vercel.json` da faqat `functions` bor
- [ ] `DATABASE_URL` sozlangan
- [ ] `SECRET_KEY` sozlangan (min 32 character)
- [ ] `OPENAI_API_KEY` sozlangan
- [ ] `SUPABASE_URL` va `SUPABASE_SERVICE_ROLE_KEY` sozlangan
- [ ] `CORS_ORIGINS` frontend URL'ni o'z ichiga oladi
- [ ] Health check muvaffaqiyatli (`/api/v1/health`)
- [ ] API docs ochiladi (`/docs`)
