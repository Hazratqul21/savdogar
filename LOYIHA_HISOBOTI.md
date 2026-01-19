# 📊 SAVDOGAR - TO'LIQ LOYIHA HISOBOTI

## 🎯 LOYIHA HAQIDA UMUMIY MA'LUMOT

**Savdogar** - Bu do'kon va bizneslarni boshqarish uchun mo'ljallangan zamonaviy dastur. U telefon, planshet yoki kompyuterdan ishlatish mumkin. Barcha ma'lumotlar bulutda saqlanadi, shuning uchun istalgan joydan kirish mumkin.

---

## ✨ LOYIHA NIMALAR QILA OLADI?

### 🏪 1. POS TERMINALI (KASSA SISTEMASI)
- **Sotuv qilish**: Har qanday mahsulotni tezda topib, sotish mumkin
- **Barcode skanerlash**: Mahsulotlarni kameradan skanerlash orqali tez qo'shish
- **Kassa cheki chop etish**: Har bir sotuv uchun avtomatik chek
- **To'lov usullari**: Naqd pul, karta, Payme, Click, qarz bilan to'lash
- **Chegirma berish**: Mahsulotga chegirma qo'shish mumkin
- **Mijozlar bazasi**: Mijozlarni saqlash va ularga maxsus narx berish

### 📦 2. MAHSULOTLAR BOSHQARUVI
- **Mahsulot qo'shish**: Rasmlar, narxlar, kategoriyalar bilan
- **Variantlar**: Bir mahsulotning turli o'lchamlari (masalan: katta, o'rta, kichik)
- **Ombor kuzatuvi**: Qancha mahsulot qolganini ko'rish
- **Kam qolgan xabarlar**: Mahsulot kam qolsa, avtomatik xabar
- **Yaroqlilik muddati**: Oziq-ovqat mahsulotlari uchun muddat kuzatuvi

### 👥 3. MIJOZLAR BOSHQARUVI
- **Mijozlar ro'yxati**: Barcha mijozlarni saqlash
- **Qarz yozish**: Mijozlarga qarz berish va kuzatish
- **Maxsus narxlar**: Mijozlarga alohida narxlar (VIP mijozlar uchun)
- **Buyurtmalar tarixi**: Mijoz nima sotib olganini ko'rish

### 📈 4. HISOBOTLAR VA STATISTIKA
- **Kunlik savdo**: Har kuni qancha pul kirgani
- **Oylik daromad**: Oy davomidagi umumiy daromad
- **Eng ko'p sotilganlar**: Qaysi mahsulotlar eng ko'p sotilayapti
- **Foyda/kasof**: Qancha foyda yoki zarar bo'layapti
- **Kam qolganlar**: Qaysi mahsulotlar tugab qolayapti

### 🔐 5. XODIMLAR BOSHQARUVI
- **Rollar**: Xodimlarga turli rollar berish
  - **Sotuvchi (Cashier)**: Faqat sotuv qilish
  - **Menejer**: Mahsulotlar, ombor, hisobotlarni ko'rish
  - **Proprietor (Owner)**: Barcha imkoniyatlar
- **Smena**: Har bir xodimning ish vaqtini kuzatish
- **Z-Report**: Smena oxirida daromad hisoboti

### 🤖 6. SUN'IY INTELLEKT (AI) FUNKSIYALARI
- **Faktura skanerlash**: Telefon kamerasidan faktura rasmini tahlil qilib, mahsulotlarni avtomatik qo'shish
- **Chek skanerlash**: Mijoz chekini skanerlab, mahsulotlarni qo'shish
- **AI Yordamchi**: Savollarga javob beradi (masalan: "Bugun qancha daromad?")
- **Avtomatik tahlil**: Biznes holati haqida tavsiyalar

### 🏬 7. TURLI BIZNES TURLARI UCHUN SOZLAMALAR
Loyiha quyidagi biznes turlarini qo'llab-quvvatlaydi:

1. **Oziq-ovqat do'koni** - Supermarket, minimarket
2. **Kiyim-kechak** - Kiyim do'koni, boutique
3. **Kafe/Restoran** - Oshxona, qahvaxona
4. **Optom savdo** - Katta partiyada sotish
5. **Bijuteriya** - Aksessuarlar, taqinchoqlar
6. **Santexnika** - Sanitariya, konditsioner, quvurlar
7. **Tamaki do'koni** - Litsenziyali tamaki va alkogol

Har bir biznes turi uchun maxsus sozlamalar va funksiyalar mavjud.

---

## 💰 XARAJATLAR VA OYLIK TO'LOVLAR

### 📊 SERVISLAR XARAJATLARI (OYLIK)

#### 1. **Database (Ma'lumotlar bazasi)**
- **Provider**: Supabase (PostgreSQL)
- **Xarajat**: 
  - **Free tier**: $0/oy (500MB storage, 2GB bandwidth)
  - **Pro tier**: $25/oy (8GB storage, 50GB bandwidth) - **TAVSIYA ETILADI**
  - **Team tier**: $599/oy (100GB storage, 500GB bandwidth) - katta loyihalar uchun
- **Tavsiya**: Boshlash uchun **Free tier**, keyin Pro ga o'tish

#### 2. **Hosting (Veb-sayt va API)**
- **Provider**: Vercel
- **Xarajat**:
  - **Free tier**: $0/oy (100GB bandwidth, unlimited requests)
  - **Pro tier**: $20/oy (1TB bandwidth, analytics, team collaboration)
- **Tavsiya**: Boshlash uchun **Free tier** yetarli, keyin Pro

#### 3. **AI Funksiyalar (OpenAI)**
- **Provider**: OpenAI (GPT-4o va GPT-4o-mini)
- **Xarajat**:
  - **gpt-4o-mini**: $0.150/1M tokens input, $0.600/1M tokens output
  - **gpt-4o**: $2.50/1M tokens input, $10.00/1M tokens output
- **Taxminiy oylik xarajat**:
  - **Kichik do'kon** (kuniga 10 ta faktura skanerlash): ~$5-10/oy
  - **O'rtacha do'kon** (kuniga 50 ta faktura): ~$20-40/oy
  - **Katta do'kon** (kuniga 200+ faktura): ~$80-150/oy
- **Optimizatsiya**: Fakturalarni mini model bilan skanerlaymiz (arzon), qo'lda yozilganlarini esa katta model bilan (qimmat)

#### 4. **Rasmlar va Fayllar Saqlash (Storage)**
- **Provider**: Supabase Storage (yoki Vercel Blob)
- **Xarajat**:
  - **Supabase**: Free tier da 1GB, Pro da 100GB
  - **Vercel Blob**: $0.15/GB storage, $0.40/GB bandwidth
- **Taxminiy xarajat**: ~$2-5/oy (rasmlar va fakturalar uchun)

#### 5. **SMS/Telegram Bildirishnomalar** (ixtiyoriy)
- **Provider**: Telegram Bot API (bepul) yoki Twilio
- **Xarajat**: $0-10/oy (agar SMS yuborish kerak bo'lsa)

---

## 📊 JAMI OYLIK XARAJAT

### Minimal Variant (Boshlash uchun):
```
Database (Supabase Free):        $0/oy
Hosting (Vercel Free):           $0/oy
AI (OpenAI - minimal):           $5-10/oy
Storage (Supabase Free):         $0/oy
────────────────────────────────────────
JAMI:                            $5-10/oy
```

### Tavsiya Etilgan Variant (Production uchun):
```
Database (Supabase Pro):         $25/oy
Hosting (Vercel Pro):            $20/oy
AI (OpenAI - o'rtacha):          $30-50/oy
Storage (Supabase/Blob):         $3-5/oy
────────────────────────────────────────
JAMI:                            $78-100/oy
```

### Katta Biznes uchun:
```
Database (Supabase Team):        $599/oy
Hosting (Vercel Pro):            $20/oy
AI (OpenAI - yuqori):            $100-200/oy
Storage:                         $10-20/oy
────────────────────────────────────────
JAMI:                            $729-839/oy
```

---

## 💵 FOYDALANUVCHILARDAN OLINADIGAN OYLIK TO'LOV

### Ta'riflar (Subscription Plans):

#### 1. **Trial (Sinov) - BEPUL**
- **Davomiyligi**: 1 oy
- **Foydalanuvchilar**: 5 kishigacha
- **Filiallar**: 1 ta
- **Narxi**: $0/oy
- **Nima kiradi**: Barcha asosiy funksiyalar

#### 2. **Standard (Standart) - Kichik Do'konlar**
- **Foydalanuvchilar**: 5 kishigacha
- **Filiallar**: 1 ta
- **Narxi**: **$29-39/oy** ($350,000-450,000 so'm/oy)
- **Nima kiradi**: 
  - POS Terminali
  - Mahsulotlar boshqaruvi
  - Ombor kuzatuvi
  - Hisobotlar
  - Mijozlar bazasi
  - AI faktura skanerlash (kuniga 20 ta)
  - Barcha asosiy funksiyalar

#### 3. **Pro (Professional) - Katta Bizneslar**
- **Foydalanuvchilar**: 25 kishigacha
- **Filiallar**: 5 tagacha
- **Narxi**: **$79-99/oy** ($900,000-1,100,000 so'm/oy)
- **Nima kiradi**:
  - Barcha Standard funksiyalar
  - Cheksiz AI faktura skanerlash
  - AI yordamchi
  - Avtomatik tahlil
  - Bir nechta filiallar
  - Katta jamoa uchun imkoniyatlar

---

## 💡 NARXLAR BO'YICHA TAVSIYALAR

### Minimal Narx (Eng Kam):
**Foydalanuvchilardan**: $29/oy ($350,000 so'm)
**Xarajatlar**: $5-10/oy
**Foyda**: $19-24/oy ($230,000-290,000 so'm)

### O'rtacha Narx (Tavsiya Etiladi):
**Foydalanuvchilardan**: $39/oy ($450,000 so'm)
**Xarajatlar**: $25-30/oy
**Foyda**: $9-14/oy ($110,000-170,000 so'm)

### Realistik Narx (O'zbekiston Bozori):
**Standard**: **350,000-450,000 so'm/oy** ($30-39/oy)
**Pro**: **900,000-1,200,000 so'm/oy** ($78-104/oy)

---

## 📈 FOYDA PROGNOZI

### Agar 10 ta foydalanuvchi bo'lsa (Standard plan):
- **Daromad**: 10 × $39 = **$390/oy**
- **Xarajatlar**: **$80-100/oy**
- **Foyda**: **$290-310/oy** (3,500,000-3,700,000 so'm)

### Agar 50 ta foydalanuvchi bo'lsa:
- **Daromad**: 40 × $39 + 10 × $99 = **$2,550/oy**
- **Xarajatlar**: **$150-200/oy**
- **Foyda**: **$2,350-2,400/oy** (28,000,000-29,000,000 so'm)

### Agar 100 ta foydalanuvchi bo'lsa:
- **Daromad**: 70 × $39 + 30 × $99 = **$5,520/oy**
- **Xarajatlar**: **$250-350/oy**
- **Foyda**: **$5,170-5,270/oy** (62,000,000-63,000,000 so'm)

---

## ✅ LOYIHANING AFZALLIKLARI

1. **Telefon/Planshet/Kompyuter**: Qayerdan bo'lishidan qat'iy nazar ishlatish mumkin
2. **Internet kerak**: Ma'lumotlar bulutda saqlanadi
3. **Tezkor**: Sotuvni bir necha soniyada amalga oshirish mumkin
4. **Xavfsiz**: Barcha ma'lumotlar shifrlangan
5. **O'zbek tilida**: Barcha interfeys o'zbek tilida
6. **AI yordam**: Avtomatik faktura skanerlash, yordamchi chatbot
7. **Har qanday biznes turi**: 8 xil biznes turi uchun maxsus sozlamalar

---

## 🎯 PRODUCTION GA TAYYORLASH UCHUN TEKSHIRUVLAR

### ✅ Hozirgi holatda tayyor bo'lganlar:
- [x] Ro'yxatdan o'tish va kirish
- [x] Mahsulot qo'shish (lekin ko'rinmayapti - tuzatish kerak)
- [x] POS Terminali
- [x] Ombor boshqaruvi
- [x] Hisobotlar
- [x] Mijozlar bazasi
- [x] Xodimlar boshqaruvi

### ⚠️ Tuzatish kerak bo'lgan muammolar:
1. **Mahsulotlar ko'rinmayapti** - GET endpoint 405 xatolik qaytaryapti
2. **Mahsulot qo'shishdan keyin ro'yxatda ko'rinmayapti** - backend'da tekshiruv kerak
3. **API routing muammosi** - Vercel deployment'da route'lar to'g'ri ishlamayapti

### 📋 Production uchun kerak bo'lgan qo'shimchalar:
1. [ ] Monitoring va error tracking (Sentry yoki boshqa)
2. [ ] Backup avtomatikasi (Supabase'da mavjud)
3. [ ] Email bildirishnomalar
4. [ ] To'lov integratsiyasi (Payme, Click uchun to'liq integratsiya)
5. [ ] Print service (chek chop etish uchun)
6. [ ] Mobile app (ixtiyoriy, lekin foydali)

---

## 💼 MINIMAL OYLIK TO'LOV - FOYDALANUVCHILAR UCHUN

### Eng Kam Narx Varianti:
**$29/oy** yoki **350,000 so'm/oy**

Bu narx quyidagilarni o'z ichiga oladi:
- ✅ POS Terminali
- ✅ Mahsulotlar boshqaruvi
- ✅ Ombor kuzatuvi
- ✅ Mijozlar bazasi
- ✅ Asosiy hisobotlar
- ✅ 5 kishigacha jamoa
- ✅ AI faktura skanerlash (kuniga 20 ta)

### Qachon yanada arzon bo'lishi mumkin:
- Agar foydalanuvchilar ko'p bo'lsa (100+), xarajatlar taqsimlanadi
- Agar AI funksiyalarni cheklasak (masalan, kuniga 10 ta faktura)
- Agar database Free tier ishlatilsa (500MB yetarli bo'lsa)

### Qachon qimmatroq bo'lishi mumkin:
- Agar har bir foydalanuvchiga ko'proq imkoniyatlar kerak bo'lsa
- Agar katta hajmdagi AI funksiyalar kerak bo'lsa
- Agar katta hajmdagi ma'lumotlar saqlanadigan bo'lsa

---

## 🎯 XULOSA

**Savdogar** - Bu to'liq funksional POS va CRM tizimi bo'lib, kichik do'kondan tortib katta bizneslargacha ishlatish mumkin. 

**Minimal narx foydalanuvchilar uchun**: **350,000 so'm/oy** ($29/oy)
**Tavsiya etilgan narx**: **450,000 so'm/oy** ($39/oy)
**Pro variant**: **1,000,000 so'm/oy** ($87/oy)

**Xarajatlar (loyiha egasi uchun)**: **$5-100/oy** (foydalanuvchilar soniga qarab)

**Foyda marjasi**: 60-80% (foydalanuvchilar soniga qarab)

Loyiha production'ga deyarli tayyor, lekin bir nechta kritik muammolarni tuzatish kerak.
