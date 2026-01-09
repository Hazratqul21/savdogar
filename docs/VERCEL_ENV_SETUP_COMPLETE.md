# Vercel Environment Variables - To'liq Qo'llanma

Bu qo'llanmada Vercel'da environment variable'larni qanday sozlashni **qadam-baqadam** ko'rsatilgan.

## 📋 Kerakli Environment Variable'lar Ro'yxati

Quyidagi variable'lar **majburiy** va **barchasi** bo'lishi kerak:

1. ✅ `ENVIRONMENT` = `production`
2. ✅ `DATABASE_URL` = `postgresql://...?sslmode=require`
3. ✅ `SECRET_KEY` = `min-32-characters-long-key`
4. ✅ `OPENAI_API_KEY` = `sk-proj-...`
5. ✅ `FRONTEND_URL` = `https://your-domain.com`

---

## 🚀 Qadam-baqadam Sozlash

### QADAM 1: Vercel Dashboard'ga kiring

1. [vercel.com](https://vercel.com) ga kiring
2. Login qiling
3. Project'ingizni tanlang

### QADAM 2: Settings'ga kiring

1. Project'ingiz ochilganda, yuqorida **"Settings"** tab'ini bosing
2. Chap menudan **"Environment Variables"** ni tanlang

### QADAM 3: ENVIRONMENT qo'shing

1. **"Add New"** tugmasini bosing
2. Quyidagilarni kiriting:
   - **Name:** `ENVIRONMENT`
   - **Value:** `production`
   - **Environments:** "All Environments" ni tanlang
3. **"Save"** tugmasini bosing

### QADAM 4: DATABASE_URL ni yangilang

1. Mavjud `DATABASE_URL` ni toping va **oching** (yoki yangi qo'shing)
2. **Value** maydonida URL'ni ko'rasiz:
   ```
   postgresql://postgres:Xazrat_ali571@db.twzxefwfjbupealjasum.supabase.co:5432/postgres
   ```
3. **Oxiriga `?sslmode=require` qo'shing:**
   ```
   postgresql://postgres:Xazrat_ali571@db.twzxefwfjbupealjasum.supabase.co:5432/postgres?sslmode=require
   ```
4. **"Save"** tugmasini bosing

**⚠️ MUHIM:** Agar Supabase'dan boshqa database ishlatayotgan bo'lsangiz, o'z URL'ingizni qo'ying.

### QADAM 5: SECRET_KEY yarating va qo'shing

#### Variant A: Terminal orqali (Tavsiya etiladi)

Terminal'da quyidagi buyruqni bajaring:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Yoki:

```bash
openssl rand -base64 32
```

Natijada uzun random string chiqadi, uni copy qiling.

#### Variant B: Online generator

1. [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) ga kiring
2. "Generate" tugmasini bosing
3. Chiqqan key'ni copy qiling

#### Keyin Vercel'da qo'shing:

1. **"Add New"** tugmasini bosing
2. Quyidagilarni kiriting:
   - **Name:** `SECRET_KEY`
   - **Value:** (yaratilgan key'ni paste qiling - kamida 32 belgi)
   - **Environments:** "All Environments" ni tanlang
3. **"Save"** tugmasini bosing

**⚠️ MUHIM:** Key'ni hech kimga ko'rsatmang va saqlang!

### QADAM 6: OPENAI_API_KEY ni tekshiring

1. Mavjud `OPENAI_API_KEY` ni toping
2. Agar yo'q bo'lsa, **"Add New"** tugmasini bosing
3. Quyidagilarni kiriting:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** `sk-proj-...` (o'z OpenAI key'ingiz)
   - **Environments:** "All Environments" ni tanlang
4. **"Save"** tugmasini bosing

### QADAM 7: FRONTEND_URL ni qo'shing

#### Avval domain'ingizni toping:

1. Vercel Dashboard → **Settings** → **Domains**
2. U yerda ko'rasiz:
   - Vercel domain: `your-project.vercel.app`
   - Yoki custom domain: `your-custom-domain.com`

#### Keyin qo'shing:

1. **"Add New"** tugmasini bosing
2. Quyidagilarni kiriting:
   - **Name:** `FRONTEND_URL`
   - **Value:** 
     - Agar Vercel domain: `https://your-project.vercel.app`
     - Agar custom domain: `https://your-custom-domain.com`
   - **Environments:** "All Environments" ni tanlang
3. **"Save"** tugmasini bosing

**⚠️ MUHIM:** 
- `https://` bilan boshlanishi kerak
- Oxirida `/` bo'lmasligi kerak
- Masalan: `https://savdogar.uz` ✅, `https://savdogar.uz/` ❌

---

## ✅ Tekshirish

### 1. Barcha variable'lar mavjudligini tekshiring

Vercel → Settings → Environment Variables'da quyidagilar bo'lishi kerak:

- ✅ `ENVIRONMENT` = `production`
- ✅ `DATABASE_URL` = `postgresql://...?sslmode=require`
- ✅ `SECRET_KEY` = `...` (uzun random string)
- ✅ `OPENAI_API_KEY` = `sk-proj-...`
- ✅ `FRONTEND_URL` = `https://...`

### 2. Redeploy qiling

1. Vercel Dashboard → **Deployments**
2. Eng so'nggi deployment'ni toping
3. **"..."** (uch nuqta) tugmasini bosing
4. **"Redeploy"** ni tanlang
5. **"Redeploy"** tugmasini bosing

Yoki yangi commit push qiling (avtomatik redeploy bo'ladi).

### 3. Test qiling

1. Saytingizni oching
2. Registration form'ni oching
3. Yangi foydalanuvchi yaratishga harakat qiling
4. Agar xatolik bo'lsa, browser Console'ni oching (F12) va xatolarni ko'ring

---

## 🐛 Muammo bo'lsa

### Xatolik: "Database serverga ulanib bo'lmadi"

**Yechim:**
1. `DATABASE_URL` da `?sslmode=require` borligini tekshiring
2. Supabase Dashboard'da database'ingiz faol ekanligini tekshiring
3. Password to'g'ri ekanligini tekshiring

### Xatolik: "SECRET_KEY must be set"

**Yechim:**
1. `SECRET_KEY` qo'shilganligini tekshiring
2. Kamida 32 belgi ekanligini tekshiring
3. Redeploy qiling

### Xatolik: 405 Method Not Allowed

**Yechim:**
1. `ENVIRONMENT=production` qo'shilganligini tekshiring
2. `FRONTEND_URL` qo'shilganligini tekshiring
3. Redeploy qiling

### Xatolik: CORS error

**Yechim:**
1. `FRONTEND_URL` to'g'ri domain'ni ko'rsatayotganligini tekshiring
2. `https://` bilan boshlanishini tekshiring
3. Redeploy qiling

---

## 📸 Screenshot'lar (Vercel Interface)

### Environment Variables sahifasi

```
Vercel Dashboard
├── Project Name
├── Settings (tab)
│   ├── General
│   ├── Environment Variables ← BURGA KIRING
│   ├── Domains
│   └── ...
```

### Variable qo'shish

```
┌─────────────────────────────────────┐
│ Add New Environment Variable       │
├─────────────────────────────────────┤
│ Name:  [ENVIRONMENT          ]     │
│ Value: [production           ]     │
│ Environments: [All Environments ▼]│
│                                     │
│ [Cancel]  [Save]                    │
└─────────────────────────────────────┘
```

---

## 💡 Maslahatlar

1. ✅ **Barcha variable'larni bir vaqtning o'zida qo'shing** - keyin bir marta redeploy qiling
2. ✅ **"All Environments" ni tanlang** - production, preview, va development uchun ishlaydi
3. ✅ **Value'larni to'g'ri kiriting** - katta/kichik harflarga e'tibor bering
4. ✅ **Redeploy qiling** - o'zgarishlar avtomatik ishlamaydi
5. ✅ **Logs'ni tekshiring** - Vercel → Deployments → [Latest] → Logs

---

## 📞 Yordam

Agar hali ham muammo bo'lsa:

1. Vercel Logs'ni tekshiring: Deployments → [Latest] → Logs
2. Browser Console'ni tekshiring: F12 → Console
3. `/health` endpoint'ini tekshiring: `https://your-app.vercel.app/health`

---

## ✅ Yakuniy Checklist

Quyidagilarni tekshiring:

- [ ] `ENVIRONMENT=production` qo'shildi
- [ ] `DATABASE_URL` da `?sslmode=require` bor
- [ ] `SECRET_KEY` qo'shildi (min 32 belgi)
- [ ] `OPENAI_API_KEY` qo'shildi
- [ ] `FRONTEND_URL` qo'shildi (to'g'ri domain)
- [ ] Redeploy qilindi
- [ ] Test qilindi va ishlayapti

**Barcha checkbox'lar ✅ bo'lsa, tayyor! 🎉**
