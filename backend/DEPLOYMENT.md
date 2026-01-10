# Backend Deployment Guide - Vercel

Backend'ni Vercel'da deploy qilish uchun quyidagi qadamlarni bajaring.

## 🚀 Tez Boshlash

### 1. Vercel Dashboard'ga kiring
- https://vercel.com/dashboard ga kiring
- "Add New" → "Project" ni bosing

### 2. GitHub Repository'ni ulang
- Repository'ni tanlang
- Framework Preset: **"Other"** tanlang

### 3. ⚠️ MUHIM: Root Directory
```
backend
```
**CRITICAL**: Root directory `backend` bo'lishi KERAK!

### 4. Environment Variables
Vercel Dashboard → Settings → Environment Variables:

```env
# Database (REQUIRED) - Supabase Session Pooler
DATABASE_URL=postgresql://postgres.xxx:[password]@xxx.pooler.supabase.com:6543/postgres?sslmode=require

# Security (REQUIRED) - Minimum 32 characters
SECRET_KEY=your-super-secret-key-minimum-32-characters-long

# OpenAI (REQUIRED for AI features)
OPENAI_API_KEY=sk-...

# Supabase Storage (REQUIRED)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=invoices

# Environment
ENVIRONMENT=production

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend.vercel.app
```

### 5. Deploy
"Deploy" tugmasini bosing!

## 📁 File Structure

```
backend/
├── api/
│   └── index.py          # ⚡ Vercel entry point
├── app/
│   ├── main.py           # FastAPI app
│   ├── api/v1/           # API endpoints
│   ├── core/             # Config, DB, Security
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   └── services/         # Business logic
├── requirements.txt      # 📦 Dependencies
├── vercel.json           # ⚙️ Vercel config
└── .vercelignore         # 🚫 Ignored files
```

## ✅ Verification

Deploy'dan keyin quyidagilarni tekshiring:

### 1. Root endpoint
```
https://your-backend.vercel.app/
```
Response: `{"message": "Welcome to SmartPOS CRM API", ...}`

### 2. Health Check
```
https://your-backend.vercel.app/health
```
Response: `{"status": "healthy", ...}`

### 3. API Docs
```
https://your-backend.vercel.app/docs
```
Swagger UI ochilishi kerak

### 4. Auth Test
```
POST https://your-backend.vercel.app/api/v1/auth/signup
```

## ❌ Troubleshooting

### "404 Not Found" xatosi
1. **Root directory `backend` ekanligini tekshiring:**
   - Vercel Dashboard → Settings → General → Root Directory
   - Root Directory: `backend` bo'lishi KERAK!
   - Agar boshqa bo'lsa, `backend` ga o'zgartiring va redeploy qiling

2. **Handler export qilinganini tekshiring:**
   - `backend/api/index.py` faylida `handler` o'zgaruvchisi bo'lishi kerak
   - `__all__ = ['handler']` bo'lishi kerak
   - Vercel Python runtime handler'ni avtomatik detect qiladi

3. **Vercel Functions loglarini ko'ring:**
   - Vercel Dashboard → Deployments → [Latest] → Functions → Logs
   - Import errors, initialization errors, handler errors ko'rsatiladi
   - Agar handler noto'g'ri bo'lsa, log'larda ko'rsatiladi

4. **vercel.json routing tekshirish:**
   - `vercel.json` da `routes` section barcha path'lar uchun `api/index.py` ga yo'naltirilishi kerak
   - Catch-all route `"src": "/(.*)", "dest": "api/index.py"` bo'lishi kerak

5. **Deployment qayta ishga tushirish:**
   - Vercel Dashboard → Deployments → [Latest] → ... → Redeploy
   - Yoki GitHub'ga yangi commit push qiling (avtomatik redeploy)

6. **Test endpoints:**
   - Root: `https://your-backend.vercel.app/` - 200 status qaytarishi kerak
   - Health: `https://your-backend.vercel.app/health` - 200 status qaytarishi kerak
   - Docs: `https://your-backend.vercel.app/docs` - Swagger UI ochilishi kerak

### "500 Internal Server Error"
1. Environment variables to'g'ri sozlanganini tekshiring
2. `DATABASE_URL` Session Pooler (port 6543) ishlatayotganini tekshiring
3. Vercel Functions loglarini ko'ring: Dashboard → Functions → Logs

### Database ulanmayapti
- Supabase Session Pooler port: `6543`
- SSL mode: `?sslmode=require`
- Password URL-encoded bo'lishi kerak

### File downloading instead of running
Bu `vercel.json` yo'q bo'lganda yuz beradi. `backend/vercel.json` mavjudligini tekshiring.

## 📋 Checklist

- [ ] Root directory: `backend`
- [ ] `backend/api/index.py` mavjud
- [ ] `backend/vercel.json` mavjud
- [ ] `backend/requirements.txt` mavjud
- [ ] `DATABASE_URL` sozlangan (Session Pooler, port 6543)
- [ ] `SECRET_KEY` sozlangan (min 32 char)
- [ ] `OPENAI_API_KEY` sozlangan
- [ ] `SUPABASE_URL` sozlangan
- [ ] `SUPABASE_SERVICE_ROLE_KEY` sozlangan
- [ ] `ENVIRONMENT=production` sozlangan
- [ ] Health check ishlayapti
- [ ] API docs ochiladi
