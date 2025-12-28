# Vercel Environment Variables - Copy & Paste

Quyidagi environment variable'larni Vercel Dashboard'da "Settings" -> "Environment Variables" bo'limiga qo'shing.

## 🔴 MUHIM (Majburiy) - Backend

```
PGHOST=savdogar.postgres.database.azure.com
PGUSER=engineer
PGPASSWORD=Xazrat_ali571
PGDATABASE=postgres
PGPORT=5432
SECRET_KEY=your_super_secret_key_change_this_in_production_min_32_chars
```

## 🟡 Azure OpenAI (Agar AI funksiyalar ishlatilsa)

```
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

## 🟢 Frontend (Majburiy)

```
NEXT_PUBLIC_API_URL=/api
```

## 🔵 To'lov tizimlari (Ixtiyoriy - agar Click/Payme ishlatilsa)

```
CLICK_MERCHANT_ID=your_click_merchant_id
CLICK_SERVICE_ID=your_click_service_id
CLICK_SECRET_KEY=your_click_secret_key
PAYME_MERCHANT_ID=your_payme_merchant_id
PAYME_SECRET_KEY=your_payme_secret_key
```

## 🟣 Telegram Bot (Ixtiyoriy - agar notification ishlatilsa)

```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

## 📝 Qo'shimcha (Ixtiyoriy)

```
LOG_LEVEL=INFO
UPLOAD_DIR=/tmp/uploads
```

---

## ⚠️ DIQQAT:

1. **SECRET_KEY** ni o'zgartiring - production uchun kuchli parol yarating (minimal 32 belgi)
2. Barcha environment variable'larni **Production, Preview, Development** uchun qo'shing
3. **PGPASSWORD** va **SECRET_KEY** ni hech kimga ko'rsatmang!

