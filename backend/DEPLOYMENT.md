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

**MUHIM**: Yangi Vercel versiyasida (2024-2025) FastAPI uchun **zero-configuration** support bor.

`vercel.json` **kerak emas** - Vercel avtomatik detect qiladi!

Vercel avtomatik ravishda:
- `api/` papkasini topadi
- `api/index.py` ni serverless function sifatida deploy qiladi
- `requirements.txt` dan dependencies install qiladi

Agar timeout config kerak bo'lsa (default 10s, max 300s), Vercel Dashboard → Functions → Settings dan sozlashingiz mumkin.

**NOTA BENE**: 
- `api/index.py` fayli `backend/api/` papkasida bo'lishi kerak
- `vercel.json` kerak emas - zero-config!
- Root directory `backend` bo'lishi kerak

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
├── requirements.txt      # Python dependencies (MUHIM!)
└── ...                   # vercel.json KERAK EMAS!
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

**Sabab**: `vercel.json` da `functions` property bor, lekin Vercel zero-config ishlatmoqda.

**Yechim**: 
1. `backend/vercel.json` faylini **O'CHIRING** (kerak emas!)
2. Vercel avtomatik detect qiladi
3. Timeout config kerak bo'lsa, Vercel Dashboard → Functions → Settings dan sozlang

### Backend topilmayapti
- Root directory `backend` bo'lishini tekshiring
- `backend/api/index.py` fayli mavjudligini tekshiring (NOT `backend/index.py`)
- `.vercelignore` da `api/` ignore qilinmaganini tekshiring

### Builds va Functions conflict xatosi
- `vercel.json` faylini **O'CHIRING** - kerak emas!
- Vercel zero-config ishlatadi

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
- [ ] `backend/vercel.json` **YO'Q** (zero-config!)
- [ ] `backend/requirements.txt` mavjud
- [ ] `DATABASE_URL` sozlangan
- [ ] `SECRET_KEY` sozlangan (min 32 character)
- [ ] `OPENAI_API_KEY` sozlangan
- [ ] `SUPABASE_URL` va `SUPABASE_SERVICE_ROLE_KEY` sozlangan
- [ ] `CORS_ORIGINS` frontend URL'ni o'z ichiga oladi
- [ ] Health check muvaffaqiyatli (`/api/v1/health`)
- [ ] API docs ochiladi (`/docs`)

## Important Notes

**Zero-Config FastAPI (2024-2025)**:
- `vercel.json` **kerak emas** - Vercel avtomatik detect qiladi
- `api/index.py` fayli `backend/api/` papkasida bo'lishi kerak
- Vercel `api/` papkasini avtomatik topadi va deploy qiladi
- Timeout va memory limit Vercel Dashboard dan sozlash mumkin

**Legacy Config (eski versiyalar)**:
- Agar `vercel.json` kerak bo'lsa (timeout config uchun), minimal versiya:
```json
{
  "functions": {
    "api/index.py": {
      "maxDuration": 60
    }
  }
}
```
Lekin yangi versiyada bu ham kerak emas - Dashboard dan sozlash mumkin!
