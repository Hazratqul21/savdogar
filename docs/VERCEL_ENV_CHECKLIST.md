# Vercel Environment Variables Checklist

## ✅ MAJBURIY (REQUIRED) Environment Variables

Quyidagi variable'lar **majburiy** va **barchasi** bo'lishi kerak:

### 1. ENVIRONMENT ⚠️
```
ENVIRONMENT=production
```
**Eslatma:** Agar bu yo'q bo'lsa, development mode ishlaydi va SECRET_KEY validation o'tmaydi.

### 2. DATABASE_URL ✅ (Sizda bor)
```
DATABASE_URL=postgresql://postgres:Xazrat_ali571@db.twzxefwfjbupealjasum.supabase.co:5432/postgres?sslmode=require
```

**MUHIM:** `?sslmode=require` qo'shish kerak! Sizning URL'ingizda bu yo'q.

**To'g'ri format:**
```
postgresql://postgres:Xazrat_ali571@db.twzxefwfjbupealjasum.supabase.co:5432/postgres?sslmode=require
```

### 3. SECRET_KEY ⚠️ (Kritik!)
```
SECRET_KEY=your-very-long-secret-key-minimum-32-characters-long
```
**Eslatma:** 
- Kamida 32 belgi bo'lishi kerak
- Production'da majburiy
- Agar yo'q bo'lsa, login/signup ishlamaydi

### 4. OPENAI_API_KEY ✅ (Sizda bor)
```
OPENAI_API_KEY=sk-proj-...
```

### 5. FRONTEND_URL ⚠️ (CORS uchun)
```
FRONTEND_URL=https://your-app.vercel.app
```
**Yoki:**
```
CORS_ORIGINS=https://your-app.vercel.app
```

## 🔧 Tuzatish Qadamlari

### Qadam 1: DATABASE_URL ni yangilang

Hozirgi:
```
postgresql://postgres:Xazrat_ali571@db.twzxefwfjbupealjasum.supabase.co:5432/postgres
```

To'g'ri (sslmode=require qo'shing):
```
postgresql://postgres:Xazrat_ali571@db.twzxefwfjbupealjasum.supabase.co:5432/postgres?sslmode=require
```

### Qadam 2: ENVIRONMENT qo'shing

Vercel'da yangi variable qo'shing:
- **Name:** `ENVIRONMENT`
- **Value:** `production`
- **Environments:** All Environments

### Qadam 3: SECRET_KEY yarating va qo'shing

Terminal'da quyidagi buyruqni bajaring:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Yoki online generator ishlating: https://generate-secret.vercel.app/32

Keyin Vercel'da qo'shing:
- **Name:** `SECRET_KEY`
- **Value:** (generated key - min 32 belgi)
- **Environments:** All Environments

### Qadam 4: FRONTEND_URL qo'shing

Vercel'da:
- **Name:** `FRONTEND_URL`
- **Value:** `https://your-app.vercel.app` (o'z domain'ingizni yozing)
- **Environments:** All Environments

## 📋 To'liq Ro'yxat (Copy-Paste uchun)

Vercel Dashboard → Settings → Environment Variables'da quyidagilarni qo'shing:

1. ✅ `DATABASE_URL` = `postgresql://postgres:Xazrat_ali571@db.twzxefwfjbupealjasum.supabase.co:5432/postgres?sslmode=require`
2. ⚠️ `ENVIRONMENT` = `production`
3. ⚠️ `SECRET_KEY` = `your-generated-32-char-min-secret-key`
4. ✅ `OPENAI_API_KEY` = `sk-proj-...` (sizda bor)
5. ⚠️ `FRONTEND_URL` = `https://your-app.vercel.app`

## ✅ Tekshirish

O'zgarishlardan keyin:

1. **Redeploy qiling:**
   - Vercel Dashboard → Deployments
   - Eng so'nggi deployment'ni "Redeploy" qiling
   - Yoki yangi commit push qiling

2. **Logs'ni tekshiring:**
   - Vercel Dashboard → Deployments → [Latest] → Logs
   - Database connection xatolarini qidiring

3. **Health check:**
   - `https://your-app.vercel.app/health` oching
   - Database status'ni tekshiring

4. **Test qiling:**
   - Registration form'ni oching
   - Yangi foydalanuvchi yarating
   - Xatolik bo'lsa, logs'da ko'ring

## 🐛 Muammo bo'lsa

Agar hali ham xatolik bo'lsa:

1. Vercel Logs'da aniq xatolikni ko'ring
2. `/health` endpoint'ida database status'ni tekshiring
3. Supabase Dashboard'da database'ingiz faol ekanligini tekshiring
4. Network restrictions bo'lmasligini tekshiring (Supabase Settings → Database)
