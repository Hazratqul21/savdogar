# 🚨 VERCEL MANUAL DEPLOY GUIDE

## ❗ Muammo: Vercel GitHub push'larni sezmayapti

## ✅ Yechim: Manual Deploy

### Usul 1: Vercel Dashboard (Tavsiya etiladi)

#### Backend Project (savdogar-backend):
1. **https://vercel.com** ga kiring
2. **savdogar-backend** project'ni toping
3. **Deployments** tab'ga o'ting
4. **"..."** menu → **"Redeploy"** ni bosing
5. **"Use existing Build Cache"** ni **O'CHIRING** (uncheck)
6. **"Redeploy"** tugmasini bosing
7. **2-3 daqiqa kuting**

#### Frontend Project (savdogar):
1. **https://vercel.com** ga kiring
2. **savdogar** (frontend) project'ni toping
3. **Deployments** tab'ga o'ting
4. **"..."** menu → **"Redeploy"** ni bosing
5. **"Use existing Build Cache"** ni **O'CHIRING**
6. **"Redeploy"** tugmasini bosing
7. **2-3 daqiqa kuting**

### Usul 2: Vercel CLI (Agar o'rnatilgan bo'lsa)

```bash
# Backend deploy
cd /home/ali/dokon/savdogar_project_ready/backend
vercel --prod --force

# Frontend deploy
cd /home/ali/dokon/savdogar_project_ready/frontend
vercel --prod --force
```

### Usul 3: GitHub Actions (Agar sozlangan bo'lsa)

GitHub Actions workflow yaratish:
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [master]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 🔧 Vercel Webhook'ni Qayta Ulash

Agar Vercel GitHub push'larni sezmayapti:

1. **Vercel Dashboard** → **Settings** → **Git**
2. **"Disconnect"** tugmasini bosing
3. **"Connect Git Repository"** tugmasini bosing
4. **GitHub** ni tanlang
5. **savdogar** repository'ni tanlang
6. **Root Directory:**
   - Backend uchun: `backend`
   - Frontend uchun: `frontend`
7. **"Deploy"** tugmasini bosing

## 📋 Tekshirish

Deploy tugagandan keyin:

```bash
# Backend test
curl https://savdogar-backend.vercel.app/health

# Frontend test
curl -I https://savdogar.vercel.app
```

## ⚠️ Muhim Eslatmalar

1. **Backend va Frontend alohida project'lar** bo'lishi mumkin
2. Har birining o'z **Root Directory** si bor:
   - Backend: `/backend`
   - Frontend: `/frontend`
3. **vercel.json** har bir project'ning root'ida bo'lishi kerak
4. **Environment Variables** har bir project'da alohida sozlash kerak

## 🎯 Quick Fix (Hozir)

1. **Vercel Dashboard** ga kiring
2. **savdogar-backend** → **Deployments** → **Redeploy** (cache o'chirib)
3. **savdogar** (frontend) → **Deployments** → **Redeploy** (cache o'chirib)
4. **3-4 daqiqa kuting**
5. **Test qiling!**

---

**Last Updated:** 2026-01-12 02:10 UTC
