# 405 Method Not Allowed - To'liq Yechim

## Muammo

Frontend'dan POST so'rov yuborilganda, backend 405 "Method Not Allowed" xatosini qaytarmoqda.

## Tekshirish Qadamlari

### 1. Browser DevTools'da Tekshirish

1. **F12** ni bosing
2. **Network** tab'ni oching
3. Registration form'ni to'ldiring va submit qiling
4. `/api/v1/auth/signup` so'rovini toping
5. **Headers** tab'ni oching

**Tekshirish:**
- **Request Method:** `POST` bo'lishi kerak
- **Request URL:** `/api/v1/auth/signup` bo'lishi kerak
- **Response Status:** Agar 405 bo'lsa, **Response Headers** da `Allow` header'ni ko'ring

### 2. Vercel Logs'da Tekshirish

1. Vercel Dashboard → **Deployments** → [Latest]
2. **Logs** tab'ni oching
3. Registration urinib ko'ring
4. Logs'da quyidagilarni qidiring:
   - `405`
   - `Method Not Allowed`
   - `OPTIONS`
   - `POST`

## Yechimlar

### Yechim 1: Environment Variable'larni Tekshirish

Vercel'da quyidagilar **majburiy**:

1. ✅ `ENVIRONMENT=production`
2. ✅ `DATABASE_URL=postgresql://...?sslmode=require`
3. ✅ `SECRET_KEY=...` (min 32 belgi)
4. ✅ `FRONTEND_URL=https://your-domain.com`

**Agar bular yo'q bo'lsa, 405 xatosi kelishi mumkin!**

### Yechim 2: CORS Preflight (OPTIONS) So'rovlari

Browser avtomatik ravishda OPTIONS so'rov yuboradi (CORS preflight). Bu so'rovlar to'g'ri handle qilinishi kerak.

**Tekshirish:**
- Network tab'da `/api/v1/auth/signup` ga **OPTIONS** so'rov borligini tekshiring
- Agar OPTIONS 405 qaytarsa, muammo CORS preflight'da

**Yechim:** OPTIONS handler allaqachon qo'shilgan. Agar hali ham muammo bo'lsa, Vercel'da redeploy qiling.

### Yechim 3: Vercel Routing

Vercel'da routing to'g'ri sozlanganligini tekshiring:

**vercel.json:**
```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.py"
    }
  ]
}
```

Bu to'g'ri. `/api/v1/auth/signup` so'rov `/api/index.py` ga yo'naltiriladi va to'liq path `/api/v1/auth/signup` bo'lib qoladi.

### Yechim 4: FastAPI Router Prefix

FastAPI app'da router to'g'ri qo'shilganligini tekshiring:

```python
app.include_router(api_router, prefix="/api/v1")
```

Bu to'g'ri. `/api/v1/auth/signup` path to'g'ri ishlashi kerak.

### Yechim 5: Mangum Handler

Mangum handler to'g'ri sozlanganligini tekshiring:

```python
handler = Mangum(
    app, 
    lifespan="off",
    text_mime_types=["application/json", "text/plain", "application/x-www-form-urlencoded"],
    enable_lifespan=False,
)
```

Bu to'g'ri.

## Asosiy Muammo va Yechim

**Asosiy muammo:** Environment variable'lar to'g'ri sozlanmagan bo'lishi mumkin.

**Yechim:**

1. **Vercel Dashboard → Settings → Environment Variables**
2. Quyidagilarni qo'shing/yangilang:
   - `ENVIRONMENT=production`
   - `DATABASE_URL=postgresql://...?sslmode=require` (Session Pooler port 6543)
   - `SECRET_KEY=...` (min 32 belgi)
   - `FRONTEND_URL=https://your-domain.com`
3. **Redeploy qiling**

## Tekshirish

O'zgarishlardan keyin:

1. **Browser Console'ni oching (F12)**
2. **Network tab'ni oching**
3. Registration form'ni to'ldiring va submit qiling
4. `/api/v1/auth/signup` so'rovini tekshiring:
   - **Status:** 200 yoki 201 bo'lishi kerak (405 emas)
   - **Method:** POST
   - **Response:** JSON response kelishi kerak

## Agar Hali Ham 405 Bo'lsa

1. **Vercel Logs'ni tekshiring:**
   - Deployments → [Latest] → Logs
   - 405 xatosi haqida ma'lumot qidiring

2. **Browser Console'ni tekshiring:**
   - F12 → Console
   - Xatolarni ko'ring

3. **Network Tab'ni tekshiring:**
   - F12 → Network
   - Request va Response'ni ko'ring

4. **Environment Variable'larni tekshiring:**
   - Vercel → Settings → Environment Variables
   - Barcha kerakli variable'lar mavjudligini tekshiring

## Debug Qadamlari

Agar muammo davom etsa, quyidagilarni bajaring:

1. Vercel Logs'da aniq xatolikni toping
2. Browser Network tab'da request/response'ni ko'ring
3. Environment variable'larni to'liq tekshiring
4. Redeploy qiling

## Xulosa

405 xatosi odatda quyidagilardan kelib chiqadi:
1. ❌ Environment variable'lar to'g'ri sozlanmagan
2. ❌ CORS preflight (OPTIONS) to'g'ri handle qilinmagan
3. ❌ Vercel routing muammosi

Barcha yechimlar qo'llanilgan. Agar hali ham muammo bo'lsa, Vercel Logs'ni tekshiring.
