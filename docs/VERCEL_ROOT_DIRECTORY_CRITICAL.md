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

### Qadam 3: Settings → Environment Variables (PYTHONPATH sozlash) ⚠️

1. **Settings** tab'da **Environment Variables** section'ga kiring
2. **Add New** yoki **"+"** tugmasini bosing
3. Quyidagi variable'larni qo'shing (har birini alohida qo'shing):

**Variable 1: PYTHONPATH**
- **Key:** `PYTHONPATH`
- **Value:** `api` (faqat `api` yozing, `/api` yoki `./api` emas!)
- **Environment:** Production, Preview, Development (hammasini tanlang) ✅
- **Add** yoki **Save** ni bosing

**Variable 2: DATABASE_URL**
- **Key:** `DATABASE_URL`
- **Value:** `postgresql://user:password@host:port/db?sslmode=require`
- **Environment:** Production, Preview, Development (hammasini tanlang) ✅
- **Add** yoki **Save** ni bosing

**Variable 3: SECRET_KEY**
- **Key:** `SECRET_KEY`
- **Value:** `<your-secret-key-minimum-32-characters>`
- **Environment:** Production, Preview, Development (hammasini tanlang) ✅
- **Add** yoki **Save** ni bosing

**Variable 4: FRONTEND_URL**
- **Key:** `FRONTEND_URL`
- **Value:** `https://your-project.vercel.app`
- **Environment:** Production, Preview, Development (hammasini tanlang) ✅
- **Add** yoki **Save** ni bosing

**Variable 5: CORS_ORIGINS**
- **Key:** `CORS_ORIGINS`
- **Value:** `https://your-project.vercel.app`
- **Environment:** Production, Preview, Development (hammasini tanlang) ✅
- **Add** yoki **Save** ni bosing

⚠️ **MUHIM:** `PYTHONPATH=api` (frontend/ dan nisbatan path, chunki Root Directory `frontend`)

### Qadam 4: Tekshirish va Redeploy

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

## 🔑 PYTHONPATH Nega `api` (frontend dan nisbatan)?

**Sabab:**
- Root Directory `frontend` ga o'rnatilgan
- Vercel `frontend/` papkasidan ish boshlaydi
- `api/index.py` fayli `frontend/api/index.py` da joylashgan
- Python `from app.main import app` qilganda, `app` modulini topishi uchun `PYTHONPATH` kerak
- `PYTHONPATH=api` sozlasak, Python `frontend/api/` papkasini `sys.path` ga qo'shadi
- Shuning uchun `from app.main import app` ishlaydi (chunki `app` `frontend/api/app/main.py` da)

**Eslatma:**
- ✅ `PYTHONPATH=api` (Root Directory `frontend` bo'lsa)
- ❌ `PYTHONPATH=frontend/api` (Root Directory EMPTY bo'lsa, lekin bizda `frontend`)

## ⚠️ Eslatma

**1. Root Directory ni `frontend` ga o'rnatmaguncha, deploy muvaffaqiyatsiz bo'ladi!**

**2. `PYTHONPATH=api` ni Environment Variables'da qo'shmaguncha, Python import xatolari bo'ladi!**

Bu ikki sozlama eng muhim! Ularni to'g'ri o'rnatmagan holda, deploy va ishlash muvaffaqiyatsiz bo'ladi!
