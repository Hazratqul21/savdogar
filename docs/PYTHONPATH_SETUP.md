# PYTHONPATH Sozlash - To'liq Qo'llanma ✅

## 🎯 PYTHONPATH Nega Kerak?

Python kodida `from app.main import app` kabi import'larni ishlatganda, Python `app` modulini qayerdan topishni bilishi kerak. `PYTHONPATH` environment variable Python'ga qayerdan modullarni qidirishni ko'rsatadi.

## 📍 Qayerda Sozlash?

**Vercel Dashboard → Settings → Environment Variables**

## 🔧 Qadam Bay Qadam

### 1. Vercel Dashboard'ga Kiring

1. https://vercel.com/dashboard ga kiring
2. Project'ni tanlang: `savdogar`

### 2. Settings → Environment Variables

1. **Settings** tab'ga kiring
2. **Environment Variables** section'ga kiring (General dan pastda)

### 3. PYTHONPATH Qo'shing

1. **"Add New"** yoki **"+"** tugmasini bosing
2. Quyidagilarni kiriting:

```
Key:   PYTHONPATH
Value: api
```

⚠️ **MUHIM:** 
- Value: `api` (faqat `api` yozing!)
- `/api` yoki `./api` yoki `frontend/api` **EMAS!**

3. **Environment** dropdown'dan tanlang:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
   
   (Hammasini tanlang yoki dropdown'dan "All Environments" ni tanlang)

4. **"Save"** yoki **"Add"** ni bosing

### 4. Tekshirish

1. Qo'shilgan variable'lar ro'yxatida `PYTHONPATH` ko'rinishi kerak
2. Value: `api` ko'rsatilishi kerak
3. Environment: Production, Preview, Development (hammasi belgilangan)

## ✅ To'g'ri Sozlash

```
Key: PYTHONPATH
Value: api
Environment: Production, Preview, Development (hammasi)
```

## 🔍 Nega `api` (frontend dan nisbatan)?

### Struktura:

```
savdogar_project_ready/          # GitHub repository root
├── frontend/                    # ✅ Vercel Root Directory: "frontend"
│   ├── vercel.json
│   ├── api/                     # ✅ API directory
│   │   ├── index.py            # ✅ Serverless function entrypoint
│   │   ├── app/                 # ✅ FastAPI app
│   │   │   ├── main.py         # ✅ from app.main import app (bu yerda)
│   │   │   ├── core/
│   │   │   └── ...
│   │   └── ...
│   └── ...
└── ...
```

### Nega `PYTHONPATH=api`?

1. **Root Directory:** `frontend` (Vercel Dashboard'da)
2. **Vercel ish boshlaydi:** `frontend/` papkasidan
3. **Python kod:** `frontend/api/index.py` da joylashgan
4. **Import:** `from app.main import app`
5. **Python qidiradi:** `app` modulini `sys.path` da
6. **`PYTHONPATH=api` sozlasak:** Python `frontend/api/` ni `sys.path` ga qo'shadi
7. **Natija:** Python `frontend/api/app/main.py` ni topadi va `from app.main import app` ishlaydi ✅

### Muammo agar `PYTHONPATH` yo'q bo'lsa:

```
ModuleNotFoundError: No module named 'app'
```

**Sabab:** Python `app` modulini topa olmaydi, chunki `frontend/api/` `sys.path` da yo'q.

### Muammo agar `PYTHONPATH=frontend/api` bo'lsa (Root Directory `frontend` bo'lsa):

```
ModuleNotFoundError: No module named 'app'
```

**Sabab:** Python `frontend/frontend/api/` ni qidiradi (ikkita frontend!), lekin bunday papka yo'q.

## 📊 Boshqa Environment Variables

`PYTHONPATH` bilan birga quyidagi variable'lar ham kerak:

### DATABASE_URL
```
Key: DATABASE_URL
Value: postgresql://user:password@host:port/database?sslmode=require
Environment: Production, Preview, Development
```

### SECRET_KEY
```
Key: SECRET_KEY
Value: <your-secret-key-minimum-32-characters>
Environment: Production, Preview, Development
```

### FRONTEND_URL
```
Key: FRONTEND_URL
Value: https://your-project.vercel.app
Environment: Production, Preview, Development
```

### CORS_ORIGINS
```
Key: CORS_ORIGINS
Value: https://your-project.vercel.app
Environment: Production, Preview, Development
```

## ✅ Checklist

- [ ] Vercel Dashboard → Settings → Environment Variables
- [ ] `PYTHONPATH=api` qo'shildi
- [ ] Environment: Production, Preview, Development (hammasi)
- [ ] `DATABASE_URL` qo'shildi
- [ ] `SECRET_KEY` qo'shildi
- [ ] `FRONTEND_URL` qo'shildi
- [ ] `CORS_ORIGINS` qo'shildi
- [ ] Redeploy qilindi (cache o'chirilgan)

## 🚨 Xatolar

### Muammo 1: `ModuleNotFoundError: No module named 'app'`

**Sabab:** `PYTHONPATH` yo'q yoki noto'g'ri.

**Yechim:**
1. Settings → Environment Variables
2. `PYTHONPATH=api` qo'shing (Root Directory `frontend` bo'lsa)
3. Redeploy qiling

### Muammo 2: `ModuleNotFoundError: No module named 'app'` (hali ham xatolik)

**Sabab:** `PYTHONPATH` noto'g'ri qiymatga ega (masalan, `frontend/api`).

**Yechim:**
1. Settings → Environment Variables
2. `PYTHONPATH` ni o'chiring yoki tahrirlang
3. Value ni `api` ga o'zgartiring (faqat `api`, boshqa narsa yo'q!)
4. Redeploy qiling

## 🎉 Natija

Agar `PYTHONPATH=api` to'g'ri sozlangan bo'lsa, Python import'lari ishlaydi va deploy muvaffaqiyatli bo'ladi! ✅
