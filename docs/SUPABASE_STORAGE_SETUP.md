# 📦 Supabase Storage Setup

## 1. Bucket Yaratish

### Supabase Dashboard → Storage

**Bucket 1: Products**
```
Name: products
Public: ✅ Yes (rasmlar public bo'lishi kerak)
File size limit: 10MB
Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
```

**Bucket 2: Documents** (ixtiyoriy)
```
Name: documents
Public: ❌ No (hujjatlar private)
File size limit: 20MB
Allowed MIME types: application/pdf, image/jpeg, image/png
```

---

## 2. RLS (Row Level Security) Policies

### Products Bucket

```sql
-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Hamma o'qiy oladi
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Policy 2: Authenticated foydalanuvchilar upload qilishi mumkin
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'products' 
    AND auth.role() = 'authenticated'
);

-- Policy 3: Owner o'chirishi mumkin
CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'products' 
    AND auth.role() = 'authenticated'
);
```

---

## 3. Environment Variables

### Backend (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key  # Service key ishlatish!
```

**Service Key ni qayerdan olish:**
1. Supabase Dashboard → Settings → API
2. **service_role** key ni copy qiling (anon key emas!)
3. ⚠️ Bu key ni hech kimga ko'rsatmang!

---

## 4. CDN URL Pattern

Upload qilingandan keyin URL:
```
https://project-id.supabase.co/storage/v1/object/public/products/tenant-123/uuid.jpg
```

**Image Optimization:**
```
# Original
https://project.supabase.co/storage/v1/object/public/products/image.jpg

# Optimized (width=400, quality=80)
https://project.supabase.co/storage/v1/render/image/public/products/image.jpg?width=400&quality=80
```

---

## 5. Folder Structure

```
products/
├── {tenant_id}/
│   ├── {uuid}.jpg          # Mahsulot rasmlari
│   ├── {uuid}.png
│   └── thumbnails/          # Kichik rasmlar (ixtiyoriy)
│       ├── {uuid}_thumb.jpg
│       └── {uuid}_thumb.png

documents/
├── {tenant_id}/
│   ├── receipts/
│   │   └── {receipt_id}.pdf
│   ├── invoices/
│   │   └── {invoice_id}.pdf
│   └── reports/
│       └── {report_id}.pdf
```

---

## 6. Usage Statistics

**Free Plan limits:**
- ✅ 100GB Storage
- ✅ 200GB Egress/month
- ✅ 50MB max file size

**Example calculation:**
- Average image size: 500KB
- 100GB = 204,800 images
- Oylik 1M views @ 500KB = 500GB traffic → Free plan yetmaydi

**Optimization:**
- Use WebP format (30-50% kichikroq)
- Compress images (quality=80)
- Lazy loading
- Thumbnail generation

---

## 7. Backend Implementation

### Install dependency
```bash
pip install supabase
```

### Create storage utility
```python
# backend/app/core/supabase_storage.py
from supabase import create_client
import os
from uuid import uuid4

class SupabaseStorage:
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        self.client = create_client(url, key)
    
    async def upload_product_image(
        self, 
        file_bytes: bytes, 
        tenant_id: int,
        content_type: str = "image/jpeg"
    ) -> str:
        """Upload product image"""
        file_ext = content_type.split("/")[-1]
        filename = f"products/{tenant_id}/{uuid4()}.{file_ext}"
        
        response = self.client.storage.from_("products").upload(
            filename,
            file_bytes,
            {"content-type": content_type}
        )
        
        return self.client.storage.from_("products").get_public_url(filename)
    
    async def delete_image(self, url: str):
        """Delete image by URL"""
        # Extract path from URL
        path = url.split("/storage/v1/object/public/products/")[-1]
        self.client.storage.from_("products").remove([path])

storage = SupabaseStorage()
```

### FastAPI endpoint
```python
# backend/app/api/v1/endpoints/upload.py
from fastapi import APIRouter, UploadFile, File, Depends
from app.core.supabase_storage import storage
from app.api import deps

router = APIRouter()

@router.post("/upload-product-image")
async def upload_product_image(
    file: UploadFile = File(...),
    current_user = Depends(deps.get_current_active_user)
):
    """Upload product image to Supabase Storage"""
    
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(400, "Only JPEG, PNG, WebP allowed")
    
    # Validate file size (10MB max)
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 10MB)")
    
    # Upload
    url = await storage.upload_product_image(
        file_bytes,
        current_user.tenant_id,
        file.content_type
    )
    
    return {"url": url}
```

---

## 8. Frontend Implementation

```typescript
// frontend/src/lib/storage.ts
import { getAuthHeaders, getApiBaseUrl } from './api';

export async function uploadProductImage(file: File): Promise<string> {
    // Validate
    if (!file.type.startsWith('image/')) {
        throw new Error('Only images allowed');
    }
    
    if (file.size > 10 * 1024 * 1024) {
        throw new Error('File too large (max 10MB)');
    }
    
    // Upload
    const formData = new FormData();
    formData.append('file', file);
    
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/v1/upload/product-image`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`
        },
        body: formData
    });
    
    if (!response.ok) {
        throw new Error('Upload failed');
    }
    
    const data = await response.json();
    return data.url;
}

// Usage in component
async function handleImageUpload(file: File) {
    try {
        setUploading(true);
        const url = await uploadProductImage(file);
        setImageUrl(url);
        toast.success('Image uploaded!');
    } catch (error) {
        toast.error(error.message);
    } finally {
        setUploading(false);
    }
}
```

---

## 9. Image Component (Optimized)

```tsx
// frontend/src/components/OptimizedImage.tsx
interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    quality?: number;
    className?: string;
}

export function OptimizedImage({ 
    src, 
    alt, 
    width = 400, 
    quality = 80,
    className 
}: OptimizedImageProps) {
    // Convert to Supabase image transformation URL
    const optimizedSrc = src.includes('supabase.co')
        ? src.replace('/object/public/', '/render/image/public/')
            + `?width=${width}&quality=${quality}`
        : src;
    
    return (
        <img 
            src={optimizedSrc}
            alt={alt}
            loading="lazy"
            className={className}
        />
    );
}
```

---

## 10. Vercel Environment Variables

Vercel Dashboard → Settings → Environment Variables:

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_SERVICE_KEY = your-service-role-key
```

Backend va Frontend uchun:
- Production
- Preview
- Development

---

## ✅ Setup Checklist

- [ ] Supabase da `products` bucket yaratildi
- [ ] RLS policies qo'shildi
- [ ] Service key olindi
- [ ] Backend environment variables qo'shildi
- [ ] `supabase` package install qilindi
- [ ] Upload endpoint yaratildi
- [ ] Frontend upload funksiyasi qo'shildi
- [ ] Vercel da env vars qo'shildi

---

## 🎯 Result

**Afzalliklari:**
- ✅ 100GB free storage
- ✅ CDN orqali tez yuklash
- ✅ Image optimization
- ✅ Xavfsiz (RLS)
- ✅ Database bilan integratsiya

**Kelajakda:**
- Background image processing
- Thumbnail generation
- WebP conversion
- Watermark
