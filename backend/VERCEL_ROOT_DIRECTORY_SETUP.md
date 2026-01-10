# 🔴 CRITICAL: Vercel Root Directory Setup (MUHIM!)

## ⚠️ BU MUAMMONING ENG ASOSIY SABABI!

404 xatosining 90% sababi - **Root Directory o'rnatilmagan!**

## 📋 QADAM-BA-QADAM KO'RSATMA (O'zbek tilida):

### 1️⃣ Vercel Dashboard'ga kiring:
   - https://vercel.com/dashboard ga kiring
   - Email va password bilan login qiling

### 2️⃣ Projectingizni toping:
   - Dashboard'da backend projectingizni toping
   - Agar yo'q bo'lsa, yangi project yarating

### 3️⃣ Settings'ga kiring:
   - Project nomiga bosing
   - Yuqoridagi menuda **"Settings"** ni bosing

### 4️⃣ General tab'ni oching:
   - Settings sahifasida **"General"** tab'ni tanlang
   - Pastga scroll qiling

### 5️⃣ Root Directory ni o'rnating:
   - **"Root Directory"** maydonini toping
   - Hozir u bo'sh yoki `.` (dot) bo'lishi mumkin
   - Uni **`backend`** ga o'zgartiring (trailing slash siz!)
   
   ```
   ❌ Bo'sh yoki . yoki ./
   ✅ backend
   ```

### 6️⃣ Save qiling:
   - **"Save"** yoki **"Update"** tugmasini bosing
   - Vercel avtomatik ravishda redeploy boshlaydi

### 7️⃣ Redeploy qiling (agar kerak bo'lsa):
   - Agar avtomatik redeploy bo'lmagan bo'lsa:
   - **"Deployments"** tab'iga kiring
   - Eng so'nggi deployment'ning `...` (three dots) ni bosing
   - **"Redeploy"** ni tanlang

## ✅ Tekshirish:

Deploy tugagandan keyin:

```bash
curl https://your-backend-url.vercel.app/health
```

Agar javob kelsa, muammo hal qilindi! ✅

Agar hali ham 404 bo'lsa, quyidagilarni tekshiring:
1. Root Directory `backend` ga o'rnatilganligi
2. Build log'larda xatoliklar yo'qligi
3. Function log'larda handler topilganligi

## 🎯 Skrin shot'lar uchun qidiruv:

Vercel Dashboard'da qidiring:
- "Root Directory" yoki "Project Root"
- "General Settings"
- "Project Configuration"

## 📞 Qo'shimcha yordam:

Agar Root Directory maydonini topa olmasangiz:
1. Vercel Dashboard → Project → Settings → General
2. Yoki Vercel CLI orqali: `vercel link` va `vercel env pull`
3. Yoki Vercel Support'ga yozing

---

**MUHIM:** Bu qadanni o'tkazmasdan, hech qanday kod o'zgarishi yordam bermaydi!
