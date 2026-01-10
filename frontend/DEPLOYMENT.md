# Frontend Deployment Guide - Vercel

Frontend'ni Vercel'da deploy qilish uchun quyidagi qadamlarni bajaring.

## Vercel'da Alohida Project Yaratish

### 1. Vercel Dashboard'ga kiring
- https://vercel.com/dashboard ga kiring
- "Add New" → "Project" ni bosing

### 2. GitHub Repository'ni ulang
- Repository: `Hazratqul21/savdogar` ni tanlang
- Framework Preset: **"Next.js"** ni tanlang

### 3. Project Settings'ni sozlang

#### ⚠️ MUHIM: Root Directory
```
frontend
```
**CRITICAL**: Root directory `frontend` bo'lishi kerak, root emas! Agar root bo'lsa, 404 xatosi chiqadi.

#### Build & Output Settings
- Framework Preset: **Next.js** (avtomatik tanlangan)
- Build Command: `npm run build` (avtomatik)
- Output Directory: `.next` (avtomatik)
- Install Command: `npm install` (avtomatik)

#### Environment Variables
**REQUIRED** - Quyidagi environment variables'ni qo'shing:

```env
# REQUIRED: Backend API URL
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
# Development uchun: http://localhost:8000
# Production uchun: https://your-backend.vercel.app

# OPTIONAL: Supabase (Global Catalog uchun)
# Agar yo'q bo'lsa, Global Catalog features o'chadi, lekin app ishlaydi
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**MUHIM**: `NEXT_PUBLIC_` prefix muhim - bu o'zgaruvchilarni browser'ga expose qiladi.

### 4. Deploy qiling
- "Deploy" ni bosing
- Vercel avtomatik ravishda Next.js build qiladi

## Troubleshooting

### 404 Error (Sahifa topilmadi)

**Muammo**: Frontend deploy muvaffaqiyatli, lekin ochilganda 404 xatosi chiqadi.

**Yechim**:
1. **Root Directory tekshiring**:
   - Vercel Dashboard → Project Settings → General
   - Root Directory: `frontend` bo'lishi kerak (root emas!)
   - Agar root bo'lsa, o'zgartiring va qayta deploy qiling

2. **Build Command tekshiring**:
   - Build Command: `cd frontend && npm run build` emas!
   - Agar root directory `frontend` bo'lsa, build command `npm run build` bo'lishi kerak (Vercel avtomatik qiladi)

3. **Package.json tekshirish**:
   - `frontend/package.json` da `"build": "next build"` bo'lishi kerak

4. **Next.js config tekshiring**:
   - `frontend/next.config.ts` mavjudligini tekshiring
   - `output: 'standalone'` yoki `output: 'export'` yo'qligini tekshiring (default `server` bo'lishi kerak)

### Environment Variables muammosi

**Muammo**: API calls ishlamayapti yoki xatolik chiqyapti.

**Yechim**:
1. **Environment Variables qo'shing**:
   - Vercel Dashboard → Project Settings → Environment Variables
   - `NEXT_PUBLIC_API_URL` qo'shing (backend URL)
   - Production, Preview, Development uchun alohida qo'shishingiz mumkin

2. **Variable nomlarini tekshiring**:
   - `NEXT_PUBLIC_` prefix bo'lishi kerak
   - Katta-kichik harflarni tekshiring

3. **Redeploy qiling**:
   - Environment variables o'zgargandan keyin redeploy qiling

### Build Error

**Muammo**: Build xatosi chiqyapti.

**Yechim**:
1. **Build logs'ni tekshiring**:
   - Vercel Dashboard → Deployments → Build Logs
   - Xatolik qayerda ekanligini aniqlang

2. **Dependencies tekshiring**:
   - `frontend/package.json` da barcha dependencies mavjudligini tekshiring
   - `npm install` local'da ishlashini tekshiring

3. **TypeScript xatolari**:
   - `npm run build` local'da ishlatib tekshiring
   - TypeScript xatolarini tuzating

## Production Checklist

- [ ] Root directory: `frontend` (root emas!)
- [ ] Framework Preset: `Next.js`
- [ ] Build Command: `npm run build` (avtomatik)
- [ ] Output Directory: `.next` (avtomatik)
- [ ] `NEXT_PUBLIC_API_URL` sozlangan (backend URL)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` sozlangan (agar Global Catalog kerak bo'lsa)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` sozlangan (agar Global Catalog kerak bo'lsa)
- [ ] Build muvaffaqiyatli
- [ ] Homepage ochiladi (404 emas)
- [ ] Login page ochiladi
- [ ] API calls ishlaydi

## Common Issues

### Issue 1: 404 Error
**Sabab**: Root directory noto'g'ri (root emas, `frontend` bo'lishi kerak)
**Yechim**: Vercel Dashboard → Settings → Root Directory → `frontend` ni tanlang

### Issue 2: API calls ishlamayapti
**Sabab**: `NEXT_PUBLIC_API_URL` yo'q yoki noto'g'ri
**Yechim**: Environment Variables qo'shing va redeploy qiling

### Issue 3: Supabase warning
**Sabab**: `NEXT_PUBLIC_SUPABASE_URL` yo'q
**Yechim**: Bu warning, error emas. Agar Global Catalog kerak bo'lsa, qo'shing
