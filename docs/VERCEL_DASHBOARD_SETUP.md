# Vercel Dashboard Sozlamalari - MUHIM! ⚠️

## 🚨 MUHIM: Root Directory Sozlash

Vercel Dashboard'da **Root Directory** sozlash **JUDDAM MUHIM**!

### ✅ To'g'ri Sozlash:

1. **Vercel Dashboard → Project → Settings → General**
2. **Root Directory:** `EMPTY` (blank qoldiring) ⚠️ **MUHIM!**
3. **Framework Preset:** `Next.js` (auto-detect)
4. **Build Command:** **OVERRIDE QILMANG** (vercel.json dan oladi)
5. **Output Directory:** **OVERRIDE QILMANG** (vercel.json dan oladi)
6. **Install Command:** **OVERRIDE QILMANG** (vercel.json dan oladi)

### ❌ XATO Sozlash:

- Root Directory: `frontend` - ❌ NOTO'G'RI!
- Build Command: `npm install && npm run build` (override qilingan) - ❌ NOTO'G'RI!

**Sabab:** Agar Root Directory `frontend` ga o'rnatilsa, `cd frontend` xatolik beradi, chunki allaqachon `frontend` papkasida bo'lamiz!

## ✅ To'g'ri `vercel.json` Konfiguratsiyasi

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
      "runtime": "python3.9",
      "includeFiles": "frontend/api/**"
    }
  }
}
```

## 🔧 Qadam Bay Qadam Sozlash

### Qadam 1: Vercel Dashboard'ga Kiring

1. https://vercel.com/dashboard ga kiring
2. Project'ni tanlang: `savdogar`

### Qadam 2: Settings → General

1. **Settings** tab'ga kiring
2. **General** section'ga kiring
3. **Root Directory** ni toping
4. **Root Directory** ni **BLANK/EMPTY** qiling (hech narsa yozmang!) ⚠️
5. **Build & Development Settings** section'ga kiring
6. **Build Command:** **OVERRIDE QILMANG** (vercel.json dan oladi)
7. **Output Directory:** **OVERRIDE QILMANG** (vercel.json dan oladi)
8. **Install Command:** **OVERRIDE QILMANG** (vercel.json dan oladi)
9. **Save** ni bosing

### Qadam 3: Environment Variables

1. **Settings → Environment Variables** ga kiring
2. Quyidagi variable'larni qo'shing:

```
DATABASE_URL=postgresql://...?sslmode=require
SECRET_KEY=<your-secret-key-min-32-chars>
FRONTEND_URL=https://your-project.vercel.app
CORS_ORIGINS=https://your-project.vercel.app
PYTHONPATH=frontend/api
```

3. **Save** ni bosing

### Qadam 4: Deploy

1. **Deployments** tab'ga kiring
2. **Latest Deployment** ni toping
3. **"..." (three dots)** → **"Redeploy"** ni bosing
4. **"Use existing Build Cache"** ni **O'CHIRING** ❌
5. **"Redeploy"** ni bosing

## 🚨 Muammo: `cd frontend: No such file or directory`

**Sabab:** Root Directory `frontend` ga o'rnatilgan.

**Yechim:**
1. Vercel Dashboard → Settings → General
2. Root Directory ni **EMPTY** (blank) qiling
3. Save qiling
4. Redeploy qiling

## ✅ Checklist

- [ ] Root Directory: **EMPTY** (blank)
- [ ] Build Command: **OVERRIDE QILINMAGAN** (vercel.json dan oladi)
- [ ] Output Directory: **OVERRIDE QILINMAGAN** (vercel.json dan oladi)
- [ ] Install Command: **OVERRIDE QILINMAGAN** (vercel.json dan oladi)
- [ ] Environment Variables qo'shilgan
- [ ] `PYTHONPATH=frontend/api` qo'shilgan
- [ ] Redeploy qilingan (cache o'chirilgan)

## 🎯 Natija

Agar barcha sozlamalar to'g'ri bo'lsa, deploy muvaffaqiyatli bo'lishi kerak! ✅
