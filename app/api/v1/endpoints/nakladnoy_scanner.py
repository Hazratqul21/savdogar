from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import base64
import json
from datetime import datetime

from app.api import deps
from app.models import User
from app.models.product_v2 import ProductV2, ProductVariant, ProductType
from app.schemas import product_v2 as product_schemas
from app.services.openai_client import openai_client
from app.core.file_storage import upload_file, cleanup_file
from app.services.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()


async def analyze_nakladnoy_image(image_data: bytes, filename: str) -> dict:
    """
    Nakladnoy rasmini AI orqali tahlil qilish (GPT-4o mini)
    """
    try:
        # Rasmni base64 ga o'girish
        image_base64 = base64.b64encode(image_data).decode("utf-8")
        ext = filename.lower().split('.')[-1]
        media_type = "image/jpeg" if ext in ["jpg", "jpeg"] else f"image/{ext}"
        image_url = f"data:{media_type};base64,{image_base64}"

        system_prompt = """Siz mahsulot nakladnoyini tahlil qiluvchi AI yordamchisiz. 
Nakladnoy rasmidan quyidagi ma'lumotlarni JSON formatida chiqaring:

{
    "items": [
        {
            "name": "Mahsulot nomi",
            "quantity": 10.0,
            "unit": "kg",
            "price": 15000.0,
            "total": 150000.0
        }
    ]
}

Muhim:
- Faqat JSON qaytaring, boshqa matn yo'q
- quantity, price, total sonlar bo'lishi kerak
- unit - o'lchov birligi (kg, dona, L, m va hokazo)
- Agar o'qib bo'lmasa, null yoki 0 ishlating"""

        result = await openai_client.analyze_image(system_prompt, image_url)
        
        # JSON formatini tekshirish
        if isinstance(result, dict) and "items" in result:
            return result
        elif isinstance(result, dict) and "raw_analysis" in result:
            # Agar raw text qaytgan bo'lsa, JSON ni ajratib olish
            raw_text = result["raw_analysis"]
            try:
                if "```json" in raw_text:
                    json_text = raw_text.split("```json")[1].split("```")[0].strip()
                elif "```" in raw_text:
                    json_text = raw_text.split("```")[1].split("```")[0].strip()
                else:
                    json_text = raw_text
                return json.loads(json_text)
            except:
                raise HTTPException(status_code=400, detail="AI javobini tahlil qilishda xatolik")
        else:
            raise HTTPException(status_code=400, detail="AI to'g'ri formatda javob qaytarmadi")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Nakladnoy tahlil qilishda xatolik: {e}")
        raise HTTPException(status_code=500, detail=f"AI tahlil qilishda xatolik: {str(e)}")


@router.post("/upload-scan")
async def upload_and_scan_nakladnoy(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Nakladnoy rasmini yuklash va AI orqali tahlil qilish
    """
    # Rasm faylini tekshirish
    allowed_types = [
        "image/jpeg", "image/jpg", "image/png", "image/gif", 
        "image/webp", "image/heic", "image/heif"
    ]
    
    file_ext = (file.filename or "").lower().split('.')[-1]
    heic_extensions = [".heic", ".heif", ".hif"]
    
    is_image = (
        (file.content_type and file.content_type.startswith("image/")) or
        file_ext in heic_extensions
    )
    
    if not is_image:
        raise HTTPException(
            status_code=400, 
            detail="Faqat rasm fayllari qabul qilinadi (JPEG, PNG, GIF, WEBP, HEIC)"
        )
    
    # Fayl kontentini o'qish
    content = await file.read()
    
    # AI orqali tahlil qilish
    try:
        result = await analyze_nakladnoy_image(content, file.filename or "image.jpg")
        
        # Faylni saqlash (ixtiyoriy)
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{current_user.id}_{timestamp}_{file.filename}"
        file_path = upload_file(content, filename, subdirectory="nakladnoy")
        
        return {
            "success": True,
            "items": result.get("items", []),
            "image_path": file_path
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Nakladnoy yuklashda xatolik: {e}")
        raise HTTPException(status_code=500, detail=f"Xatolik: {str(e)}")


@router.post("/import-to-inventory")
async def import_nakladnoy_to_inventory(
    *,
    db: Session = Depends(deps.get_db),
    items: List[dict],
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Nakladnoydan olingan mahsulotlarni omborga qo'shish
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=400,
            detail="Foydalanuvchi tenant ga bog'lanmagan"
        )
    
    created_products = []
    errors = []
    
    for item_data in items:
        try:
            name = item_data.get("name", "").strip()
            quantity = float(item_data.get("quantity", 0) or 0)
            price = float(item_data.get("price", 0) or 0)
            unit = item_data.get("unit", "dona")
            
            if not name:
                errors.append({"item": item_data, "error": "Mahsulot nomi bo'sh"})
                continue
            
            if quantity <= 0:
                errors.append({"item": item_data, "error": "Miqdor 0 dan katta bo'lishi kerak"})
                continue
            
            # Mahsulot mavjudligini tekshirish
            existing_product = db.query(ProductV2).filter(
                ProductV2.tenant_id == current_user.tenant_id,
                ProductV2.name.ilike(f"%{name}%")
            ).first()
            
            if existing_product:
                # Mavjud mahsulot - variantga qo'shish yoki yangi variant yaratish
                variant = db.query(ProductVariant).filter(
                    ProductVariant.product_id == existing_product.id,
                    ProductVariant.tenant_id == current_user.tenant_id
                ).first()
                
                if variant:
                    # Variant mavjud - ombordagi miqdorni oshirish
                    variant.stock_quantity += quantity
                    if price > 0:
                        variant.cost_price = price
                    db.add(variant)
                    created_products.append({
                        "product_id": existing_product.id,
                        "variant_id": variant.id,
                        "name": name,
                        "action": "updated",
                        "quantity": quantity
                    })
                else:
                    # Yangi variant yaratish
                    variant = ProductVariant(
                        product_id=existing_product.id,
                        tenant_id=current_user.tenant_id,
                        sku=f"{name.upper().replace(' ', '-')}-{datetime.now().strftime('%Y%m%d')}",
                        price=price * 1.25 if price > 0 else existing_product.base_price,  # 25% markup
                        cost_price=price if price > 0 else existing_product.cost_price,
                        stock_quantity=quantity,
                        primary_unit=unit,
                        attributes={"imported_from_nakladnoy": True},
                        is_active=True
                    )
                    db.add(variant)
                    db.flush()
                    created_products.append({
                        "product_id": existing_product.id,
                        "variant_id": variant.id,
                        "name": name,
                        "action": "variant_created",
                        "quantity": quantity
                    })
            else:
                # Yangi mahsulot yaratish
                product = ProductV2(
                    tenant_id=current_user.tenant_id,
                    name=name,
                    description=f"Nakladnoydan import qilingan - {datetime.now().strftime('%Y-%m-%d')}",
                    type=ProductType.simple,
                    base_price=price * 1.25 if price > 0 else 0,  # 25% markup
                    cost_price=price if price > 0 else 0,
                    is_active=True,
                    product_metadata={"imported_from_nakladnoy": True}
                )
                db.add(product)
                db.flush()
                
                # Variant yaratish
                variant = ProductVariant(
                    product_id=product.id,
                    tenant_id=current_user.tenant_id,
                    sku=f"{name.upper().replace(' ', '-')}-{datetime.now().strftime('%Y%m%d')}",
                    price=price * 1.25 if price > 0 else 0,
                    cost_price=price if price > 0 else 0,
                    stock_quantity=quantity,
                    primary_unit=unit,
                    attributes={"imported_from_nakladnoy": True},
                    is_active=True
                )
                db.add(variant)
                created_products.append({
                    "product_id": product.id,
                    "variant_id": variant.id,
                    "name": name,
                    "action": "created",
                    "quantity": quantity
                })
            
        except Exception as e:
            logger.error(f"Mahsulot yaratishda xatolik: {e}")
            errors.append({"item": item_data, "error": str(e)})
    
    db.commit()
    
    return {
        "success": True,
        "created_count": len(created_products),
        "error_count": len(errors),
        "products": created_products,
        "errors": errors
    }
