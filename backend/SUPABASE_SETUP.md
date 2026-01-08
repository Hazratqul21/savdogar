# Supabase + OpenAI Integration Setup Guide

## Overview

This project uses **Supabase** for database and storage, and **OpenAI** for AI invoice scanning. The hybrid scanner workflow:

1. **Upload** → Image uploaded to Supabase Storage (bucket: `invoices`)
2. **Analyze** → Supabase URL sent to OpenAI (gpt-4o-mini or gpt-4o)
3. **Log** → Results saved to `inventory_logs` table
4. **Return** → Parsed data returned to frontend for verification

## Environment Variables

### Required for Backend (Vercel)

Add these to your Vercel project settings → Environment Variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Storage Configuration
STORAGE_TYPE=supabase
SUPABASE_STORAGE_BUCKET=invoices

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require
```

### Required for Frontend (Vercel)

```bash
# Supabase Public Keys (for frontend)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Supabase Setup Steps

### 1. Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `invoices`
3. Set bucket to **Public** (or use signed URLs)
4. Configure CORS if needed

### 2. Get Service Role Key

1. Go to Supabase Dashboard → Settings → API
2. Copy **Service Role Key** (⚠️ Keep secret! Only for backend)
3. Copy **Anon Key** (for frontend)

### 3. Database Migration

Run the Alembic migration to create `inventory_logs` table:

```bash
cd backend
alembic upgrade head
```

Or manually create the table using the SQL schema in `alembic/versions/create_inventory_logs_table.py`

## Storage Configuration

The system automatically uses Supabase Storage when:
- `STORAGE_TYPE=supabase`
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

Files are uploaded to: `invoices/{subdirectory}/{filename}`

## API Endpoint

```
POST /api/v1/invoice-scanner/scan?mode=printed|handwritten
Content-Type: multipart/form-data
Body: file (image)
```

**Response:**
```json
{
  "success": true,
  "items": [
    {
      "product_name": "Product name",
      "quantity": 10.0,
      "price": 15000.0,
      "unit": "kg"
    }
  ],
  "model_used": "gpt-4o-mini",
  "mode": "printed",
  "image_path": "https://xxx.supabase.co/storage/v1/object/public/invoices/..."
}
```

## Cost Optimization

- **Printed invoices**: Uses `gpt-4o-mini` (fast, cost-effective)
- **Handwritten invoices**: Uses `gpt-4o` (high precision)

## Security Notes

1. **Service Role Key**: Never expose in frontend code. Only use in backend.
2. **Storage Bucket**: Set appropriate permissions (public or signed URLs).
3. **Database**: Use SSL connection (`sslmode=require`) for Supabase PostgreSQL.

## Troubleshooting

### Storage Upload Fails
- Check `SUPABASE_SERVICE_ROLE_KEY` is correct
- Verify bucket `invoices` exists and is accessible
- Check bucket permissions

### OpenAI Analysis Fails
- Verify `OPENAI_API_KEY` is set
- Check API quota/limits
- Ensure Supabase URL is publicly accessible (if using public bucket)

### Database Logging Fails
- Verify `DATABASE_URL` is correct
- Run migrations: `alembic upgrade head`
- Check table `inventory_logs` exists
