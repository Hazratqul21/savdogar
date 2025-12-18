# Vercel Deployment Setup 🚀

## MUHIM: Vercel Settings

Vercel'ga deploy qilish uchun quyidagi sozlamalarni o'rnating:

### 1. Vercel Dashboard'da Project Settings:

1. Vercel dashboard'da loyihangizga kiring
2. **Settings** -> **General** bo'limiga o'ting
3. **Root Directory** ni quyidagicha o'rnating:
   ```
   savdogar_project_ready
   ```
4. **Save** tugmasini bosing

### 2. Build Settings:

- **Framework Preset**: `Next.js`
- **Build Command**: `npm run build` (yoki bo'sh qoldiring - avtomatik)
- **Output Directory**: `frontend/.next`
- **Install Command**: `npm install` (yoki bo'sh qoldiring - avtomatik)

### 3. Environment Variables:

Vercel Dashboard -> Settings -> Environment Variables bo'limiga quyidagilarni kiriting:

#### Backend (Python/FastAPI)
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
- `PYTHONPATH`: `backend`

#### Frontend (Next.js)
- `NEXT_PUBLIC_API_URL`: `/api`

### 4. Deploy:

GitHub'dan avtomatik deploy qilish uchun:
1. GitHub reponi Vercel'ga ulang
2. Root Directory ni `savdogar_project_ready` qilib o'rnating
3. Deploy tugmasini bosing

Yoki CLI orqali:
```bash
cd savdogar_project_ready
npx vercel
```

---

**Eslatma**: Root Directory ni `savdogar_project_ready` qilib o'rnatish juda muhim!
