# Vercel Monorepo - HAL QILINGAN MUAMMOLAR ✅

## 🎯 Yakuniy Struktura

```
savdogar_project_ready/          # GitHub repository root
├── vercel.json                  # ✅ Root'da vercel.json (MONOREPO)
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

## ✅ Yakuniy `vercel.json` (Root'da)

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

### Settings → General

- **Root Directory:** `EMPTY` (blank qoldiring - hech narsa yozmang!) ⚠️ **MUHIM!**
- **Framework Preset:** `Next.js` (auto-detect)
- **Build Command:** `vercel.json` dan oladi (override qilmang!)
- **Output Directory:** `vercel.json` dan oladi (override qilmang!)
- **Install Command:** `vercel.json` dan oladi (override qilmang!)

### Settings → Environment Variables

Quyidagi variable'larni qo'shing:

```
DATABASE_URL=postgresql://...?sslmode=require
SECRET_KEY=<your-secret-key-min-32-chars>
FRONTEND_URL=https://your-project.vercel.app
CORS_ORIGINS=https://your-project.vercel.app
PYTHONPATH=frontend/api
```

⚠️ **Eslatma:** `PYTHONPATH=frontend/api` (root'dan nisbatan path, chunki Root Directory EMPTY)

## 📊 Hal Qilingan Muammolar

### ✅ Muammo 1: `cd frontend: No such file or directory`

**Sabab:** Root Directory `frontend` ga o'rnatilgan edi, lekin `vercel.json` `frontend/` papkasida bor edi.

**Yechim:**
- ✅ `vercel.json` root'ga ko'chirildi
- ✅ Root Directory `EMPTY` bo'lishi kerak

### ✅ Muammo 2: `Function Runtimes must have a valid version`

**Sabab:** `runtime: "python3.9"` property noto'g'ri format edi.

**Yechim:**
- ✅ `runtime` property olib tashlandi (Vercel avtomatik aniqlaydi)

### ✅ Muammo 3: `builds` va `functions` birga ishlatilmaydi

**Sabab:** Legacy `builds` property va yangi `functions` property birga edi.

**Yechim:**
- ✅ `builds` property olib tashlandi (legacy)
- ✅ Faqat `functions` property ishlatilmoqda (zamonaviy)

### ✅ Muammo 4: Monorepo struktura noto'g'ri

**Sabab:** `vercel.json` `frontend/` papkasida edi, lekin monorepo uchun root'da bo'lishi kerak.

**Yechim:**
- ✅ `vercel.json` root'ga ko'chirildi
- ✅ `frontend/vercel.json` o'chirildi
- ✅ Path'lar to'g'ri sozlandi (`/frontend/api/index.py`)

## 🚀 Deploy Qadamlar

### Qadam 1: Vercel Dashboard

1. **Settings → General**
2. **Root Directory:** `EMPTY` (blank qoldiring!) ⚠️
3. **Save** qiling

### Qadam 2: Environment Variables

1. **Settings → Environment Variables**
2. Quyidagi variable'larni qo'shing:
   - `DATABASE_URL=postgresql://...`
   - `SECRET_KEY=...`
   - `FRONTEND_URL=...`
   - `CORS_ORIGINS=...`
   - `PYTHONPATH=frontend/api` ⚠️
3. **Save** qiling

### Qadam 3: Deploy

1. **Deployments → Latest**
2. **"..." → "Redeploy"**
3. **"Use existing Build Cache"** ni **O'CHIRING** ❌
4. **"Redeploy"** qiling

## ✅ Checklist

- [x] `vercel.json` root'da joylashgan
- [x] `frontend/vercel.json` o'chirildi
- [x] `builds` property yo'q (legacy)
- [x] `runtime` property yo'q (auto-detect)
- [x] `functions` property to'g'ri (`frontend/api/index.py`)
- [x] `rewrites` to'g'ri (`/frontend/api/index.py`)
- [x] `buildCommand` to'g'ri (`cd frontend && npm install && npm run build`)
- [x] `outputDirectory` to'g'ri (`frontend/.next`)
- [ ] **Root Directory: EMPTY** (Vercel Dashboard'da o'rnatish kerak!)
- [ ] **Environment Variables** qo'shildi (`PYTHONPATH=frontend/api`)
- [ ] **Redeploy** qilindi (cache o'chirilgan)

## 🎉 Natija

Loyiha monorepo tamoyillariga mos konfiguratsiya bilan deployga tayyor! 🚀

**Eslatma:** Vercel Dashboard'da **Root Directory** ni **EMPTY** (blank) qilishni unutmang! ⚠️
