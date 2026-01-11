# 🚀 Deployment Instructions - Critical Fix

## ⏳ Current Status: DEPLOYING (2-3 minutes)

Backend'da 405 Method Not Allowed muammosi tuzatilmoqda.

## 📋 O'zgartirilganlar

### Latest Commits (2026-01-12):
1. **d9d55fc** - tenant_id/organization_id backward compatibility
2. **8236930** - Barcha v2 endpoints tuzatildi (11 ta fayl)  
3. **cb74046** - Vercel Mangum handler qo'shildi
4. **d9d30fd** - Mangum'dan voz kechildi (500 error sabab)
5. **774d943** - Minimal Vercel config (rewrites bilan)

### Current Configuration:

**backend/api/index.py:**
```python
# Native ASGI support - Vercel Python runtime
from app.main import app  # Direct export
```

**vercel.json:**
```json
{
  "version": 2,
  "builds": [{ "src": "backend/api/index.py", "use": "@vercel/python" }],
  "routes": [{ "src": "/(.*)", "dest": "backend/api/index.py" }],
  "rewrites": [{ "source": "/(.*)", "destination": "/backend/api/index.py" }]
}
```

## 🧪 Testing (2-3 daqiqa kutib)

### Option 1: Automated checker
```bash
cd /home/ali/dokon/savdogar_project_ready
bash check_deployment.sh
```

### Option 2: Manual test
```bash
# 1. Health check
curl https://savdogar-backend.vercel.app/health
# Expected: {"status": "healthy", ...}

# 2. POST test
curl -X POST https://savdogar-backend.vercel.app/api/v1/v2/products \
  -H "Content-Type: application/json" \
  -d '{"test":true}'
# Expected: 401 or 422 (NOT 405!)
```

### Option 3: Frontend test
1. Open: https://savdogar.vercel.app
2. Dashboard → Mahsulotlar → Yangi
3. Mahsulot qo'shishga harakat qiling
4. **Expected:** Mahsulot qo'shiladi (405 xatosi chiqmasligi kerak!)

## 🔍 Agar hali ham 405 bo'lsa

### A. Vercel Cache'ni tozalash (Eng muhim!)

1. **Vercel Dashboard:**
   - https://vercel.com → Your Projects → savdogar-backend
   - Settings tab
   - Scroll down to "Clear Build Cache"
   - Click "Clear Build Cache & Redeploy"

2. **Yoki manual redeploy:**
   - Deployments tab
   - Latest deployment → "..." menu
   - "Redeploy"

### B. Environment variables tekshirish

Vercel Dashboard → Settings → Environment Variables:
```
DATABASE_URL=postgresql://... (yoki POSTGRES_URL)
SECRET_KEY=...
FRONTEND_URL=https://savdogar.vercel.app
```

### C. Backend logs tekshirish

1. Vercel Dashboard → Backend project
2. Deployments → Latest
3. "Functions" tab
4. Click on `index.py` function
5. "Logs" bo'limini oching
6. POST so'rovlar logini qidiring

### D. Alternative: Manual file changes

Agar hali ham ishlamasa, `backend/api/index.py` ni qo'lda o'zgartiring:

```python
"""Vercel ASGI Entry Point"""
import sys
import os

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
sys.path.insert(0, BACKEND_DIR)

from app.main import app

# Vercel will automatically handle ASGI app
```

Push va redeploy:
```bash
git add backend/api/index.py
git commit -m "Manual: Minimal ASGI export"
git push origin master
```

## 📊 Expected Timeline

- **0-2 min:** Vercel building (GitHub shows pending)
- **2-3 min:** Deployment complete (shows ✓ on GitHub)
- **3-4 min:** Cache cleared, new version live
- **4-5 min:** Test va confirm

## ✅ Success Criteria

When deployment succeeds:
- ✅ `GET /health` returns 200 OK
- ✅ `POST /api/v1/v2/products` returns 401/422 (NOT 405!)
- ✅ Frontend mahsulot qo'shish ishlaydi
- ✅ Browser console'da 405 xatosi yo'q

## 🆘 Troubleshooting

### Issue: Still 405 after 10 minutes

**Root cause:** Vercel cache not cleared

**Solution:**
```bash
# 1. Update trigger file
echo "Rebuild: $(date)" >> .vercel-rebuild-trigger
git add .vercel-rebuild-trigger
git commit -m "Force: Clear cache"
git push origin master

# 2. Wait 3 minutes
sleep 180

# 3. Test
bash check_deployment.sh
```

### Issue: 500 Internal Server Error

**Root cause:** Deployment error (check logs)

**Solution:**
1. Check Vercel logs for Python import errors
2. Verify `requirements.txt` has all dependencies
3. Check database connection (DATABASE_URL)

### Issue: Timeout

**Root cause:** Cold start or long-running process

**Solution:**
1. Wait 30 seconds and retry
2. Check Vercel function timeout (should be 60s)
3. Optimize database connection (use connection pooling)

## 📞 Contact

Agar muammo davom etsa:
1. Vercel logs screenshotini oling
2. Browser console errorlarni copy qiling
3. `bash check_deployment.sh` natijasini yuboring

---

**Last Updated:** 2026-01-12 01:50 UTC  
**Status:** ⏳ Deploying...  
**ETA:** 2-3 minutes
