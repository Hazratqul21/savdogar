# Deployment URLs va Environment Variables

## 🌐 Deployment Manzillari

- **Backend:** https://savdogar.vercel.app/
- **Frontend:** https://savdogar-kt7z.vercel.app/
- **Docs:** https://savdogar-otjp.vercel.app/

## 🔧 Frontend Vercel Environment Variables

Frontend Vercel loyihasida quyidagi environment variable'ni qo'shing:

```
NEXT_PUBLIC_API_URL=https://savdogar.vercel.app
```

**Qo'shish:**
1. Vercel Dashboard → Frontend loyiha → Settings → Environment Variables
2. `NEXT_PUBLIC_API_URL` = `https://savdogar.vercel.app`
3. Production, Preview, Development uchun qo'shing
4. Redeploy qiling

## 🔒 Backend CORS Sozlamalari

Backend'da CORS sozlamalari quyidagi domain'lar uchun ochiq:
- `https://savdogar-kt7z.vercel.app` (Frontend)
- `https://savdogar-otjp.vercel.app` (Docs)
- `http://localhost:3000` (Local development)

## ✅ Test Qilish

1. Frontend'da login qiling: https://savdogar-kt7z.vercel.app/login
2. Browser DevTools → Network tab'da API so'rovlarini tekshiring
3. API so'rovlari `https://savdogar.vercel.app/api/v1/...` ga ketishi kerak

## 🐛 Muammo bo'lsa

- Browser Console'da xatoliklarni tekshiring
- Network tab'da API so'rovlarini ko'ring
- Backend loglarini Vercel Dashboard'da tekshiring
- CORS xatolik bo'lsa, backend'da domain'lar to'g'ri qo'shilganini tekshiring

