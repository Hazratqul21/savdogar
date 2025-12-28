# Savdogar POS - Vercel Deployment Guide 🚀

Ushbu loyiha monorepo (Frontend + Backend) sifatida Vercel-ga joylashtirish uchun to'liq tayyorlangan.

## 1. Environment Variables (Vercel Dashboard-da kiriting)

Vercel loyihangizda "Settings" -> "Environment Variables" bo'limiga o'ting va quyidagilarni kiriting:

### Backend (Python/FastAPI)
- `PGHOST`: `savdogar.postgres.database.azure.com`
- `PGUSER`: `engineer`
- `PGPASSWORD`: `Xazrat_ali571`
- `PGDATABASE`: `postgres`
- `PGPORT`: `5432`
- `SECRET_KEY`: `(Istalgan murakkab tekst)`
- `AZURE_OPENAI_API_KEY`: `(Siz bergan kalit)`
- `AZURE_OPENAI_ENDPOINT`: `(Siz bergan endpoint)`
- `AZURE_OPENAI_DEPLOYMENT_NAME`: `(Siz bergan model nomi)`
- `AZURE_OPENAI_API_VERSION`: `2024-02-15-preview`
- `AZURE_OPENAI_LOCATION`: `eastus2`

### Frontend (Next.js)
- `NEXT_PUBLIC_API_URL`: `/api` (Bu juda muhim!)

## 2. Joylashtirish (Deployment) Qadamlari

### Variant A: Vercel CLI (Tavsiya etiladi)
1. Terminalda loyiha root papkasida turing.
2. `npx vercel` buyrug'ini bering.
3. So'rovnomalarga javob bering (Link to existing project: No, Project Name: savdogar, etc.).
4. **MUHIM**: Vercel "Cloud Settings"da "Root Directory"ni **bo'sh qoldiring** (Project root-da turing), chunki `vercel.json` hammasini o'zi boshqaradi.

### Variant B: GitHub Integratsiya
1. Loyihani GitHub-ga push qiling.
2. Vercel-da "New Project" ni bering va GitHub repo-ni tanlang.
3. Build Settings-da:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `(Bo'sh)`
   - **Build Command**: `npm run build` (Root-dagi package.json ishlatiladi)
   - **Output Directory**: `frontend/.next`

## 3. Database Migrations
Vercel-ga deploy qilgandan so'ng, agar bazada o'zgarishlar bo'lsa, mahalliy terminalingizdan bazaga ulanib `alembic upgrade head` buyrug'ini bir marta bajarib qo'ying (Local-da turganingizda bazaga ulanish ma'lumotlari `.env` da bo'lsin).

---
**Savdogar v5.5 endi bulutlarda parvoz qilishga tayyor!** 🌌🚀
