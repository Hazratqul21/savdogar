# Vercel Monorepo - TO'G'RI KONFIGURATSIYA ✅

## 🎯 Muammo va Yechim

### ❌ Muammo:
Vercel xatosi: `The pattern "api/index.py" defined in functions doesn't match any Serverless Functions inside the api directory.`

**Sabab:** 
- `vercel.json` root'da, lekin `api/` directory root'da yo'q
- API `frontend/api/index.py` da joylashgan
- Vercel root'da `api/index.py` ni qidiradi, lekin topa olmaydi

### ✅ Yechim:
Monorepo uchun **Root Directory: `frontend`** va **`vercel.json` `frontend/` papkasida** bo'lishi kerak!

## ✅ To'g'ri Struktura

```
savdogar_project_ready/          # GitHub repository root
├── frontend/                    # ✅ Vercel Root Directory: "frontend"
│   ├── vercel.json             # ✅ Vercel config bu yerda!
│   ├── package.json
│   ├── src/
│   ├── api/                     # ✅ Python FastAPI backend (frontend/ dan nisbatan)
│   │   ├── index.py            # ✅ Serverless function: api/index.py (frontend/ dan nisbatan)
│   │   ├── requirements.txt
│   │   └── app/                 # FastAPI app
│   └── .next/                   # Next.js build output
├── .vercelignore
└── package.json                 # Root package.json (optional)
```

## ✅ `frontend/vercel.json` (To'g'ri Konfiguratsiya)

```json
{
  "version": 2,
  "buildCommand": "npm install && npm run build",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.py"
    }
  ],
  "functions": {
    "api/index.py": {
      "maxDuration": 60,
      "memory": 1024,
      "includeFiles": "api/**"
    }
  }
}
```

⚠️ **MUHIM:** Path'lar `frontend/` dan nisbatan!
- ✅ `"api/index.py"` → `frontend/api/index.py`
- ✅ `"includeFiles": "api/**"` → `frontend/api/**`
- ✅ `"destination": "/api/index.py"` → `frontend/api/index.py`
- ✅ `"outputDirectory": ".next"` → `frontend/.next`

## 🔑 Vercel Dashboard Sozlamalari - MUHIM! ⚠️

### 1. Settings → General

**Root Directory:** `frontend` ⚠️ **MUHIM!**

**Eslatma:** 
- ✅ Root Directory: `frontend` (faqat `frontend` yozing, `/frontend` yoki `./frontend` emas!)
- ❌ Root Directory: EMPTY (blank) - NOTO'G'RI!

**Sabab:** `vercel.json` `frontend/` papkasida va API `frontend/api/index.py` da joylashgan, shuning uchun Root Directory `frontend` bo'lishi kerak!

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
PYTHONPATH=api
```

⚠️ **Eslatma:** `PYTHONPATH=api` (frontend dan nisbatan path, chunki Root Directory `frontend`)

### 3. Settings → Functions

**Runtime:** Auto-detect (Python `.py` fayllar avtomatik aniqlanadi)
**Max Duration:** 60 seconds (vercel.json dan oladi)
**Memory:** 1024 MB (vercel.json dan oladi)

## 🚀 Deploy Qadamlar

### Qadam 1: Vercel Dashboard

1. **Settings → General**
2. **Root Directory:** `frontend` (faqat `frontend` yozing!) ⚠️ **MUHIM!**
3. **Build Command:** OVERRIDE QILMANG (bo'sh qoldiring yoki o'chiring)
4. **Output Directory:** OVERRIDE QILMANG (bo'sh qoldiring yoki o'chiring)
5. **Install Command:** OVERRIDE QILMANG (bo'sh qoldiring yoki o'chiring)
6. **Save** qiling

### Qadam 2: Environment Variables

1. **Settings → Environment Variables**
2. Quyidagi variable'larni qo'shing:

```
DATABASE_URL=postgresql://user:password@host:port/db?sslmode=require
SECRET_KEY=<generate-random-32-chars-minimum>
FRONTEND_URL=https://your-project.vercel.app
CORS_ORIGINS=https://your-project.vercel.app
PYTHONPATH=api
```

3. **Save** qiling

### Qadam 3: Deploy

1. **Deployments** tab'ga kiring
2. **Latest Deployment** ni toping
3. **"..." (three dots)** → **"Redeploy"** ni bosing
4. **"Use existing Build Cache"** ni **O'CHIRING** ❌ (muhim!)
5. **"Redeploy"** ni bosing

## ✅ Checklist

### Code
- [x] `vercel.json` `frontend/` papkasida joylashgan
- [x] Root `vercel.json` o'chirildi
- [x] `functions` property to'g'ri (`api/index.py` - frontend dan nisbatan)
- [x] `rewrites` to'g'ri (`/api/index.py` - frontend dan nisbatan)
- [x] `buildCommand` to'g'ri (`npm install && npm run build` - frontend da)
- [x] `outputDirectory` to'g'ri (`.next` - frontend da)
- [x] `frontend/api/index.py` mavjud
- [x] `frontend/package.json` mavjud

### Vercel Dashboard
- [ ] **Root Directory: `frontend`** ⚠️ **MUHIM!**
- [ ] **Build Command: OVERRIDE QILINMAGAN** (bo'sh yoki o'chirilgan)
- [ ] **Output Directory: OVERRIDE QILINMAGAN** (bo'sh yoki o'chirilgan)
- [ ] **Install Command: OVERRIDE QILINMAGAN** (bo'sh yoki o'chirilgan)
- [ ] **Environment Variables qo'shilgan:**
  - [ ] `DATABASE_URL`
  - [ ] `SECRET_KEY`
  - [ ] `FRONTEND_URL`
  - [ ] `CORS_ORIGINS`
  - [ ] `PYTHONPATH=api` ⚠️ (frontend dan nisbatan)

### Deploy
- [ ] **Redeploy qilindi** (cache o'chirilgan)

## 🚨 Muammolar va Yechimlar

### Muammo 1: `The pattern "api/index.py" doesn't match any Serverless Functions`

**Sabab:** Root Directory EMPTY yoki `vercel.json` root'da.

**Yechim:**
1. `vercel.json` ni `frontend/` papkasiga ko'chiring
2. Root Directory ni `frontend` ga o'rnating
3. Redeploy qiling

### Muammo 2: `cd frontend: No such file or directory`

**Sabab:** Root Directory `frontend` ga o'rnatilgan, lekin `vercel.json` da `cd frontend` bor.

**Yechim:**
1. `vercel.json` da `cd frontend` ni olib tashlang (chunki allaqachon frontend'da bo'lamiz)
2. `buildCommand: "npm install && npm run build"` (cd frontend yo'q)

### Muammo 3: Python import xatolari

**Sabab:** `PYTHONPATH` noto'g'ri.

**Yechim:**
- Root Directory `frontend` bo'lsa, `PYTHONPATH=api` (frontend dan nisbatan)
- Root Directory EMPTY bo'lsa, `PYTHONPATH=frontend/api` (root'dan nisbatan)

## 🎉 Natija

Agar barcha sozlamalar to'g'ri bo'lsa, deploy muvaffaqiyatli bo'lishi kerak! ✅

**Eslatma:** Vercel Dashboard'da **Root Directory** ni **`frontend`** qilishni unutmang! ⚠️
