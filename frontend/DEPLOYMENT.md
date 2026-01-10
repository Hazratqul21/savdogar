# Frontend Deployment Guide - Vercel

Frontend (Next.js) ni Vercel'da deploy qilish uchun quyidagi qadamlarni bajaring.

## 🚀 Tez Boshlash

### 1. Vercel Dashboard'ga kiring
- https://vercel.com/dashboard ga kiring
- "Add New" → "Project" ni bosing

### 2. GitHub Repository'ni ulang
- Repository'ni tanlang
- Framework Preset: **"Next.js"** tanlang (avtomatik detect qiladi)

### 3. ⚠️ MUHIM: Root Directory
```
frontend
```
**CRITICAL**: Root directory `frontend` bo'lishi KERAK!

### 4. Environment Variables
Vercel Dashboard → Settings → Environment Variables:

```env
# Backend API URL (REQUIRED)
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app

# Supabase (Optional - for client-side storage)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**⚠️ MUHIM**: `NEXT_PUBLIC_API_URL` backend deploy URL'ini ko'rsatishi kerak!

### 5. Deploy
"Deploy" tugmasini bosing!

## 📁 File Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   ├── lib/              # API, utils
│   ├── providers/        # Context providers
│   └── stores/           # Zustand stores
├── public/               # Static files
├── package.json          # 📦 Dependencies
├── next.config.ts        # Next.js config
├── vercel.json           # ⚙️ Vercel config
└── .vercelignore         # 🚫 Ignored files
```

## ✅ Verification

Deploy'dan keyin:

1. **Landing page** ochilishi kerak:
   ```
   https://your-frontend.vercel.app/
   ```

2. **Login page**:
   ```
   https://your-frontend.vercel.app/login
   ```

3. **Signup page**:
   ```
   https://your-frontend.vercel.app/signup
   ```

## ❌ Troubleshooting

### "404 Not Found" xatosi
1. Root directory `frontend` ekanligini tekshiring
2. `frontend/package.json` mavjudligini tekshiring

### API ulanmayapti
1. `NEXT_PUBLIC_API_URL` to'g'ri sozlanganini tekshiring
2. Backend deploy qilingan va ishlayotganini tekshiring
3. CORS xatosini browser console'da tekshiring

### Build xatosi
1. `npm run build` local'da ishlayotganini tekshiring
2. Dependencies to'liq install qilinganini tekshiring
3. TypeScript xatolarini tekshiring

## 📋 Checklist

- [ ] Root directory: `frontend`
- [ ] `frontend/package.json` mavjud
- [ ] `NEXT_PUBLIC_API_URL` sozlangan (backend URL)
- [ ] Backend avval deploy qilingan
- [ ] Backend health check ishlayapti
- [ ] Landing page ochiladi
- [ ] Login/Signup sahifalari ishlayapti
