# Vercel Monorepo Konfiguratsiyasi - To'liq Qo'llanma

## 📋 Monorepo Struktura

```
savdogar_project_ready/
├── frontend/              # Next.js application
│   ├── package.json
│   ├── src/
│   ├── api/              # Python FastAPI backend
│   │   ├── index.py      # Vercel serverless function entrypoint
│   │   ├── requirements.txt
│   │   └── app/          # FastAPI application
│   └── .next/            # Next.js build output
├── vercel.json           # Vercel monorepo configuration
└── package.json          # Root package.json (optional)
```

## ✅ Yakuniy `vercel.json` Konfiguratsiyasi

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm install && npm run build",
  "installCommand": "cd frontend && npm install",
  "outputDirectory": "frontend/.next",
  "rewrites": [
    {
      "source": "/api/v1/(.*)",
      "destination": "/frontend/api/index.py"
    },
    {
      "source": "/api/(.*)",
      "destination": "/frontend/api/index.py"
    }
  ],
  "functions": {
    "frontend/api/index.py": {
      "maxDuration": 60,
      "memory": 1024,
      "runtime": "python3.9",
      "includeFiles": "frontend/api/**"
    }
  }
}
```

## 🔑 Vercel Dashboard Sozlamalari

### Settings → General

- **Root Directory:** `EMPTY` (blank qoldiring) ⚠️ **MUHIM!**
- **Framework Preset:** `Next.js` (auto-detect)
- **Build Command:** `vercel.json` dan oladi (override qilmang)
- **Output Directory:** `vercel.json` dan oladi (override qilmang)
- **Install Command:** `vercel.json` dan oladi (override qilmang)

### Settings → Environment Variables

Quyidagi environment variable'larni qo'shing:

```
# Database
DATABASE_URL=postgresql://...?sslmode=require

# Security
SECRET_KEY=<your-secret-key-min-32-chars>

# Frontend
FRONTEND_URL=https://your-project.vercel.app
CORS_ORIGINS=https://your-project.vercel.app

# Python
PYTHONPATH=frontend/api

# OpenAI (agar ishlatilsa)
OPENAI_API_KEY=<your-openai-api-key>

# Supabase (agar ishlatilsa)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_STORAGE_BUCKET=invoices
```

⚠️ **Eslatma:** `PYTHONPATH=frontend/api` - bu Python import'lar uchun kerak.

## 📊 Vercel Monorepo Tamoyillari

### 1. Root Directory

- ✅ **Root Directory:** EMPTY (blank)
- ❌ Root Directory: `frontend` - NOTO'G'RI!

Sabab: `vercel.json` root'da joylashgan va monorepo strukturasini to'g'ri handle qiladi.

### 2. Build Commands

- ✅ `buildCommand`: `cd frontend && npm install && npm run build`
- ✅ `installCommand`: `cd frontend && npm install`
- ✅ `outputDirectory`: `frontend/.next`

Sabab: Next.js app `frontend/` papkasida joylashgan.

### 3. Functions (Serverless)

- ✅ `functions`: `"frontend/api/index.py"` - root'dan nisbatan path
- ✅ `includeFiles`: `"frontend/api/**"` - barcha Python fayllarni include qilish

Sabab: Python FastAPI backend `frontend/api/` papkasida joylashgan.

### 4. Rewrites (Routing)

- ✅ `destination`: `"/frontend/api/index.py"` - root'dan nisbatan path
- ✅ `source`: `"/api/(.*)"` - barcha `/api/*` so'rovlarni Python function'ga yo'naltirish

Sabab: Monorepo uchun to'g'ri routing.

## 🚀 Deploy Qadamlar

1. **GitHub Repository:**
   ```bash
   git push origin master
   ```

2. **Vercel Dashboard:**
   - Settings → General → Root Directory: **EMPTY** (blank)
   - Settings → Environment Variables → Barcha variable'larni qo'shing
   - Deployments → Latest → Redeploy (agar kerak bo'lsa)

3. **Tekshirish:**
   - Frontend: `https://your-project.vercel.app`
   - API: `https://your-project.vercel.app/api/v1/health`
   - Docs: `https://your-project.vercel.app/docs`

## ⚠️ Muammolar va Yechimlar

### Muammo 1: `cd frontend: No such file or directory`

**Sabab:** Root Directory `frontend` ga o'rnatilgan.

**Yechim:**
- Settings → General → Root Directory → **EMPTY** (blank) qilish

### Muammo 2: Python function topilmayapti

**Sabab:** `functions` property'da path noto'g'ri.

**Yechim:**
- `vercel.json` da path `"frontend/api/index.py"` bo'lishi kerak (root'dan nisbatan)

### Muammo 3: Import xatolari (Python)

**Sabab:** `PYTHONPATH` environment variable o'rnatilmagan.

**Yechim:**
- Settings → Environment Variables → `PYTHONPATH=frontend/api` qo'shish

### Muammo 4: 405 Method Not Allowed

**Sabab:** `rewrites` noto'g'ri yoki Next.js API routes bilan conflict.

**Yechim:**
- `next.config.ts` da `rewrites()` bo'sh array qaytarishi kerak
- `vercel.json` da `rewrites` to'g'ri sozlanishi kerak

## ✅ Checklist

- [x] `vercel.json` root'da joylashgan
- [x] `buildCommand` `frontend/` papkasiga ishora qiladi
- [x] `outputDirectory` `frontend/.next` ga ishora qiladi
- [x] `functions` property `frontend/api/index.py` ga ishora qiladi
- [x] `rewrites` barcha `/api/*` so'rovlarni Python function'ga yo'naltiradi
- [x] Root Directory EMPTY (blank) sozlangan
- [x] Environment Variables qo'shilgan
- [x] `PYTHONPATH=frontend/api` qo'shilgan

## 🎉 Natija

Loyiha Vercel monorepo tamoyillariga mos konfiguratsiya bilan deploy qilingan! 🚀
