# 405 Method Not Allowed - To'liq Yechim

## Asosiy Muammo

Vercel serverless function'da FastAPI + Mangum bilan 405 xatosi kelib chiqadi. Bu CORS preflight (OPTIONS) so'rovlar to'g'ri handle qilinmayotgani yoki path routing muammosidan kelib chiqadi.

## Qilingan O'zgarishlar

### 1. OPTIONS Handler (main.py)

```python
# CRITICAL FIX: Explicit OPTIONS handler for CORS preflight
# MUST be defined BEFORE routers to catch OPTIONS requests first
@app.options("/{full_path:path}")
async def options_handler(full_path: str, request: Request):
    """Handle CORS preflight OPTIONS requests for all paths"""
    # ... handler code ...
```

**Muhim:** Bu handler router'lardan **OLDIN** qo'yilgan, chunki FastAPI route matching tartibiga qarab ishlaydi.

### 2. CORS Middleware

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],  # Barcha method'lar ruxsat etilgan
    allow_headers=["*"],
)
```

### 3. Rate Limit Middleware

```python
# Rate limiting - MUST be first to catch all requests
app.add_middleware(RateLimitMiddleware)
```

Rate limit middleware OPTIONS so'rovlarni skip qiladi.

### 4. Vercel Routing (vercel.json)

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

Vercel `/api/v1/auth/signup` so'rovini `/api/index.py` ga yuboradi va to'liq path `/api/v1/auth/signup` bo'lib qoladi.

### 5. Mangum Handler (index.py)

```python
handler = Mangum(
    app, 
    lifespan="off",
    text_mime_types=["application/json", "text/plain", "application/x-www-form-urlencoded"],
    enable_lifespan=False,
)
```

## Tekshirish Qadamlari

### 1. Vercel Logs'ni Tekshiring

1. Vercel Dashboard → Deployments → [Latest]
2. **Logs** tab'ni oching
3. Registration form'ni submit qiling
4. Logs'da quyidagilarni qidiring:
   - `OPTIONS request received for path: ...`
   - `405`
   - `Method Not Allowed`

**Agar OPTIONS request log ko'rsatmasa:**
- OPTIONS so'rov handler'ga yetib bormayapti
- Vercel routing muammosi bo'lishi mumkin

**Agar OPTIONS request log ko'rsatsa, lekin 405 hali ham bo'lsa:**
- POST so'rov to'g'ri route'ga yetib bormayapti
- Route matching muammosi bo'lishi mumkin

### 2. Browser DevTools'da Tekshiring

1. **F12** → **Network** tab
2. Registration form'ni submit qiling
3. `/api/v1/auth/signup` so'rovini toping
4. **Headers** tab'ni oching:

**Request Headers:**
- `Request Method:` `POST` bo'lishi kerak
- `Request URL:` `/api/v1/auth/signup`

**Response Headers:**
- `Status Code:` 405 bo'lsa, `Allow` header'ni ko'ring
- `Access-Control-Allow-Origin:` mavjud bo'lishi kerak

### 3. Environment Variable'larni Tekshiring

Vercel Dashboard → Settings → Environment Variables:

**Majburiy:**
- ✅ `ENVIRONMENT=production`
- ✅ `DATABASE_URL=postgresql://...?sslmode=require`
- ✅ `SECRET_KEY=...` (min 32 belgi)
- ✅ `FRONTEND_URL=https://your-domain.com` yoki `CORS_ORIGINS=...`

**Agar bular yo'q bo'lsa, 405 xatosi kelishi mumkin!**

## Asosiy Muammo va Yechim

### Muammo 1: OPTIONS Handler Router'lardan Keyin

**Xato:**
```python
app.include_router(api_router, prefix="/api/v1")
@app.options("/{full_path:path}")  # ❌ Bu kech!
```

**To'g'ri:**
```python
@app.options("/{full_path:path}")  # ✅ Bu oldin!
app.include_router(api_router, prefix="/api/v1")
```

### Muammo 2: CORS Middleware Noto'g'ri Sozlangan

**Xato:**
```python
allow_methods=["GET", "POST"]  # ❌ OPTIONS yo'q!
```

**To'g'ri:**
```python
allow_methods=["*"]  # ✅ Barcha method'lar
```

### Muammo 3: Vercel Path Handling

Vercel `/api/v1/auth/signup` so'rovini `/api/index.py` ga yuboradi. Mangum bu path'ni to'g'ri handle qilishi kerak.

**Tekshirish:**
- Vercel Logs'da path to'g'ri kelayotganini tekshiring
- FastAPI route'lar `/api/v1` prefix bilan qo'shilganligini tekshiring

## Debug Qadamlari

### 1. Vercel Logs'da Debug

```python
# main.py da logging qo'shildi
logger.info(f"OPTIONS request received for path: {full_path}")
```

Logs'da bu xabar ko'rsatilsa, OPTIONS handler ishlayapti.

### 2. Browser Network Tab'da Debug

1. F12 → Network
2. `/api/v1/auth/signup` so'rovini toping
3. **Preview** yoki **Response** tab'ni oching
4. 405 xatosi bo'lsa, response body'ni ko'ring

### 3. Test Endpoint

```bash
curl -X OPTIONS https://your-domain.com/api/v1/auth/signup \
  -H "Origin: https://your-domain.com" \
  -v
```

Bu 200 qaytarishi kerak.

## Xulosa

405 xatosi quyidagilardan kelib chiqadi:

1. ❌ OPTIONS handler router'lardan keyin qo'yilgan
2. ❌ CORS middleware noto'g'ri sozlangan
3. ❌ Environment variable'lar to'g'ri sozlanmagan
4. ❌ Vercel routing muammosi

**Barcha yechimlar qo'llanilgan. Agar hali ham muammo bo'lsa:**

1. Vercel Logs'ni to'liq tekshiring
2. Browser Network tab'da request/response'ni ko'ring
3. Environment variable'larni to'liq tekshiring
4. Redeploy qiling

## Keyingi Qadamlar

1. **Redeploy qiling** (push avtomatik trigger qiladi)
2. **Vercel Logs'ni tekshiring** - OPTIONS request log ko'rsatilishini tasdiqlang
3. **Browser Network tab'ni tekshiring** - 405 xatosi yo'qolganini tasdiqlang
4. **Test qiling** - Registration va login ishlayotganini tasdiqlang
