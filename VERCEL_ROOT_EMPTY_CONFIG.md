# ✅ Vercel Configuration - Root Directory BO'SH + "Include files outside" YOQILGAN

## 🎯 Hozirgi Holat:

- ✅ Root Directory: **BO'SH** (.)
- ✅ "Include files outside the root directory in the Build Step": **YOQILGAN**

Bu shuni anglatadiki:
- Vercel repository root'dan build qiladi
- `vercel.json` repository root'da bo'lishi kerak ✅ (bor)
- `requirements.txt` repository root'da bo'lishi kerak ✅ (bor)
- `backend/api/index.py` path'ini to'g'ri ko'rsatish kerak

## ✅ KONFIGURATSIYA:

### Repository Root'dagi `vercel.json`:

```json
{
  "version": 2,
  "buildCommand": "cd backend && pip install -r requirements.txt || true",
  "routes": [
    {
      "src": "/(.*)",
      "dest": "backend/api/index.py"  // Root'dan relative path
    }
  ],
  "functions": {
    "backend/api/index.py": {  // Root'dan relative path
      "runtime": "python3.12",
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

### Qanday Ishlaydi:

1. **Vercel repository root'dan qidiradi** (Root Directory bo'sh)
2. **Root'dagi `vercel.json` topiladi**
3. **`buildCommand` ishlaydi** - `backend/requirements.txt` ni install qiladi
4. **`dest: "backend/api/index.py"`** - Root'dan relative path
5. **Vercel `backend/api/index.py` ni topadi** va handler'ni aniqlaydi

## ⚠️ MUHIM TEKSHIRUVLAR:

### 1. Vercel Dashboard Settings:

**Settings → General:**
- ✅ Root Directory: **BO'SH** yoki `.`
- ✅ "Include files outside the root directory in the Build Step": **YOQILGAN** ✅

**Settings → Git:**
- ✅ Production Branch: `master`
- ✅ Automatic Deployments: **YOQILGAN**

### 2. Build Log'larda Qidirilishi Kerak:

```
✓ Installing dependencies from requirements.txt
✓ Building functions
✓ backend/api/index.py detected
✓ Python runtime: python3.12
```

### 3. Function Log'larda Qidirilishi Kerak:

```
[PATH SETUP] Current file: .../backend/api/index.py
[PATH SETUP] Backend directory: .../backend
✅ Mangum handler initialized successfully
```

## 🚨 MUAMMO HAL BO'LMASA:

### Variant A: "Include files outside" ni O'CHIRISH

Agar muammo davom etsa:

1. Vercel Dashboard → Settings → General
2. "Include files outside the root directory in the Build Step" ni **O'CHIRING**
3. Root Directory'ni `backend` ga **O'RNATING**
4. Save → Redeploy

Bu holda `backend/vercel.json` ishlaydi.

### Variant B: Manual Deploy

1. Deployments → "Deploy" tugmasi
2. "Deploy from GitHub" tanlang
3. Repository: `Hazratqul21/savdogar`
4. Branch: `master`
5. Root Directory: **BO'SH** qoldiring
6. "Include files outside" checkbox: **YOQILGAN** ✅
7. Deploy qiling

## ✅ FINAL CHECKLIST:

- [x] Root Directory: BO'SH
- [x] "Include files outside": YOQILGAN
- [x] `/vercel.json` → `backend/api/index.py` ga yo'naltiradi
- [x] `/requirements.txt` repository root'da
- [x] `/pyproject.toml` repository root'da
- [ ] Build log'da "backend/api/index.py detected" ko'rinishi
- [ ] Function log'da "Mangum handler initialized" ko'rinishi
- [ ] Health endpoint test qiling
