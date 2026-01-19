# 🔴 VERCEL 404 - ROOT LEVEL STRUKTURA TUZATISH

## Muammo

Vercel Python runtime **root level** da quyidagi strukturani kutadi:
```
project/
├── api/
│   └── index.py      # Entry point
├── app/              # FastAPI app
│   └── main.py
├── requirements.txt
└── vercel.json
```

Bizda esa `backend/api/index.py` strukturasi bor edi - bu Vercel uchun ishlamaydi.

---

## ✅ Yechim

### 1. Root Level Strukturani Yaratish

```bash
# Backend fayllarini root level ga ko'chirish
cp -r backend/api api
cp -r backend/app app
cp backend/requirements.txt requirements.txt
```

### 2. `api/index.py` Tuzatish

```python
"""
Vercel Serverless Function Entry Point
"""
import sys
import os

# Add current directory to Python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)

if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

os.environ["VERCEL"] = "1"

# Import from root level app directory
from app.main import app

__all__ = ['app']
```

### 3. `vercel.json` Soddalashtirildi

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.py"
    }
  ]
}
```

---

## 📁 Yangi Struktura

```
savdogar/
├── api/                    # ✅ Root level (Vercel kerak)
│   └── index.py
├── app/                    # ✅ Root level (Vercel kerak)
│   ├── main.py
│   ├── api/
│   ├── models/
│   ├── schemas/
│   └── core/
├── backend/                # ⚠️ Eski struktura (saqlanadi)
│   ├── api/
│   └── app/
├── requirements.txt        # ✅ Root level (Vercel kerak)
└── vercel.json             # ✅ Root level
```

---

## 🚀 DEPLOY

```bash
cd /Users/hazratqul/Documents/GitHub/savdogar

# O'zgarishlarni qo'shish
git add api/ app/ requirements.txt vercel.json

# Commit
git commit -m "FIX: Vercel 404 - root level structure

- Created api/ at root level (Vercel requirement)
- Created app/ at root level (Vercel requirement)
- Copied requirements.txt to root
- Updated vercel.json for root level structure
- backend/ directory kept for reference

Fixes: 404 NOT_FOUND error
Version: v4.2.0"

# Push
git push origin master
```

**Vercel avtomatik deploy qiladi - 3-5 daqiqa kuting!**

---

## 🧪 Test

```bash
# Health check
curl https://savdogar-backend.vercel.app/health

# API docs
curl https://savdogar-backend.vercel.app/docs

# Products
curl https://savdogar-backend.vercel.app/api/v1/v2/products?limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Tuzatildi:** 2026-01-16 06:40  
**Versiya:** v4.2.0  
**Status:** ✅ Tayyor
