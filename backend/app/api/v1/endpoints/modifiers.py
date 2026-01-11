"""
Modifiers API Endpoints
=======================
Cafe modifikatorlarini boshqarish.
"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.api import deps
from app.models import User
from app.models.modifier import ModifierGroup, ModifierOption, ProductModifier
from app.schemas import modifier as schemas

router = APIRouter()


# ==================== Modifier Groups ====================

@router.post("/groups", response_model=schemas.ModifierGroupResponse)
def create_modifier_group(
    *,
    db: Session = Depends(deps.get_db),
    group_in: schemas.ModifierGroupCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Yangi modifikator guruhi yaratish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    # Guruh yaratish
    group = ModifierGroup(
        tenant_id=current_user.tenant_id,
        name=group_in.name,
        display_name=group_in.display_name or group_in.name,
        is_required=group_in.is_required,
        min_selections=group_in.min_selections,
        max_selections=group_in.max_selections,
        sort_order=group_in.sort_order,
        is_active=True,
    )
    db.add(group)
    db.flush()
    
    # Variantlarni yaratish
    for i, opt_data in enumerate(group_in.options or []):
        option = ModifierOption(
            group_id=group.id,
            name=opt_data.name,
            display_name=opt_data.display_name or opt_data.name,
            price_adjustment=opt_data.price_adjustment,
            is_default=opt_data.is_default,
            sort_order=opt_data.sort_order or i,
            is_active=True,
        )
        db.add(option)
    
    db.commit()
    db.refresh(group)
    
    # Variantlarni yuklash
    group.options = db.query(ModifierOption).filter(
        ModifierOption.group_id == group.id
    ).order_by(ModifierOption.sort_order).all()
    
    return group


@router.get("/groups", response_model=List[schemas.ModifierGroupResponse])
def get_modifier_groups(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Barcha modifikator guruhlarini olish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    groups = db.query(ModifierGroup).filter(
        and_(
            ModifierGroup.tenant_id == current_user.tenant_id,
            ModifierGroup.is_active == True
        )
    ).order_by(ModifierGroup.sort_order).all()
    
    # Variantlarni yuklash
    for group in groups:
        group.options = db.query(ModifierOption).filter(
            and_(
                ModifierOption.group_id == group.id,
                ModifierOption.is_active == True
            )
        ).order_by(ModifierOption.sort_order).all()
    
    return groups


@router.get("/groups/{group_id}", response_model=schemas.ModifierGroupResponse)
def get_modifier_group(
    *,
    db: Session = Depends(deps.get_db),
    group_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Bitta modifikator guruhini olish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    group = db.query(ModifierGroup).filter(
        and_(
            ModifierGroup.id == group_id,
            ModifierGroup.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Modifikator guruhi topilmadi")
    
    group.options = db.query(ModifierOption).filter(
        ModifierOption.group_id == group.id
    ).order_by(ModifierOption.sort_order).all()
    
    return group


@router.patch("/groups/{group_id}", response_model=schemas.ModifierGroupResponse)
def update_modifier_group(
    *,
    db: Session = Depends(deps.get_db),
    group_id: int,
    group_in: schemas.ModifierGroupUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Modifikator guruhini yangilash"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    group = db.query(ModifierGroup).filter(
        and_(
            ModifierGroup.id == group_id,
            ModifierGroup.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Modifikator guruhi topilmadi")
    
    update_data = group_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(group, field, value)
    
    db.commit()
    db.refresh(group)
    
    group.options = db.query(ModifierOption).filter(
        ModifierOption.group_id == group.id
    ).order_by(ModifierOption.sort_order).all()
    
    return group


@router.delete("/groups/{group_id}")
def delete_modifier_group(
    *,
    db: Session = Depends(deps.get_db),
    group_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Modifikator guruhini o'chirish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    group = db.query(ModifierGroup).filter(
        and_(
            ModifierGroup.id == group_id,
            ModifierGroup.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Modifikator guruhi topilmadi")
    
    # Soft delete
    group.is_active = False
    db.commit()
    
    return {"message": "Modifikator guruhi o'chirildi", "deleted_id": group_id}


# ==================== Modifier Options ====================

@router.post("/groups/{group_id}/options", response_model=schemas.ModifierOptionResponse)
def add_modifier_option(
    *,
    db: Session = Depends(deps.get_db),
    group_id: int,
    option_in: schemas.ModifierOptionCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Modifikator guruhiga variant qo'shish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    # Guruhni tekshirish
    group = db.query(ModifierGroup).filter(
        and_(
            ModifierGroup.id == group_id,
            ModifierGroup.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Modifikator guruhi topilmadi")
    
    option = ModifierOption(
        group_id=group_id,
        name=option_in.name,
        display_name=option_in.display_name or option_in.name,
        price_adjustment=option_in.price_adjustment,
        is_default=option_in.is_default,
        sort_order=option_in.sort_order,
        is_active=True,
    )
    db.add(option)
    db.commit()
    db.refresh(option)
    
    return option


@router.patch("/options/{option_id}", response_model=schemas.ModifierOptionResponse)
def update_modifier_option(
    *,
    db: Session = Depends(deps.get_db),
    option_id: int,
    option_in: schemas.ModifierOptionUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Modifikator variantini yangilash"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    option = db.query(ModifierOption).join(ModifierGroup).filter(
        and_(
            ModifierOption.id == option_id,
            ModifierGroup.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not option:
        raise HTTPException(status_code=404, detail="Modifikator varianti topilmadi")
    
    update_data = option_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(option, field, value)
    
    db.commit()
    db.refresh(option)
    
    return option


# ==================== Product Modifiers ====================

@router.post("/products/{product_id}/modifiers", response_model=schemas.ProductModifierResponse)
def add_modifier_to_product(
    *,
    db: Session = Depends(deps.get_db),
    product_id: int,
    modifier_in: schemas.ProductModifierCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Mahsulotga modifikator guruhi qo'shish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    from app.models.product_v2 import ProductV2
    
    # Mahsulotni tekshirish
    product = db.query(ProductV2).filter(
        and_(
            ProductV2.id == product_id,
            ProductV2.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    
    # Guruhni tekshirish
    group = db.query(ModifierGroup).filter(
        and_(
            ModifierGroup.id == modifier_in.modifier_group_id,
            ModifierGroup.tenant_id == current_user.tenant_id
        )
    ).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Modifikator guruhi topilmadi")
    
    # Mavjudligini tekshirish
    existing = db.query(ProductModifier).filter(
        and_(
            ProductModifier.product_id == product_id,
            ProductModifier.modifier_group_id == modifier_in.modifier_group_id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Bu modifikator allaqachon qo'shilgan")
    
    pm = ProductModifier(
        product_id=product_id,
        modifier_group_id=modifier_in.modifier_group_id,
        sort_order=modifier_in.sort_order,
        is_active=True,
    )
    db.add(pm)
    db.commit()
    db.refresh(pm)
    
    # Guruhni yuklash
    pm.modifier_group = group
    pm.modifier_group.options = db.query(ModifierOption).filter(
        ModifierOption.group_id == group.id
    ).order_by(ModifierOption.sort_order).all()
    
    return pm


@router.get("/products/{product_id}/modifiers", response_model=List[schemas.ProductModifierResponse])
def get_product_modifiers(
    *,
    db: Session = Depends(deps.get_db),
    product_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Mahsulot modifikatorlarini olish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    pms = db.query(ProductModifier).filter(
        and_(
            ProductModifier.product_id == product_id,
            ProductModifier.is_active == True
        )
    ).order_by(ProductModifier.sort_order).all()
    
    # Guruhlarni yuklash
    for pm in pms:
        pm.modifier_group = db.query(ModifierGroup).filter(
            ModifierGroup.id == pm.modifier_group_id
        ).first()
        if pm.modifier_group:
            pm.modifier_group.options = db.query(ModifierOption).filter(
                and_(
                    ModifierOption.group_id == pm.modifier_group.id,
                    ModifierOption.is_active == True
                )
            ).order_by(ModifierOption.sort_order).all()
    
    return pms


@router.delete("/products/{product_id}/modifiers/{modifier_group_id}")
def remove_modifier_from_product(
    *,
    db: Session = Depends(deps.get_db),
    product_id: int,
    modifier_group_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Mahsulotdan modifikator guruhini o'chirish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    pm = db.query(ProductModifier).filter(
        and_(
            ProductModifier.product_id == product_id,
            ProductModifier.modifier_group_id == modifier_group_id
        )
    ).first()
    
    if not pm:
        raise HTTPException(status_code=404, detail="Modifikator topilmadi")
    
    db.delete(pm)
    db.commit()
    
    return {"message": "Modifikator o'chirildi"}
