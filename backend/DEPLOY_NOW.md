# 🚀 DEPLOY NOW - Root Directory = "backend" (To'g'ri Konfiguratsiya)

## ✅ KONFIGURATSIYA READY:

### Backend Fayllar (barchasi commit qilingan):
- ✅ `backend/vercel.json` → Routes to `/api/index.py` ✅
- ✅ `backend/api/index.py` → Handler exported ✅
- ✅ `backend/requirements.txt` → Dependencies ✅
- ✅ `backend/pyproject.toml` → Python runtime ✅
- ✅ `backend/runtime.txt` → Python 3.12 ✅

### Repository Root Fayllar (backup):
- ✅ `/vercel.json` → Routes to `backend/api/index.py` (Root Directory bo'sh uchun)
- ✅ `/requirements.txt` → Dependencies (backup)
- ✅ `/pyproject.toml` → Python runtime (backup)

## 🎯 VERCEL DASHBOARD'DA QILISH KERAK:

### 1️⃣ Settings → General:

**Root Directory:**
```
✅ backend
```
(bo'sh emas, trailing slash siz, faqat `backend`)

**Framework Preset:**
```
✅ Other
```

**"Include files outside the root directory in the Build Step":**
```
✅ YOQILGAN yoki O'CHIRILGAN (ikkala variant ishlaydi)
```

### 2️⃣ Settings → Git:

**Production Branch:**
```
✅ master
```

**Automatic Deployments:**
```
✅ YOQILGAN
```

### 3️⃣ Save va Redeploy:

1. "Save" ni bosing
2. Deployments tab'iga kiring
3. "Deploy" tugmasini bosing yoki eng so'nggi deployment'ni Redeploy qiling

## 🔍 TEKSHIRISH:

### Build Log'da (Deployments → Logs):

```
✅ "Installing dependencies from requirements.txt"
✅ "Building functions"
✅ "api/index.py detected" yoki "Python function detected"
✅ "Build completed successfully"
```

### Function Log'da (Deployments → Functions → Logs):

```
✅ "[PATH SETUP] Current file: .../backend/api/index.py"
✅ "[PATH SETUP] Backend directory: .../backend"
✅ "✅ Mangum handler initialized successfully"
```

### Test:

```bash
curl https://YOUR-URL.vercel.app/health
# Expected: {"status": "healthy", ...}

curl https://YOUR-URL.vercel.app/api/v1/health
# Expected: Health status JSON
```

## ⚠️ MUAMMO HAL BO'LMASA:

### Ehtimol Webhook Ishlamayapti:

1. GitHub → Settings → Webhooks
2. Vercel webhook'ining mavjudligini tekshiring
3. "Recent Deliveries" da oxirgi push event'ni ko'ring
4. Agar xatolik bo'lsa, webhook'ni qayta yarating

### Yoki Manual Deploy:

1. Vercel Dashboard → Deployments → "Deploy"
2. "Deploy from GitHub" tanlang
3. Repository: `Hazratqul21/savdogar`
4. Branch: `master`
5. Root Directory: **`backend`** ✅
6. Framework: **Other**
7. Deploy qiling

---

**ENG MUHIM:** Root Directory = **`backend`** o'rnating va Save → Redeploy qiling!
