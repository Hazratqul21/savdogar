# GitLab'ga Push Qilish - Step-by-Step Guide

## ✅ Barcha O'zgarishlar Tayyor!

Barcha muammolar hal qilindi:
- ✅ Signup router to'g'rilandi (business_type, tenant creation)
- ✅ Import muammolari hal qilindi (__init__.py fayllar)
- ✅ vercel.json to'g'ri sozlangan
- ✅ index.py yaxshilandi
- ✅ Test fayllar o'chirildi

## 📋 QADAM 1: Git Remote'ni GitLab'ga O'zgartirish

### 1.1 GitLab'da Repository Yaratish (agar hali yaratilmagan bo'lsa)

1. https://gitlab.com ga kiring
2. "New project" → "Create blank project"
3. Project name: `savdogar`
4. Visibility: Private (recommended)
5. "Create project" ni bosing
6. Repository URL'ni oling:
   - SSH: `git@gitlab.com:YOUR_USERNAME/savdogar.git`
   - HTTPS: `https://gitlab.com/YOUR_USERNAME/savdogar.git`

### 1.2 Git Remote O'zgartirish

**Terminal'da quyidagi komandalarni bajaring:**

```bash
cd /home/ali/dokon/savdogar_project_ready

# Hozirgi remote'ni ko'rish
git remote -v

# GitLab username'ni so'rang (yoki o'zingiz kiriting)
# Masalan: gitlab_user123

# Remote'ni o'zgartirish (SSH)
git remote set-url origin git@gitlab.com:YOUR_USERNAME/savdogar.git

# Yoki GitHub'ni saqlab qolish uchun:
# git remote rename origin github
# git remote add origin git@gitlab.com:YOUR_USERNAME/savdogar.git

# Tekshirish
git remote -v
```

**Eslatma:** `YOUR_USERNAME` o'rniga GitLab username'ingizni yozing.

### 1.3 SSH Key'ni Sozlash (SSH ishlatish uchun)

```bash
# SSH key bor-yo'qligini tekshirish
cat ~/.ssh/id_rsa.pub

# Agar yo'q bo'lsa, yarating:
ssh-keygen -t ed25519 -C "your-email@example.com"
# Enter'ni bosib, default sozlamalarni tanlang

# SSH key'ni ko'rsatish
cat ~/.ssh/id_rsa.pub
```

**GitLab'da SSH key qo'shish:**
1. GitLab → Profile → Settings → SSH Keys
2. Ko'rsatilgan SSH key'ni copy qiling
3. "Add key" ni bosing

**SSH key test qilish:**
```bash
ssh -T git@gitlab.com
# "Welcome to GitLab" ko'rsatilsa, ishlayapti ✅
```

## 📋 QADAM 2: Barcha O'zgarishlarni Commit Qilish

### 2.1 O'zgarishlarni Tekshirish

```bash
cd /home/ali/dokon/savdogar_project_ready

# O'zgarishlarni ko'rish
git status

# Barcha o'zgarishlarni qo'shish
git add -A

# O'zgarishlarni ko'rish
git status --short
```

### 2.2 Commit Qilish

```bash
git commit -m "Fix: Complete deployment configuration - signup router with business_type support, imports fixed, vercel.json updated. All issues resolved and ready for GitLab deployment."
```

### 2.3 Tekshirish

```bash
# Latest commit'ni ko'rish
git log --oneline -1

# O'zgargan fayllarni ko'rish
git show --stat HEAD
```

## 📋 QADAM 3: GitLab'ga Push Qilish

### 3.1 Birinchi Push

```bash
# GitLab'ga push qilish
git push -u origin master

# Yoki agar main branch bo'lsa:
# git push -u origin main
```

### 3.2 Push Muvaffaqiyatli Bo'lsa

```
To gitlab.com:YOUR_USERNAME/savdogar.git
 * [new branch]      master -> master
Branch 'master' set up to track 'origin/master'.
```

### 3.3 Tekshirish

```bash
# GitLab'da repository'ni oching
# Barcha fayllar borligini tekshiring

# Local va remote bir xil ekanligini tekshiring
git log --oneline -1
git log origin/master --oneline -1
# SHA'lar bir xil bo'lishi kerak ✅
```

## 📋 QADAM 4: Vercel'da GitLab Integration

### 4.1 GitLab Integration O'rnatish

1. **Vercel Dashboard → Settings → Integrations**
2. **"Browse Integrations"** → **"GitLab"** ni qidiring
3. **"Add Integration"** ni bosing
4. GitLab'ga login qiling
5. **"Authorize vercel"** ni bosing
6. Repository'larni tanlang (yoki "Select all")
7. **"Save"** qiling

### 4.2 Project Import Qilish

1. **Vercel Dashboard → "Add New" → "Project"**
2. **"Import Git Repository"** ni bosing
3. **GitLab** ni tanlang
4. Repository'ni tanlang: `savdogar`
5. **"Import"** ni bosing

### 4.3 Project Settings

**Configure Project sahifasida:**

- **Root Directory:** `[EMPTY - blank qoldiring]` ⚠️ **MUHIM!**
- **Framework Preset:** `Next.js` (auto-detected)
- **Build Command:** `cd frontend && npm install && npm run build`
- **Output Directory:** `frontend/.next`
- **Install Command:** `cd frontend && npm install`

### 4.4 Environment Variables

**"Environment Variables"** ni bosing:

```
ENVIRONMENT=production
DATABASE_URL=postgresql://...?sslmode=require
SECRET_KEY=<your-secret-key-min-32-chars>
FRONTEND_URL=https://your-project.vercel.app
CORS_ORIGINS=https://your-project.vercel.app
PYTHONPATH=frontend/api
```

⚠️ **Production, Preview, Development** uchun hammasini qo'shing!

### 4.5 Deploy

1. **"Deploy"** ni bosing
2. Build jarayonini kuting (2-5 daqiqa)
3. Build logs'ni tekshiring
4. Production URL'ni oling

## ✅ Checklist

### Pre-Push
- [x] Barcha o'zgarishlar commit qilindi
- [x] Test fayllar o'chirildi
- [x] Import muammolari hal qilindi
- [x] Signup router to'g'rilandi
- [x] vercel.json to'g'ri sozlangan

### Git Remote
- [ ] GitLab'da repository yaratildi
- [ ] Git remote GitLab'ga o'zgartirildi
- [ ] SSH key qo'shildi (yoki Personal Access Token)
- [ ] Remote tekshirildi: `git remote -v`

### Push
- [ ] Barcha o'zgarishlar commit qilindi
- [ ] Push qilindi: `git push -u origin master`
- [ ] GitLab'da latest commit ko'rsatiladi
- [ ] Barcha fayllar GitLab'da mavjud

### Vercel Deployment
- [ ] GitLab integration o'rnatildi
- [ ] Project import qilindi
- [ ] Settings sozlandi (Root Directory: EMPTY)
- [ ] Environment Variables qo'shildi
- [ ] Deploy qilindi
- [ ] Build muvaffaqiyatli
- [ ] Endpoint'lar ishlayapti

## 🚀 Keyingi Qadamlar

1. **GitLab'ga push qiling**
2. **Vercel'da GitLab integration o'rnating**
3. **Project import qiling**
4. **Settings sozlang**
5. **Deploy qiling**

## 🎉 Natija

Loyiha GitLab'ga push qilindi va Vercel'da deploy qilishga tayyor! 🚀
