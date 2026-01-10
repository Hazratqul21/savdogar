# VERCEL ROOT DIRECTORY - MUHIM SOZLASH ⚠️

## 🚨 MUHIM: Vercel Dashboard Sozlamasi

### ❌ Muammo:
```
Error: The pattern "api/index.py" defined in `functions` doesn't match any Serverless Functions inside the `api` directory.
```

**Sabab:** Vercel Dashboard'da **Root Directory** `frontend` ga o'rnatilmagan!

### ✅ Yechim:

**Vercel Dashboard → Settings → General → Root Directory: `frontend`** ⚠️ **MUHIM!**

## 📋 Qadam Bay Qadam Sozlash

### Qadam 1: Vercel Dashboard'ga Kiring

1. https://vercel.com/dashboard ga kiring
2. Project'ni tanlang: `savdogar`

### Qadam 2: Settings → General

1. **Settings** tab'ga kiring
2. **General** section'ga kiring
3. **Root Directory** ni toping (Build & Development Settings section'da)
4. **Root Directory** ga `frontend` yozing ⚠️ **MUHIM!** (faqat `frontend` yozing, `/frontend` yoki `./frontend` emas!)
5. **Build Command:** OVERRIDE QILMANG (bo'sh qoldiring yoki o'chiring)
6. **Output Directory:** OVERRIDE QILMANG (bo'sh qoldiring yoki o'chiring)
7. **Install Command:** OVERRIDE QILMANG (bo'sh qoldiring yoki o'chiring)
8. **Save** ni bosing ⚠️

### Qadam 3: Tekshirish

1. **Deployments** tab'ga kiring
2. **Latest Deployment** ni toping
3. **"..." (three dots)** → **"Redeploy"** ni bosing
4. **"Use existing Build Cache"** ni **O'CHIRING** ❌ (muhim!)
5. **"Redeploy"** ni bosing

## ✅ To'g'ri Sozlash

```
Root Directory: frontend
```

**Eslatma:** 
- ✅ Root Directory: `frontend` (faqat `frontend` yozing)
- ❌ Root Directory: EMPTY (blank) - XATO!
- ❌ Root Directory: `/frontend` - XATO!
- ❌ Root Directory: `./frontend` - XATO!

## 🔍 Nega Bu Muhim?

1. **`vercel.json`** `frontend/` papkasida joylashgan
2. **`api/index.py`** `frontend/api/index.py` da joylashgan
3. Vercel Root Directory dan boshlab `vercel.json` va `api/` directory ni qidiradi
4. Agar Root Directory `frontend` bo'lsa, Vercel `frontend/vercel.json` va `frontend/api/index.py` ni topadi
5. Agar Root Directory EMPTY bo'lsa, Vercel root'da `vercel.json` va `api/` directory ni qidiradi, lekin topa olmaydi (chunki ular `frontend/` ichida)

## 📊 Struktura

```
savdogar_project_ready/          # GitHub repository root
├── frontend/                    # ✅ Vercel Root Directory: "frontend"
│   ├── vercel.json             # ✅ Vercel config bu yerda!
│   ├── package.json
│   ├── api/                     # ✅ API directory bu yerda!
│   │   ├── index.py            # ✅ api/index.py (frontend/ dan nisbatan)
│   │   └── ...
│   └── ...
└── ...
```

## ⚠️ Eslatma

**Root Directory ni `frontend` ga o'rnatmaguncha, deploy muvaffaqiyatsiz bo'ladi!**

Bu eng muhim sozlama! Root Directory ni to'g'ri o'rnatmagan holda, barcha boshqa sozlamalar ishlamaydi!
