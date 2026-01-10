# ✅ Vercel Root Directory = "backend" Konfiguratsiya

## 🎯 Hozirgi Holat:

- ✅ Framework Preset: **Other**
- ✅ Root Directory: **`backend`** (o'rnatilishi kerak)
- ✅ "Include files outside the root directory in the Build Step": **YOQILGAN** yoki O'CHIRILGAN (ikkala variant ishlaydi)

## ✅ KONFIGURATSIYA - Root Directory = "backend"

### Vercel Dashboard Settings:

1. **Settings → General:**
   - Root Directory: **`backend`** ✅ (trailing slash siz!)
   - "Include files outside...": **YOQILGAN** yoki **O'CHIRILGAN** (ikkala variant ishlaydi)

2. **Settings → Git:**
   - Production Branch: **`master`** ✅
   - Automatic Deployments: **YOQILGAN** ✅

### Fayllar (backend/ papkasida):

- ✅ `backend/vercel.json` - Routes to `/api/index.py` (relative to backend/)
- ✅ `backend/api/index.py` - Handler function exported
- ✅ `backend/requirements.txt` - Dependencies
- ✅ `backend/pyproject.toml` - Python runtime config
- ✅ `backend/runtime.txt` - Python 3.12

### Qanday Ishlaydi (Root Directory = "backend"):

```
Request → Vercel Router
  ↓
Root Directory: "backend" ✅
  ↓
Looks for vercel.json in backend/ ✅ (Found: backend/vercel.json)
  ↓
Reads backend/vercel.json:
  routes: dest: "/api/index.py"  // Relative to backend/ directory
  ↓
Looks for api/index.py relative to backend/ ✅ (Found: backend/api/index.py!)
  ↓
Loads backend/api/index.py and looks for 'handler' ✅
  ↓
Calls handler() function ✅
  ↓
Response sent successfully ✅
```

## 📋 CRITICAL CHECKLIST:

### Vercel Dashboard'da:

- [ ] Settings → General → Root Directory = **`backend`** (trailing slash siz!)
- [ ] Settings → General → Framework Preset = **Other**
- [ ] Settings → Git → Production Branch = **`master`**
- [ ] Settings → Git → Automatic Deployments = **YOQILGAN**
- [ ] Save qiling
- [ ] Redeploy qiling

### Backend Fayllar:

- [x] ✅ `backend/vercel.json` → Routes to `/api/index.py`
- [x] ✅ `backend/api/index.py` → Handler exported
- [x] ✅ `backend/requirements.txt` → Dependencies listed
- [x] ✅ `backend/pyproject.toml` → Python runtime configured

## 🔍 TEKSHIRISH:

### 1. Build Log'larda:

Deployments → [Latest] → Logs:

```
✅ "Building functions"
✅ "Installing dependencies from requirements.txt"
✅ "api/index.py detected" yoki "Python function detected"
✅ "Build completed successfully"
```

### 2. Function Log'larda:

Deployments → Functions → Logs:

```
✅ "[PATH SETUP] Current file: .../backend/api/index.py"
✅ "[PATH SETUP] Backend directory: .../backend"
✅ "✅ Mangum handler initialized successfully"
✅ "✅ SmartPOS CRM API - Vercel Serverless Function"
```

### 3. Test Qilish:

```bash
curl https://YOUR-URL.vercel.app/health
curl https://YOUR-URL.vercel.app/api/v1/health
```

## 🚨 MUAMMO HAL BO'LMASA:

### Variant A: "Include files outside" ni O'CHIRISH

Agar muammo davom etsa:

1. Settings → General → "Include files outside..." → **O'CHIRING**
2. Root Directory: **`backend`** ✅
3. Save → Redeploy

### Variant B: Manual Redeploy

1. Deployments → "Deploy" tugmasi
2. "Deploy from GitHub" tanlang
3. Repository: `Hazratqul21/savdogar`
4. Branch: `master`
5. Root Directory: **`backend`** ✅
6. Framework: **Other**
7. Deploy qiling

## ✅ FINAL CHECKLIST:

- [ ] Root Directory: **`backend`** (Vercel Dashboard'da)
- [ ] Framework Preset: **Other**
- [ ] Production Branch: **`master`**
- [ ] Automatic Deployments: **YOQILGAN**
- [ ] Manual redeploy qiling (agar avtomatik ishlamasa)
- [ ] Build log'da "api/index.py detected" ko'rinishi
- [ ] Function log'da "Mangum handler initialized" ko'rinishi
- [ ] Health endpoint test qiling

---

**ENGA MUHIM:** Root Directory = **`backend`** o'rnating va Redeploy qiling!
