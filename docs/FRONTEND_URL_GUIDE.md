# FRONTEND_URL Sozlash Qo'llanmasi

## Monorepo yoki Custom Domain?

### Variant 1: Monorepo (Frontend va Backend bir domain'da)

Agar sizning loyihangiz **monorepo** (frontend va backend bir Vercel project'da), quyidagilardan birini tanlang:

#### A) Vercel'ning avtomatik domain'i (`.vercel.app`)

Vercel Dashboard → Settings → Domains'da ko'rasiz:
- `your-project.vercel.app`
- Yoki `your-project-username.vercel.app`

**FRONTEND_URL:**
```
FRONTEND_URL=https://your-project.vercel.app
```

#### B) Custom Domain (Ahostdan sotib olingan)

Agar siz custom domain ulagansiz (masalan: `savdogar.uz`, `myshop.com`):

**FRONTEND_URL:**
```
FRONTEND_URL=https://savdogar.uz
```

Yoki agar `www` bilan ham ishlatmoqchi bo'lsangiz:
```
CORS_ORIGINS=https://savdogar.uz,https://www.savdogar.uz
```

### Variant 2: Alohida Domain'lar (Frontend va Backend alohida)

Agar frontend va backend alohida domain'larda bo'lsa:

**FRONTEND_URL:**
```
FRONTEND_URL=https://frontend-domain.com
```

**Yoki CORS_ORIGINS:**
```
CORS_ORIGINS=https://frontend-domain.com,https://www.frontend-domain.com
```

## Qanday Topish Mumkin?

### 1. Vercel Dashboard'dan

1. Vercel Dashboard → Project → Settings → Domains
2. U yerda ko'rasiz:
   - Vercel domain: `your-project.vercel.app`
   - Custom domain'lar (agar ulagansiz)

### 2. Browser'dan

1. Saytingizni oching
2. Browser address bar'da URL'ni ko'ring
3. Masalan: `https://savdogar.uz` yoki `https://myapp.vercel.app`

### 3. Vercel Deployment'dan

1. Vercel Dashboard → Deployments
2. Eng so'nggi deployment'ni oching
3. "Visit" tugmasini bosing
4. URL'ni ko'ring

## Monorepo uchun Tavsiya

Agar monorepo ishlatayotgan bo'lsangiz (frontend va backend bir project'da), quyidagilardan birini tanlang:

### Variant A: FRONTEND_URL qo'yish (Tavsiya etiladi)

```
FRONTEND_URL=https://your-project.vercel.app
```

Yoki custom domain bo'lsa:
```
FRONTEND_URL=https://your-custom-domain.com
```

### Variant B: Bo'sh qoldirish (Ishlaydi, lekin yaxshi emas)

Agar `FRONTEND_URL` bo'sh qoldirsangiz, kod avtomatik same-origin CORS ishlatadi, lekin yaxshiroq aniq qo'yish.

## Custom Domain (Ahostdan) uchun

Agar siz custom domain ulagansiz:

1. **Vercel Dashboard → Settings → Domains** ga kiring
2. Custom domain'ingizni ko'ring (masalan: `savdogar.uz`)
3. **FRONTEND_URL** ga shu domain'ni qo'ying:

```
FRONTEND_URL=https://savdogar.uz
```

Agar `www` bilan ham ishlatmoqchi bo'lsangiz:
```
CORS_ORIGINS=https://savdogar.uz,https://www.savdogar.uz
```

## Tekshirish

O'zgarishlardan keyin:

1. **Redeploy qiling:**
   - Vercel Dashboard → Deployments → Redeploy

2. **Browser Console'da tekshiring:**
   - F12 → Console
   - CORS xatolarini qidiring

3. **Network tab'da:**
   - F12 → Network
   - Login/Signup request'ini tekshiring
   - Response headers'da `Access-Control-Allow-Origin` ni ko'ring

## Misollar

### Misol 1: Vercel Domain
```
FRONTEND_URL=https://savdogar-project.vercel.app
```

### Misol 2: Custom Domain (Ahostdan)
```
FRONTEND_URL=https://savdogar.uz
```

### Misol 3: www bilan
```
CORS_ORIGINS=https://savdogar.uz,https://www.savdogar.uz
```

### Misol 4: Monorepo (bo'sh qoldirish - ishlaydi, lekin yaxshi emas)
```
# FRONTEND_URL ni qo'ymaslik ham mumkin, lekin tavsiya etilmaydi
```

## Muhim Eslatmalar

1. ✅ **HTTPS** ishlatish kerak (`https://`, `http://` emas)
2. ✅ **Slash** oxirida bo'lmasligi kerak (`https://domain.com/` ❌, `https://domain.com` ✅)
3. ✅ Agar bir nechta domain bo'lsa, `CORS_ORIGINS` ishlating
4. ✅ Custom domain bo'lsa, Vercel'da to'g'ri sozlanganligini tekshiring
