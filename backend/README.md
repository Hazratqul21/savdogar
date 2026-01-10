# Backend API - FastAPI

SmartPOS CRM Backend - Python/FastAPI asosida qurilgan REST API.

## Texnik Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL (Supabase)
- **AI**: OpenAI (gpt-4o va gpt-4o-mini)
- **Storage**: Supabase Storage / Local
- **Deployment**: Vercel (Serverless)

## Asosiy Xususiyatlar

### AI Funksiyalar
- **Invoice Parser**: AI bilan faktura skanerlash
  - `gpt-4o-mini` - printed fakturalar (tez, arzon)
  - `gpt-4o` - handwritten fakturalar (yuqori aniqlik)
- **Receipt Scanner**: Chek skanerlash (gpt-4o)
- **AI Chatbot**: Biznes yordamchisi (gpt-4o)
- **AI Analytics**: Avtomatik tahlil va tavsiyalar (gpt-4o)
- **AI Recommendations**: Mahsulot tavsiyalari (gpt-4o)

### API Endpoints

#### Asosiy
- `/api/v1/auth` - Autentifikatsiya
- `/api/v1/users` - Foydalanuvchilar
- `/api/v1/products` - Mahsulotlar
- `/api/v1/sales` - Savdo
- `/api/v1/inventory` - Ombordagi mahsulotlar
- `/api/v1/customers` - Mijozlar
- `/api/v1/dashboard` - Dashboard statistikalar

#### AI Endpoints
- `/api/v1/ai/parse-invoice` - AI bilan faktura skanerlash
- `/api/v1/ai/chat` - AI chatbot
- `/api/v1/ai/analytics` - AI tahlil
- `/api/v1/ai/recommendations` - AI tavsiyalar
- `/api/v1/receipt-scanner/upload` - Chek skanerlash

#### V2 (Multi-tenant)
- `/api/v1/v2/products` - Mahsulotlar v2
- `/api/v1/v2/sales` - Savdo v2
- `/api/v1/v2/customers` - Mijozlar v2
- `/api/v1/tenants` - Tenantlar
- `/api/v1/organizations` - Tashkilotlar

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
# yoki
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=pos_db

# OpenAI (Required for AI features)
OPENAI_API_KEY=sk-...

# Supabase (Required for cloud storage)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=invoices

# CORS
CORS_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
```

## AI Modellar

Backend faqat **2 ta OpenAI model** ishlatadi:

1. **gpt-4o** - Murakkab vazifalar uchun (handwritten fakturalar, chatbot, analytics)
2. **gpt-4o-mini** - Oddiy vazifalar uchun (printed fakturalar)

### Qayerda qanday model ishlatiladi:

- **Invoice Parser** (`/api/v1/ai/parse-invoice`):
  - `is_handwritten=False` → `gpt-4o-mini`
  - `is_handwritten=True` → `gpt-4o`

- **Boshqa AI servislar**:
  - Receipt Scanner → `gpt-4o`
  - Chatbot → `gpt-4o`
  - Analytics → `gpt-4o`
  - Recommendations → `gpt-4o`
  - Category Detector → `gpt-4o`

## Deployment

### Vercel

```bash
# Local test
vercel dev

# Deploy
vercel --prod
```

Vercel config: `vercel.json`

## Struktura

```
backend/
├── app/
│   ├── api/v1/endpoints/  # API endpoints
│   ├── services/          # Business logic
│   │   ├── openai_hybrid_client.py  # AI invoice parser
│   │   ├── openai_service.py        # AI receipt scanner
│   │   ├── openai_client.py         # General AI client
│   │   ├── ai_chatbot.py            # Chatbot
│   │   ├── ai_analytics.py          # Analytics
│   │   └── ai_recommendations.py    # Recommendations
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   └── core/             # Config, database, etc.
├── alembic/              # Database migrations
├── requirements.txt      # Python dependencies
├── vercel.json          # Vercel config
└── index.py             # Vercel entry point
```

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Server ishga tushganda:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
