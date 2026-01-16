# 🔴 VERCEL 404 - ROOT DIRECTORY MUAMMOSI

## Muammo

Vercel 404 qaytarishining sababi - **Vercel Project Settings da "Root Directory" noto'g'ri sozlangan**.

---

## 🔍 TEKSHIRISH KERAK

### Vercel Dashboard da:

1. https://vercel.com ga kiring
2. **savdogar-backend** project ni oching
3. **Settings** → **General** → **Root Directory**

### Ikkita Variant:

**Variant A: Root Directory = "" (bo'sh)**
```
Agar Root Directory bo'sh bo'lsa:
- vercel.json: api/index.py
- Fayllar: /api/index.py, /app/, /requirements.txt
- BU HOZIRGI HOLATIMIZ ✅
```

**Variant B: Root Directory = "backend"**
```
Agar Root Directory "backend" bo'lsa:
- vercel.json: api/index.py (backend ichida)
- Fayllar: backend/api/index.py, backend/app/
- BU ESKI HOLATIMIZ
```

---

## ✅ YECHIM

### Agar Root Directory = "" (bo'sh) bo'lsa:
Hozirgi konfiguratsiya to'g'ri. Vercel build log larini tekshiring.

### Agar Root Directory = "backend" bo'lsa:
**Ikki variant:**

**Option 1:** Root Directory ni "" (bo'sh) ga o'zgartiring
- Settings → General → Root Directory → bo'sh qoldiring
- Save → Redeploy

**Option 2:** Backend ni alohida deploy qiling
- backend/ papkasida ishlash
- backend/vercel.json qayta yaratish

---

## 🚀 TEZKOR TUZATISH

### Vercel Dashboard da Root Directory tekshiring:

1. https://vercel.com/dashboard
2. **savdogar-backend** project
3. **Settings** → **General**
4. **Root Directory** ni toping

**Agar "backend" yozilgan bo'lsa:**
- Uni o'chiring (bo'sh qoldiring)
- **Save** tugmasini bosing
- **Deployments** → oxirgi deploy → **Redeploy**

---

## 📊 Kutilayotgan Natija

Root Directory bo'sh bo'lganda va Redeploy qilinganda:
```
✅ Health check: https://savdogar-backend.vercel.app/health
✅ API docs: https://savdogar-backend.vercel.app/docs
✅ Products: https://savdogar-backend.vercel.app/api/v1/v2/products
```

---

**Sabab:** Vercel Root Directory sozlamasi  
**Yechim:** Root Directory ni bo'sh qoldiring va Redeploy qiling  
**Vaqt:** 2-3 daqiqa
