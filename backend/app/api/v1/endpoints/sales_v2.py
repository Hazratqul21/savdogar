from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from decimal import Decimal

from app.api import deps
from app.models import User
from app.models.product_v2 import ProductVariant, ProductV2, ProductType
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
    validate_serials: bool = True,  # ✅ PART 2: Serial number validation
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
        # Variantni olish (variant_id unique, tenant_id filter kerak emas)
        variant = db.query(ProductVariant).filter(
            and_(
                ProductVariant.id == item.variant_id,
                ProductVariant.is_active == True
            )
        ).first()
        
        if not variant:
            raise HTTPException(
                status_code=404,
                detail=f"Variant {item.variant_id} topilmadi yoki faol emas"
            )
        
        # ✅ PART 2: Serial number validation for serialized items
        if validate_serials and variant.requires_serial_number:
            if not item.serial_number:
                raise HTTPException(
                    status_code=400,
                    detail=f"Variant {variant.sku} serial number talab qiladi. Serial number kiriting."
                )
            
            # Verify serial number exists and is available
            from app.models.serial_number import SerialNumber
            serial = db.query(SerialNumber).filter(
                and_(
                    SerialNumber.tenant_id == tenant_id,
                    SerialNumber.variant_id == variant.id,
                    SerialNumber.serial_number == item.serial_number,
                    SerialNumber.is_sold == False,
                    SerialNumber.is_active == True
                )
            ).first()
            
            if not serial:
                raise HTTPException(
                    status_code=400,
                    detail=f"Serial number '{item.serial_number}' topilmadi yoki allaqachon sotilgan"
                )
        
        # Get business type and config to check if negative stock is allowed
        from app.models.tenant import Tenant
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        allow_negative = False
        if tenant and tenant.config:
            allow_negative = tenant.config.get("allow_negative_stock", False)

        # ✅ PART 2: Stock check with decimal support for length-based items
        # For serialized items, stock is tracked by serial numbers, not quantity
        if not variant.is_serialized and not allow_negative:
            # Meter based vs Piece based check
            is_meter = variant.primary_unit in ["meter", "metr", "m"]
            unit_suffix = "m" if is_meter else ""
            
            if variant.stock_quantity < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Variant {variant.sku} uchun yetarli ombor yo'q. Mavjud: {variant.stock_quantity}{unit_suffix}, Talab: {item.quantity}{unit_suffix}"
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
    
    # Adaptive Logic: Horeca Service Charge (business_type is now a string)
    service_charge = 0.0
    from app.models.tenant import Tenant
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if tenant and tenant.business_type == "horeca":
        service_charge = 0.0 # 10% xizmat haqi o'chirildi
        
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
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    return calculate_cart_total(
        db=db,
        tenant_id=tenant_id,
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
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    # Get tenant and business type
    from app.models.tenant import Tenant, BusinessType
    from app.services.business_logic import business_logic
    
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi")
    
    business_type = tenant.business_type
    tenant_config = tenant.config or {}
    
    # Database transaction
    # SQLAlchemy autocommit=False bilan avtomatik tranzaksiya boshqaradi
    # db.begin() chaqirish KERAK EMAS - xatolik keltirib chiqaradi
    try:
        # Savatchani hisoblash
        cart_result = calculate_cart_total(
            db=db,
            tenant_id=tenant_id,
            items=checkout_data.items,
            customer_id=checkout_data.customer_id,
        )
        
        # Mijoz tekshirish (agar qarz bo'lsa)
        customer = None
        if checkout_data.customer_id:
            customer = db.query(CustomerV2).filter(
                and_(
                    CustomerV2.id == checkout_data.customer_id,
                    CustomerV2.tenant_id == tenant_id
                )
            ).first()
            
            if not customer:
                raise HTTPException(status_code=404, detail="Mijoz topilmadi")
        
        # ✅ Business Logic: Tobacco Age Verification (business_type is now a string)
        if business_type == "tobacco":
            if business_logic.requires_age_verification(business_type, tenant_config):
                age_verified = checkout_data.metadata.get("age_verified") if hasattr(checkout_data, 'metadata') else False
                if not age_verified:
                    raise HTTPException(
                        status_code=400,
                        detail="Yosh tekshiruvi talab qilinadi. Mijoz 20+ yoshda ekanligini tasdiqlang."
                    )
            
            # Check license expiry
            is_valid, warning = business_logic.check_license_expiry(business_type, tenant_config)
            if not is_valid:
                raise HTTPException(status_code=400, detail=warning or "Litsenziya yaroqsiz")
        
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
        
        # Process business-type-specific metadata
        sale_metadata = business_logic.process_sale_metadata(
            sale=None,  # Will be set after creation
            business_type=business_type,
            additional_data=checkout_data.metadata or {}
        )
        
        # ✅ Receipt number generatsiyasi (POS standart formati)
        from datetime import datetime
        today = datetime.utcnow()
        date_prefix = today.strftime("%Y%m%d")
        
        # Bugungi oxirgi receipt raqamini topish
        last_sale_today = db.query(SaleV2).filter(
            and_(
                SaleV2.tenant_id == tenant_id,
                SaleV2.receipt_number != None,
                SaleV2.receipt_number.like(f"R{date_prefix}%")
            )
        ).order_by(SaleV2.id.desc()).first()
        
        if last_sale_today and last_sale_today.receipt_number:
            try:
                last_num = int(last_sale_today.receipt_number[-4:])
                next_num = last_num + 1
            except:
                next_num = 1
        else:
            next_num = 1
        
        receipt_number = f"R{date_prefix}{next_num:04d}"
        
        # Sale yaratish
        sale_obj = SaleV2(
            tenant_id=tenant_id,
            cashier_id=current_user.id,
            customer_id=checkout_data.customer_id,
            branch_id=checkout_data.branch_id,
            total_amount=cart_result.total,
            subtotal=cart_result.subtotal,
            tax_amount=cart_result.tax_amount,
            discount_amount=cart_result.discount_amount,
            service_charge=cart_result.service_charge,
            payment_method=checkout_data.payment_method.value.lower(),
            status=SaleStatus.COMPLETED.value.lower(),
            is_debt=(checkout_data.payment_method == PaymentMethod.DEBT),
            debt_amount=checkout_data.debt_amount or (cart_result.total if checkout_data.payment_method == PaymentMethod.DEBT else 0.0),
            notes=checkout_data.notes,
            sale_metadata=sale_metadata,
            receipt_number=receipt_number,
        )
        db.add(sale_obj)
        db.flush()  # ID ni olish uchun
        
        # Sale items yaratish va omborni yangilash
        # ✅ PART 2: Track sale items for service linking
        sale_items_map = {}  # variant_id -> sale_item_id for service linking
        
        for idx, item_detail in enumerate(cart_result.items):
            variant = db.query(ProductVariant).filter(
                ProductVariant.id == item_detail["variant_id"]
            ).first()
            
            # ✅ PART 2: Serial number handling
            serial_number_id = None
            cart_item = checkout_data.items[idx] if idx < len(checkout_data.items) else None
            
            if variant.requires_serial_number and cart_item and cart_item.serial_number:
                from app.models.serial_number import SerialNumber
                serial = db.query(SerialNumber).filter(
                    and_(
                        SerialNumber.tenant_id == tenant_id,
                        SerialNumber.variant_id == variant.id,
                        SerialNumber.serial_number == cart_item.serial_number,
                        SerialNumber.is_sold == False
                    )
                ).first()
                
                if serial:
                    serial_number_id = serial.id
                    serial.is_sold = True
                    serial.sale_id = sale_obj.id
                    # Set warranty start date if not set
                    if not serial.warranty_start_date:
                        from datetime import date
                        serial.warranty_start_date = date.today()
                        if serial.warranty_duration_months:
                            from dateutil.relativedelta import relativedelta
                            serial.warranty_end_date = serial.warranty_start_date + relativedelta(months=serial.warranty_duration_months)
                    db.add(serial)
            
            # ✅ PART 2: Service item linking
            is_service_item = False
            linked_sale_item_id = None
            
            if cart_item and cart_item.is_service_item:
                is_service_item = True
                # Link to the product variant if specified
                if cart_item.linked_variant_id:
                    # Find the sale item for the linked variant
                    for prev_idx, prev_item in enumerate(cart_result.items):
                        if prev_item["variant_id"] == cart_item.linked_variant_id:
                            # This will be set after we create the linked item
                            pass
            
            # Omborni yangilash (Xirmon: Recipe support for Kitchen/Cafe)
            from app.models.tenant import BusinessType
            product = variant.product_v2
            
            # ✅ PART 2: For serialized items, don't decrease stock (stock is tracked by serial numbers)
            if variant.is_serialized:
                # Stock is managed by serial numbers, not quantity
                pass
            elif tenant.business_type in ["kitchen", "cafe"] and product.recipe and "ingredients" in product.recipe:
                for ing in product.recipe["ingredients"]:
                     # Deduct ingredient: qty * portions
                     ing_qty = item_detail["quantity"] * ing["qty"]
                     ing_variant = db.query(ProductVariant).filter(ProductVariant.id == ing["id"]).first()
                     if ing_variant:
                         ing_variant.stock_quantity -= ing_qty
            else:
                # ✅ PART 2: Decimal quantity support for length-based items
                variant.stock_quantity -= item_detail["quantity"]
            
            # Process business-type-specific item metadata
            item_metadata = business_logic.process_sale_item_metadata(
                item=None,  # Will be set after creation
                business_type=business_type,
                additional_data={
                    **(checkout_data.metadata or {}),
                    "variant_attributes": variant.attributes or {},
                    "product_metadata": product.product_metadata or {}
                }
            )
            
            # ✅ Tobacco: Handle unit conversion if needed (business_type is now a string)
            if business_type == "tobacco":
                unit_sold = checkout_data.metadata.get("unit_sold", "pack") if checkout_data.metadata else "pack"
                conversion_result = business_logic.apply_tobacco_unit_conversion(
                    db=db,
                    variant=variant,
                    quantity=Decimal(str(item_detail["quantity"])),
                    target_unit=unit_sold
                )
                if conversion_result[0] and conversion_result[2]:
                    item_metadata.update(conversion_result[2])
            
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
                item_metadata=item_metadata,
                # ✅ PART 2: Serial number and service tracking
                serial_number_id=serial_number_id,
                is_service_item=is_service_item,
            )
            db.add(sale_item)
            db.flush()  # Get sale_item.id
            
            sale_items_map[variant.id] = sale_item.id
            
            # ✅ PART 2: Link service item to product item
            if is_service_item and cart_item and cart_item.linked_variant_id:
                linked_sale_item_id = sale_items_map.get(cart_item.linked_variant_id)
                if linked_sale_item_id:
                    sale_item.linked_sale_item_id = linked_sale_item_id
                    db.add(sale_item)
        
        # ✅ PART 2: Handle bundle breakdown
        # If any item is a bundle, create sale items for components
        for idx, item_detail in enumerate(cart_result.items):
            variant = db.query(ProductVariant).filter(
                ProductVariant.id == item_detail["variant_id"]
            ).first()
            product = variant.product_v2
            
            if product.type == ProductType.bundle:
                from app.models.product_bundle import ProductBundle
                bundle_components = db.query(ProductBundle).filter(
                    and_(
                        ProductBundle.product_id == product.id,
                        ProductBundle.tenant_id == tenant_id,
                        ProductBundle.is_active == True
                    )
                ).order_by(ProductBundle.sequence).all()
                
                # Create sale items for each bundle component
                for component in bundle_components:
                    component_variant = db.query(ProductVariant).filter(
                        ProductVariant.id == component.component_variant_id
                    ).first()
                    
                    if component_variant:
                        # Calculate component quantity (bundle quantity * component quantity)
                        component_qty = item_detail["quantity"] * component.quantity
                        component_price = component.price_override or component_variant.price
                        component_total = component_qty * component_price
                        
                        # Update stock for component
                        if not component_variant.is_serialized:
                            component_variant.stock_quantity -= component_qty
                        
                        # Create sale item for component
                        component_sale_item = SaleItemV2(
                            sale_id=sale_obj.id,
                            variant_id=component_variant.id,
                            quantity=component_qty,
                            unit_price=component_price,
                            cost_price=component_variant.cost_price,
                            total=component_total,
                            notes=f"Bundle component: {product.name}",
                        )
                        db.add(component_sale_item)
        
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
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    sales = db.query(SaleV2).filter(
        SaleV2.tenant_id == tenant_id
    ).order_by(SaleV2.created_at.desc()).offset(skip).limit(limit).all()
    
    # Items ni yuklash
    for sale in sales:
        sale.items = db.query(SaleItemV2).filter(
            SaleItemV2.sale_id == sale.id
        ).all()
    
    return sales


@router.get("/{sale_id}", response_model=schemas.Sale)
def read_sale(
    *,
    db: Session = Depends(deps.get_db),
    sale_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Bitta sotuvni olish"""
    # Support both tenant_id (new) and organization_id (old) for backwards compatibility
    tenant_id = current_user.tenant_id or current_user.organization_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant yoki organizatsiya topilmadi")
    
    sale = db.query(SaleV2).filter(
        and_(
            SaleV2.id == sale_id,
            SaleV2.tenant_id == tenant_id
        )
    ).first()
    
    if not sale:
        raise HTTPException(status_code=404, detail="Sotuv topilmadi")
    
    # Items ni yuklash
    sale.items = db.query(SaleItemV2).filter(
        SaleItemV2.sale_id == sale.id
    ).all()
    
    return sale






