# 🚨 Vercel Manual Deploy Guide - Backend O'zgarishlarini Sezmayapti

## ⚠️ MUAMMO: Vercel Backend'da O'zgarishlarni Sezmayapti

Agar Vercel GitHub'dan avtomatik deploy qilmayotgan bo'lsa, quyidagi qadamlarni bajaring:

## ✅ YECHIM 1: Vercel Dashboard'da Manual Redeploy

### Qadam-ba-qadam:

1. **Vercel Dashboard'ga kiring:**
   ```
   https://vercel.com/dashboard
   ```

2. **Backend project'ingizni tanlang:**
   - Dashboard'dan backend project'ingizni toping va bosing

3. **Deployments tab'iga kiring:**
   - Project sahifasida "Deployments" tab'ini bosing

4. **Eng so'nggi deployment'ni toping:**
   - Eng so'nggi deployment'ni ko'ring
   - Commit hash: `3b93c9a` ko'rinishi kerak
   - Agar ko'rinmasa, yana pastga scroll qiling

5. **Manual Redeploy qiling:**
   - Deployment'ning o'ng tarafidagi `...` (three dots) ni bosing
   - "Redeploy" ni tanlang
   - Yoki "Deploy" tugmasini bosing

6. **Yangi deployment yarating:**
   - Deployments → "Deploy" tugmasini bosing
   - "Deploy from GitHub" ni tanlang
   - Branch: `master` ni tanlang
   - "Deploy" ni bosing

## ✅ YECHIM 2: Vercel Settings'da Branch Tekshirish

1. **Vercel Dashboard → Project → Settings → Git:**
   - "Production Branch" `master` ga o'rnatilganligini tekshiring
   - Agar `main` bo'lsa, `master` ga o'zgartiring

2. **Automatic Deployments:**
   - "Automatic Deployments" yoqilganligini tekshiring
   - Agar o'chirilgan bo'lsa, yoqing

3. **Webhook tekshirish:**
   - GitHub repository → Settings → Webhooks
   - Vercel webhook'ining ishlayotganligini tekshiring

## ✅ YECHIM 3: GitHub Webhook Tekshirish

1. **GitHub Repository'ga kiring:**
   ```
   https://github.com/Hazratqul21/savdogar
   ```

2. **Settings → Webhooks ga kiring:**
   - Vercel webhook'ining mavjudligini tekshiring
   - Agar yo'q bo'lsa, Vercel Dashboard → Project → Settings → Git → "Connect Git Repository" qiling

3. **Webhook'ni test qiling:**
   - "Recent Deliveries" ni tekshiring
   - Oxirgi push event'ni ko'ring
   - Agar xatolik bo'lsa, webhook'ni qayta yarating

## ✅ YECHIM 4: Vercel CLI orqali Manual Deploy

Agar Vercel CLI o'rnatilgan bo'lsa:

```bash
# Vercel CLI o'rnatish (bir marta)
npm i -g vercel

# Project'ni link qilish (bir marta)
cd /home/ali/dokon/savdogar_project_ready
vercel link

# Production'ga deploy qilish
vercel --prod

# Yoki root directory bo'sh uchun:
cd /home/ali/dokon/savdogar_project_ready
vercel --prod --cwd .

# Yoki backend directory uchun:
cd /home/ali/dokon/savdogar_project_ready/backend
vercel --prod
```

## ✅ YECHIM 5: Empty Commit yaratish (Emergency)

Agar hech narsa ishlamasa:

```bash
cd /home/ali/dokon/savdogar_project_ready
git commit --allow-empty -m "trigger: force Vercel deployment - backend changes not detected"
git push origin master
```

Bu bo'sh commit Vercel'ga yangi deployment trigger yaratadi.

## 🔍 TEKSHIRISH:

Deploy tugagandan keyin:

1. **Build log'ni tekshiring:**
   - Deployments → [Latest] → Logs
   - "Building functions" ko'rinishi kerak
   - "backend/api/index.py detected" ko'rinishi kerak

2. **Function log'ni tekshiring:**
   - Deployments → Functions → Logs
   - "Mangum handler initialized" ko'rinishi kerak

3. **Test qiling:**
   ```bash
   curl https://YOUR-URL.vercel.app/health
   ```

## 🎯 TAVSIYA:

Eng tez yechim: **YECHIM 1** - Vercel Dashboard'da manual redeploy qiling.

Agar hali ham muammo bo'lsa, **YECHIM 4** - Vercel CLI orqali manual deploy qiling.
