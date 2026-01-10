# 🔍 Vercel 404 Xatosini Tekshirish - To'liq Checklist

## ✅ 1. Root Directory Tekshiruvi (ENG MUHIM!)

### Vercel Dashboard'da:
1. https://vercel.com/dashboard ga kiring
2. Backend project'ingizni tanlang
3. Settings → General ga kiring
4. "Root Directory" maydonini toping

**Qabul qilinadigan qiymatlar:**
```
✅ To'g'ri: backend
✅ To'g'ri: ./backend
❌ Noto'g'ri: (bo'sh)
❌ Noto'g'ri: .
❌ Noto'g'ri: /
```

**Agar noto'g'ri bo'lsa:**
1. `backend` ni kiriting (trailing slash siz!)
2. "Save" ni bosing
3. "Redeploy" qiling

---

## ✅ 2. Build Log'larni Tekshirish

### Vercel Dashboard'da:
1. Deployments tab'iga kiring
2. Eng so'nggi deployment'ni tanlang
3. "Logs" ni bosing

**Qidirilishi kerak bo'lgan log'lar:**
```
✅ "Building functions"
✅ "Installing dependencies"
✅ "api/index.py detected" yoki "Python function detected"
✅ "Build completed successfully"
```

**Agar bunday log'lar bo'lmasa:**
- ❌ Root Directory noto'g'ri
- ❌ `vercel.json` topilmagan
- ❌ `api/index.py` topilmagan

---

## ✅ 3. Function Log'larni Tekshirish

### Vercel Dashboard'da:
1. Deployments → [Latest] → Functions tab'iga kiring
2. `api/index.py` ni toping
3. "Logs" ni bosing

**Qidirilishi kerak bo'lgan log'lar:**
```
✅ "[PATH SETUP] Current file: ..."
✅ "[PATH SETUP] Backend directory: ..."
✅ "✅ Mangum handler initialized successfully"
✅ "✅ SmartPOS CRM API - Vercel Serverless Function"
```

**Agar bunday log'lar bo'lmasa:**
- ❌ Function build bo'lmagan
- ❌ Handler topilmagan
- ❌ Import xatolari

---

## ✅ 4. Function Mavjudligini Tekshirish

### Vercel Dashboard'da:
1. Deployments → [Latest] → Functions tab'iga kiring
2. Function'lar ro'yxatini ko'ring

**Ko'rinishi kerak:**
```
✅ api/index.py (function listed)
✅ Runtime: python3.12
✅ Status: Ready
```

**Agar ko'rinmasa:**
- ❌ Function build bo'lmagan
- ❌ `vercel.json` da path noto'g'ri
- ❌ Root Directory noto'g'ri

---

## ✅ 5. Haqiqiy URL'ni Topish

### Vercel Dashboard'da:
1. Project → Settings → Domains
2. Yoki Deployments → [Latest] → URL

**URL format:**
```
https://project-name.vercel.app
yoki
https://project-name-username.vercel.app
```

**Test qilish:**
```bash
# Haqiqiy URL'ni ishlating (your-backend.vercel.app emas!)
curl https://YOUR-REAL-URL.vercel.app/health
```

---

## ✅ 6. Kod Konfiguratsiyasini Tekshirish

### Local'da tekshiring:
```bash
cd backend
ls -la api/index.py    # Fayl mavjudligini tekshirish
ls -la vercel.json     # Config mavjudligini tekshirish
ls -la requirements.txt # Dependencies mavjudligini tekshirish
```

**Fayllar bo'lishi kerak:**
```
✅ backend/api/index.py
✅ backend/vercel.json
✅ backend/requirements.txt
✅ backend/pyproject.toml
```

---

## ✅ 7. Handler Export'ni Tekshirish

### `api/index.py` faylida:
```python
# Bu qatorlar bo'lishi kerak:
handler = Mangum(app)
assert callable(handler), "Handler must be callable"
__all__ = ['handler']
```

**Tekshirish:**
```bash
cd backend
python -c "from api.index import handler; print('Handler OK' if callable(handler) else 'Handler ERROR')"
```

---

## 🎯 MUAMMO DIAGNOSTIKASI:

### Muammo 1: Build juda tez tugadi (181ms)
**Sabab:** Function build bo'lmagan
**Yechim:** Root Directory o'rnating

### Muammo 2: Build log'da "No functions found"
**Sabab:** `api/index.py` topilmagan
**Yechim:** Root Directory `backend` ga o'rnating

### Muammo 3: Function log'da "Handler not found"
**Sabab:** Handler export xatosi
**Yechim:** `api/index.py` ni tekshiring

### Muammo 4: 404 xatosi hali ham bor
**Sabab:** Route configuration xatosi
**Yechim:** `vercel.json` ni tekshiring

---

## 🚨 ENG TEZ TEKSHIRUV:

1. **Vercel Dashboard → Project → Settings → General**
2. **"Root Directory"** maydoniga qarang
3. **Agar bo'sh yoki `.` bo'lsa → `backend` ga o'zgartiring**
4. **Save → Redeploy**

Bu eng katta muammoning 90% sababi!

---

## 📞 Qo'shimcha yordam:

Agar barcha qadamlarni bajargan bo'lsangiz ham muammo hal bo'lmasa:

1. Build log'larni copy qiling (Deployments → Logs)
2. Function log'larni copy qiling (Deployments → Functions → Logs)
3. Vercel Support'ga yozing

Yoki GitHub issue oching va log'larni yuklang.
