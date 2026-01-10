# Vercel Monorepo Deploy - FINAL QO'LLANMA ✅

## 🎯 Yakuniy Konfiguratsiya

### ✅ Struktura

```
savdogar_project_ready/          # GitHub repository root
├── vercel.json                  # ✅ Root'da vercel.json (MUHIM!)
├── frontend/                    # Next.js application
│   ├── package.json
│   ├── src/
│   ├── api/                     # Python FastAPI backend
│   │   ├── index.py            # Serverless function entrypoint
│   │   ├── requirements.txt
│   │   └── app/                 # FastAPI app
│   └── .next/                   # Next.js build output
├── .vercelignore
└── package.json                 # Root package.json (optional)
```

### ✅ Root `vercel.json` (To'g'ri Konfiguratsiya)

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm install && npm run build",
  "installCommand": "cd frontend && npm install",
  "outputDirectory": "frontend/.next",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/frontend/api/index.py"
    }
  ],
  "functions": {
    "frontend/api/index.py": {
      "maxDuration": 60,
      "memory": 1024,
      "includeFiles": "frontend/api/**"
    }
  }
}
```

## 🔑 Vercel Dashboard Sozlamalari - MUHIM! ⚠️

### 1. Settings → General

**Root Directory:** `EMPTY` (blank qoldiring - hech narsa yozmang!) ⚠️ **MUHIM!**

**Eslatma:** 
- ✅ Root Directory: EMPTY (blank) - `vercel.json` root'da
- ❌ Root Directory: `frontend` - `vercel.json` `frontend/` papkasida bo'lishi kerak (lekin bizda yo'q!)

**Framework Preset:** `Next.js` (auto-detect)
**Build Command:** OVERRIDE QILMANG (vercel.json dan oladi)
**Output Directory:** OVERRIDE QILMANG (vercel.json dan oladi)
**Install Command:** OVERRIDE QILMANG (vercel.json dan oladi)

### 2. Settings → Environment Variables

Quyidagi variable'larni qo'shing (Production, Preview, Development - hammasiga):

```
DATABASE_URL=postgresql://...?sslmode=require
SECRET_KEY=<your-secret-key-min-32-chars>
FRONTEND_URL=https://your-project.vercel.app
CORS_ORIGINS=https://your-project.vercel.app
PYTHONPATH=frontend/api
```

⚠️ **Eslatma:** `PYTHONPATH=frontend/api` (root'dan nisbatan path, chunki Root Directory EMPTY)

### 3. Settings → Functions

**Runtime:** Auto-detect (Python `.py` fayllar avtomatik aniqlanadi)
**Max Duration:** 60 seconds (vercel.json dan oladi)
**Memory:** 1024 MB (vercel.json dan oladi)

## 🚀 Deploy Qadamlar

### Qadam 1: Vercel Dashboard'ga Kiring

1. https://vercel.com/dashboard ga kiring
2. Project'ni tanlang: `savdogar`

### Qadam 2: Settings → General

1. **Settings** tab'ga kiring
2. **General** section'ga kiring
3. **Root Directory** ni toping
4. **Root Directory** ni **BLANK/EMPTY** qiling (hech narsa yozmang!) ⚠️ **MUHIM!**
5. **Build & Development Settings** section'ga kiring
6. **Build Command:** OVERRIDE QILMANG (bo'sh qoldiring yoki o'chiring)
7. **Output Directory:** OVERRIDE QILMANG (bo'sh qoldiring yoki o'chiring)
8. **Install Command:** OVERRIDE QILMANG (bo'sh qoldiring yoki o'chiring)
9. **Save** ni bosing

### Qadam 3: Environment Variables

1. **Settings → Environment Variables** ga kiring
2. Quyidagi variable'larni qo'shing (Production, Preview, Development - hammasiga):

```
DATABASE_URL=postgresql://user:password@host:port/db?sslmode=require
SECRET_KEY=<generate-random-32-chars-minimum>
FRONTEND_URL=https://your-project.vercel.app
CORS_ORIGINS=https://your-project.vercel.app
PYTHONPATH=frontend/api
```

3. **Save** qiling

### Qadam 4: Deploy

1. **Deployments** tab'ga kiring
2. **Latest Deployment** ni toping
3. **"..." (three dots)** → **"Redeploy"** ni bosing
4. **"Use existing Build Cache"** ni **O'CHIRING** ❌ (muhim!)
5. **"Redeploy"** ni bosing

## ✅ Checklist

### Code
- [x] `vercel.json` root'da joylashgan
- [x] `frontend/vercel.json` o'chirildi
- [x] `builds` property yo'q (legacy)
- [x] `runtime` property yo'q (auto-detect)
- [x] `functions` property to'g'ri (`frontend/api/index.py`)
- [x] `rewrites` to'g'ri (`/frontend/api/index.py`)
- [x] `buildCommand` to'g'ri (`cd frontend && npm install && npm run build`)
- [x] `outputDirectory` to'g'ri (`frontend/.next`)
- [x] `frontend/package.json` git'da commit qilingan
- [x] `frontend/api/index.py` git'da commit qilingan
- [x] `frontend/api/requirements.txt` git'da commit qilingan

### Vercel Dashboard
- [ ] **Root Directory: EMPTY** (blank) ⚠️ **MUHIM!**
- [ ] **Build Command: OVERRIDE QILINMAGAN** (bo'sh yoki o'chirilgan)
- [ ] **Output Directory: OVERRIDE QILINMAGAN** (bo'sh yoki o'chirilgan)
- [ ] **Install Command: OVERRIDE QILINMAGAN** (bo'sh yoki o'chirilgan)
- [ ] **Environment Variables qo'shilgan:**
  - [ ] `DATABASE_URL`
  - [ ] `SECRET_KEY`
  - [ ] `FRONTEND_URL`
  - [ ] `CORS_ORIGINS`
  - [ ] `PYTHONPATH=frontend/api` ⚠️

### Deploy
- [ ] **Redeploy qilindi** (cache o'chirilgan)

## 🚨 Muammo: `cd frontend: No such file or directory`

**Sabab:** Vercel Dashboard'da Root Directory `frontend` ga o'rnatilgan.

**Yechim:**
1. Vercel Dashboard → Settings → General
2. Root Directory ni **EMPTY** (blank) qiling (hech narsa yozmang!)
3. Save qiling
4. Redeploy qiling (cache o'chirib)

## 🎉 Natija

Agar barcha sozlamalar to'g'ri bo'lsa, deploy muvaffaqiyatli bo'lishi kerak! ✅

**Eslatma:** Vercel Dashboard'da **Root Directory** ni **EMPTY** (blank) qilishni unutmang! ⚠️
