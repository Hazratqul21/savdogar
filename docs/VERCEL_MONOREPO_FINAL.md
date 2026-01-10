# Vercel Monorepo - FINAL YECHIM ✅

## 🚨 MUHIM: Vercel Dashboard Sozlamalari

### ✅ To'g'ri Sozlash (MONOREPO):

1. **Vercel Dashboard → Project → Settings → General**
2. **Root Directory:** `frontend` ⚠️ **MUHIM!**
3. **Framework Preset:** `Next.js` (auto-detect)
4. **Build Command:** `vercel.json` dan oladi (override qilmang)
5. **Output Directory:** `vercel.json` dan oladi (override qilmang)
6. **Install Command:** `vercel.json` dan oladi (override qilmang)

### ❌ XATO Sozlash:

- Root Directory: `EMPTY` (blank) - ❌ NOTO'G'RI!
- Root Directory: `./frontend` - ❌ NOTO'G'RI! (faqat `frontend` yozing)

**Sabab:** Vercel monorepo uchun `vercel.json` `frontend/` papkasida joylashgan, shuning uchun Root Directory `frontend` bo'lishi kerak!

## ✅ To'g'ri Struktura

```
savdogar_project_ready/          # GitHub repository root
├── frontend/                    # Vercel Root Directory: "frontend"
│   ├── vercel.json             # ✅ Vercel config bu yerda!
│   ├── package.json
│   ├── src/
│   ├── api/                    # Python FastAPI backend
│   │   ├── index.py           # Serverless function entrypoint
│   │   ├── requirements.txt
│   │   └── app/                # FastAPI app
│   └── .next/                  # Next.js build output
├── .vercelignore              # Root-level ignore
└── package.json               # Root package.json (optional)
```

## ✅ `frontend/vercel.json` Konfiguratsiyasi

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
      "runtime": "python3.9",
      "includeFiles": "api/**"
    }
  }
}
```

## 🔑 Muhim Nuansalar

### 1. `vercel.json` Joylashuvi

- ✅ **To'g'ri:** `frontend/vercel.json` (Root Directory `frontend` bo'lsa)
- ❌ **Xato:** `root/vercel.json` (Root Directory `frontend` bo'lsa)

### 2. Path'lar `vercel.json` ichida

- ✅ **To'g'ri:** `"destination": "/api/index.py"` (relative path)
- ❌ **Xato:** `"destination": "/frontend/api/index.py"` (absolute path)

**Sabab:** `vercel.json` `frontend/` papkasida, shuning uchun path'lar `frontend/` dan boshlanadi!

### 3. Build Commands

- ✅ **To'g'ri:** `"buildCommand": "npm install && npm run build"` (cd frontend yo'q!)
- ❌ **Xato:** `"buildCommand": "cd frontend && npm install && npm run build"` (cd kerak emas!)

**Sabab:** Allaqachon `frontend/` papkasida bo'lamiz (Root Directory `frontend`).

## 🚀 Deploy Qadamlar

### Qadam 1: Vercel Dashboard

1. **Settings → General**
2. **Root Directory:** `frontend` (faqat `frontend` yozing, `/frontend` yoki `./frontend` emas!)
3. **Save** qiling

### Qadam 2: Environment Variables

**Settings → Environment Variables:**

```
DATABASE_URL=postgresql://...?sslmode=require
SECRET_KEY=<your-secret-key>
FRONTEND_URL=https://your-project.vercel.app
CORS_ORIGINS=https://your-project.vercel.app
PYTHONPATH=api
```

⚠️ **Eslatma:** `PYTHONPATH=api` (frontend emas!), chunki Root Directory `frontend`, shuning uchun `api` relative path.

### Qadam 3: Deploy

1. **Deployments → Latest**
2. **"..." → "Redeploy"**
3. **"Use existing Build Cache"** ni **O'CHIRING** ❌
4. **"Redeploy"** qiling

## ⚠️ Muammo: `cd frontend: No such file or directory`

**Sabab 1:** Root Directory `EMPTY` (blank) sozlangan.

**Yechim:**
- Settings → General → Root Directory: `frontend` qiling

**Sabab 2:** `vercel.json` root'da, lekin Root Directory `frontend`.

**Yechim:**
- `vercel.json` ni `frontend/` papkasiga ko'chiring
- Yoki Root Directory ni `EMPTY` qiling va root'dagi `vercel.json` da `cd frontend` ishlating

## ✅ Checklist

- [x] `vercel.json` `frontend/` papkasida joylashgan
- [x] Root Directory: `frontend` (Vercel Dashboard'da)
- [x] Build Command: `cd frontend` yo'q (chunki allaqachon frontend'da)
- [x] Path'lar relative (`/api/index.py`, `/frontend/api/index.py` emas)
- [x] `PYTHONPATH=api` (frontend emas)
- [x] Environment Variables qo'shilgan
- [x] Redeploy qilingan (cache o'chirilgan)

## 🎉 Natija

Agar barcha sozlamalar to'g'ri bo'lsa, deploy muvaffaqiyatli bo'lishi kerak! ✅

**Eslatma:** Agar muammo bo'lsa, Vercel Dashboard'da **Root Directory** ni `frontend` qilishni tekshiring! ⚠️
