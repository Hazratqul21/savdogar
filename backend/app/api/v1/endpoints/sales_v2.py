from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from decimal import Decimal

from app.api import deps
from app.models import User
from app.models.product_v2 import ProductVariant, ProductV2
from app.models.pricing import PriceTier, PriceTierType
from app.models.customer_v2 import CustomerV2, CustomerTier
from app.models.sale_v2 import SaleV2, SaleItemV2, PaymentMethod, SaleStatus
from app.schemas import sale_v2 as schemas

router = APIRouter()

def calculate_cart_total(
    db: Session,
    tenant_id: int,
    items: List[schemas.CartItem],
    customer_id: Optional[int] = None,
) -> schemas.CartCalculationResult:
    """
    Savatcha jami summasini hisoblash
    PriceTiers ni tekshiradi va eng yaxshi narxni tanlaydi
    """
    subtotal = 0.0
    tax_amount = 0.0
    discount_amount = 0.0
    item_details = []
    applied_tiers = []
    
    # Mijoz ma'lumotlari
    customer = None
    customer_tier = None
    if customer_id:
        customer = db.query(CustomerV2).filter(
            and_(
                CustomerV2.id == customer_id,
                CustomerV2.tenant_id == tenant_id
            )
        ).first()
        if customer:
            customer_tier = customer.price_tier
    
    for item in items:
        # Variantni olish
        variant = db.query(ProductVariant).filter(
            and_(
                ProductVariant.id == item.variant_id,
                ProductVariant.tenant_id == tenant_id,
                ProductVariant.is_active == True
            )
        ).first()
        
        if not variant:
            raise HTTPException(
                status_code=404,
                detail=f"Variant {item.variant_id} topilmadi"
            )
        
        # Ombor tekshirish
        if variant.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Variant {variant.sku} uchun yetarli ombor yo'q. Mavjud: {variant.stock_quantity}, Talab: {item.quantity}"
            )
        
        # Narxni aniqlash (PriceTier dan)
        unit_price = variant.price
        applied_tier = None
        
        # PriceTier ni qidirish
        tier_query = db.query(PriceTier).filter(
            and_(
                PriceTier.variant_id == variant.id,
                PriceTier.min_quantity <= item.quantity,
                PriceTier.tenant_id == tenant_id
            )
        )
        
        # Maksimal miqdor tekshirish
        tier_query = tier_query.filter(
            (PriceTier.max_quantity == None) | (PriceTier.max_quantity >= item.quantity)
        )
        
        # Mijoz guruhi tekshirish
        if customer_tier:
            if customer_tier == CustomerTier.WHOLESALER:
                tier_query = tier_query.filter(
                    (PriceTier.customer_group == None) | 
                    (PriceTier.customer_group == "wholesale") |
                    (PriceTier.tier_type == PriceTierType.WHOLESALER)
                )
            elif customer_tier == CustomerTier.VIP:
                tier_query = tier_query.filter(
                    (PriceTier.customer_group == None) | 
                    (PriceTier.customer_group == "vip") |
                    (PriceTier.tier_type == PriceTierType.VIP)
                )
        
        # Eng yaxshi narxni tanlash (eng katta min_quantity)
        tier = tier_query.order_by(PriceTier.min_quantity.desc()).first()
        
        if tier:
            unit_price = tier.price
            applied_tier = {
                "variant_id": variant.id,
                "tier_id": tier.id,
                "tier_type": tier.tier_type.value,
                "min_quantity": tier.min_quantity,
                "price": tier.price
            }
            applied_tiers.append(applied_tier)
        
        # Chegirma
        item_discount = 0.0
        if item.discount_percent > 0:
            item_discount = (unit_price * item.quantity) * (item.discount_percent / 100)
        
        # Element jami
        item_total = (unit_price * item.quantity) - item_discount
        
        # Soliq - variant.product_id orqali ProductV2 ni topish
        from app.models.product_v2 import ProductV2
        product = db.query(ProductV2).filter(ProductV2.id == variant.product_id).first()
        item_tax = item_total * (product.tax_rate / 100) if product else 0.0
        
        item_details.append({
            "variant_id": variant.id,
            "sku": variant.sku,
            "name": product.name if product else "",
            "quantity": item.quantity,
            "unit_price": unit_price,
            "discount_percent": item.discount_percent,
            "discount_amount": item_discount,
            "tax_rate": product.tax_rate if product else 0.0,
            "tax_amount": item_tax,
            "total": item_total + item_tax,
        })
        
        subtotal += item_total
        tax_amount += item_tax
        discount_amount += item_discount
    
    # Adaptive Logic: Horeca Service Charge
    service_charge = 0.0
    from app.models.tenant import Tenant, BusinessType
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if tenant and tenant.business_type == BusinessType.HORECA:
        service_charge = subtotal * 0.10 # 10% xizmat haqi
        
    total = subtotal + tax_amount + service_charge
    
    return schemas.CartCalculationResult(
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=discount_amount,
        service_charge=service_charge,
        total=total,
        items=item_details,
        applied_price_tiers=applied_tiers,
    )

@router.post("/cart/calculate", response_model=schemas.CartCalculationResult)
def calculate_cart(
    *,
    db: Session = Depends(deps.get_db),
    items: List[schemas.CartItem],
    customer_id: Optional[int] = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Savatcha jami summasini hisoblash
    PriceTiers ni tekshiradi
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    return calculate_cart_total(
        db=db,
        tenant_id=current_user.tenant_id,
        items=items,
        customer_id=customer_id,
    )

@router.post("/checkout", response_model=schemas.Sale)
def checkout(
    *,
    db: Session = Depends(deps.get_db),
    checkout_data: schemas.CheckoutRequest,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Checkout - Sotuvni yakunlash
    ACID transaction - ombor va qarz boshqaruvi
    """
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    # Database transaction
    try:
        db.begin()
        
        # Savatchani hisoblash
        cart_result = calculate_cart_total(
            db=db,
            tenant_id=current_user.tenant_id,
            items=checkout_data.items,
            customer_id=checkout_data.customer_id,
        )
        
        # Mijoz tekshirish (agar qarz bo'lsa)
        customer = None
        if checkout_data.customer_id:
            customer = db.query(CustomerV2).filter(
                and_(
                    CustomerV2.id == checkout_data.customer_id,
                    CustomerV2.tenant_id == current_user.tenant_id
                )
            ).first()
            
            if not customer:
                raise HTTPException(status_code=404, detail="Mijoz topilmadi")
        
        # Qarz tekshirish
        if checkout_data.payment_method == PaymentMethod.DEBT:
            if not customer:
                raise HTTPException(
                    status_code=400,
                    detail="Qarz to'lov usuli uchun mijoz kerak"
                )
            
            new_debt = checkout_data.debt_amount or cart_result.total
            new_balance = customer.balance - new_debt  # Negative = qarz
            
            # Qarz limitini tekshirish
            max_debt = customer.max_debt_allowed or customer.credit_limit or 0.0
            if abs(new_balance) > max_debt:
                raise HTTPException(
                    status_code=400,
                    detail=f"Qarz limiti oshib ketdi. Maksimal: ${max_debt}, Joriy: ${abs(new_balance)}"
                )
        
        # Margin Guard - Minimal foyda marjasini tekshirish
        from app.models.tenant import Tenant
        tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
        min_margin = tenant.min_margin_percent if tenant else 5.0
        
        for item_detail in cart_result.items:
            variant = db.query(ProductVariant).filter(ProductVariant.id == item_detail["variant_id"]).first()
            if variant and variant.cost_price:
                profit = item_detail["unit_price"] - variant.cost_price
                margin = (profit / item_detail["unit_price"]) * 100 if item_detail["unit_price"] > 0 else 0
                
                if margin < min_margin:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Marja juda past: {variant.sku}. Minimal: {min_margin}%, Joriy: {margin:.1f}%"
                    )
        
        # Sale yaratish
        sale_obj = SaleV2(
            tenant_id=current_user.tenant_id,
            cashier_id=current_user.id,
            customer_id=checkout_data.customer_id,
            branch_id=checkout_data.branch_id,
            total_amount=cart_result.total,
            subtotal=cart_result.subtotal,
            tax_amount=cart_result.tax_amount,
            discount_amount=cart_result.discount_amount,
            service_charge=cart_result.service_charge,
            payment_method=checkout_data.payment_method,
            status=SaleStatus.COMPLETED,
            is_debt=(checkout_data.payment_method == PaymentMethod.DEBT),
            debt_amount=checkout_data.debt_amount or (cart_result.total if checkout_data.payment_method == PaymentMethod.DEBT else 0.0),
            notes=checkout_data.notes,
        )
        db.add(sale_obj)
        db.flush()  # ID ni olish uchun
        
        # Sale items yaratish va omborni yangilash
        for item_detail in cart_result.items:
            variant = db.query(ProductVariant).filter(
                ProductVariant.id == item_detail["variant_id"]
            ).first()
            
            # Omborni yangilash (Xirmon: Recipe support for Kitchen/Cafe)
            from app.models.tenant import BusinessType
            product = variant.product_v2
            if tenant.business_type in [BusinessType.KITCHEN, BusinessType.CAFE] and product.recipe and "ingredients" in product.recipe:
                for ing in product.recipe["ingredients"]:
                     # Deduct ingredient: qty * portions
                     ing_qty = item_detail["quantity"] * ing["qty"]
                     ing_variant = db.query(ProductVariant).filter(ProductVariant.id == ing["id"]).first()
                     if ing_variant:
                         ing_variant.stock_quantity -= ing_qty
            else:
                variant.stock_quantity -= item_detail["quantity"]
            
            # Sale item yaratish
            sale_item = SaleItemV2(
                sale_id=sale_obj.id,
                variant_id=variant.id,
                quantity=item_detail["quantity"],
                unit_price=item_detail["unit_price"],
                cost_price=variant.cost_price,
                total=item_detail["total"],
                discount_percent=item_detail.get("discount_percent", 0.0),
                discount_amount=item_detail.get("discount_amount", 0.0),
                tax_rate=item_detail.get("tax_rate", 0.0),
                tax_amount=item_detail.get("tax_amount", 0.0),
            )
            db.add(sale_item)
        
        # Qarz kitobiga yozuv qo'shish
        if checkout_data.payment_method == PaymentMethod.DEBT and customer:
            from app.models.customer_v2 import CustomerLedger
            
            new_debt = checkout_data.debt_amount or cart_result.total
            new_balance = customer.balance - new_debt
            
            ledger_entry = CustomerLedger(
                customer_id=customer.id,
                sale_id=sale_obj.id,  # SaleV2 id
                debit=new_debt,
                credit=0.0,
                balance_after=new_balance,
                description=f"Sotuv #{sale_obj.id} - Qarz",
                reference_number=str(sale_obj.id),
                created_by=current_user.id,
            )
            db.add(ledger_entry)
            
            # Mijoz balansini yangilash
            customer.balance = new_balance
        
        db.commit()
        db.refresh(sale_obj)
        
        # Sale items ni yuklash
        sale_obj.items = db.query(SaleItemV2).filter(
            SaleItemV2.sale_id == sale_obj.id
        ).all()
        
        return sale_obj
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Checkout xatosi: {str(e)}"
        )

@router.get("/", response_model=List[schemas.Sale])
def read_sales(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Sotuvlarni olish"""
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="Tenant topilmadi")
    
    sales = db.query(SaleV2).filter(
        SaleV2.tenant_id == current_user.tenant_id
    ).order_by(SaleV2.created_at.desc()).offset(skip).limit(limit).all()
    
    # Items ni yuklash
    for sale in sales:
        sale.items = db.query(SaleItemV2).filter(
            SaleItemV2.sale_id == sale.id
        ).all()
    
    return sales








