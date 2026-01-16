"""
Checkout Service - Professional POS Checkout Logic
===================================================
Senior-level checkout service with:
- ACID transaction management
- Comprehensive validation
- Receipt number generation
- Stock management
- Customer debt tracking
- Audit logging
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException
from datetime import datetime
from decimal import Decimal
import logging

from app.models.sale_v2 import SaleV2, SaleItemV2, PaymentMethod, SaleStatus
from app.models.product_v2 import ProductVariant
from app.models.customer_v2 import CustomerV2, CustomerLedger
from app.models.tenant import Tenant
from app.services.business_logic import BusinessLogicService

logger = logging.getLogger(__name__)


class CheckoutError(Exception):
    """Custom exception for checkout errors"""
    def __init__(self, message: str, code: str = "CHECKOUT_ERROR", details: dict = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)


class CheckoutService:
    """
    Professional Checkout Service
    
    Handles the complete checkout flow with proper:
    - Input validation
    - Stock checks
    - Price tier application
    - Margin protection
    - Customer debt management
    - Receipt generation
    - Audit logging
    """
    
    def __init__(self, db: Session, tenant_id: int, user_id: int):
        self.db = db
        self.tenant_id = tenant_id
        self.user_id = user_id
        self.tenant = self._get_tenant()
        self.business_type = self.tenant.business_type if self.tenant else "retail"
        self.business_logic = BusinessLogicService
    
    def _get_tenant(self) -> Optional[Tenant]:
        """Get tenant information"""
        return self.db.query(Tenant).filter(Tenant.id == self.tenant_id).first()
    
    def generate_receipt_number(self) -> str:
        """
        Generate unique receipt number in format: R + YYYYMMDD + 4-digit sequence
        Example: R202601160001
        """
        today = datetime.utcnow()
        date_prefix = today.strftime("%Y%m%d")
        
        # Find last receipt number for today
        last_sale = self.db.query(SaleV2).filter(
            and_(
                SaleV2.tenant_id == self.tenant_id,
                SaleV2.receipt_number != None,
                SaleV2.receipt_number.like(f"R{date_prefix}%")
            )
        ).order_by(SaleV2.id.desc()).first()
        
        if last_sale and last_sale.receipt_number:
            try:
                last_num = int(last_sale.receipt_number[-4:])
                next_num = last_num + 1
            except (ValueError, IndexError):
                next_num = 1
        else:
            next_num = 1
        
        return f"R{date_prefix}{next_num:04d}"
    
    def validate_items(self, items: List[Dict]) -> List[Dict]:
        """
        Validate checkout items
        
        Returns enriched items with variant data
        Raises CheckoutError if validation fails
        """
        if not items:
            raise CheckoutError(
                message="Savat bo'sh",
                code="EMPTY_CART"
            )
        
        validated_items = []
        
        for item in items:
            variant_id = item.get("variant_id")
            quantity = item.get("quantity", 1)
            
            if not variant_id:
                raise CheckoutError(
                    message="Variant ID ko'rsatilmagan",
                    code="MISSING_VARIANT_ID"
                )
            
            if quantity <= 0:
                raise CheckoutError(
                    message=f"Noto'g'ri miqdor: {quantity}",
                    code="INVALID_QUANTITY",
                    details={"variant_id": variant_id, "quantity": quantity}
                )
            
            # Get variant
            variant = self.db.query(ProductVariant).filter(
                and_(
                    ProductVariant.id == variant_id,
                    ProductVariant.tenant_id == self.tenant_id,
                    ProductVariant.is_active == True
                )
            ).first()
            
            if not variant:
                raise CheckoutError(
                    message=f"Mahsulot topilmadi: {variant_id}",
                    code="VARIANT_NOT_FOUND",
                    details={"variant_id": variant_id}
                )
            
            # Stock check (skip for services)
            product = variant.product_v2
            is_service = product and product.type == "service"
            
            if not is_service:
                available_stock = variant.stock_quantity or 0
                if available_stock < quantity:
                    raise CheckoutError(
                        message=f"Yetarli stock yo'q: {variant.sku}. Mavjud: {available_stock}, Kerak: {quantity}",
                        code="INSUFFICIENT_STOCK",
                        details={
                            "variant_id": variant_id,
                            "sku": variant.sku,
                            "available": available_stock,
                            "requested": quantity
                        }
                    )
            
            validated_items.append({
                **item,
                "variant": variant,
                "product": product,
                "is_service": is_service
            })
        
        return validated_items
    
    def check_customer_credit(self, customer_id: int, total_amount: float) -> CustomerV2:
        """
        Check customer credit limit for debt payments
        
        Returns customer if valid
        Raises CheckoutError if credit limit exceeded
        """
        customer = self.db.query(CustomerV2).filter(
            and_(
                CustomerV2.id == customer_id,
                CustomerV2.tenant_id == self.tenant_id
            )
        ).first()
        
        if not customer:
            raise CheckoutError(
                message="Mijoz topilmadi",
                code="CUSTOMER_NOT_FOUND",
                details={"customer_id": customer_id}
            )
        
        current_debt = customer.current_debt or 0
        max_allowed = customer.max_debt_allowed or 0
        
        new_debt = current_debt + total_amount
        
        if max_allowed > 0 and new_debt > max_allowed:
            raise CheckoutError(
                message=f"Qarz limiti oshib ketdi. Maksimal: {max_allowed:,.0f}, Joriy: {current_debt:,.0f}, Yangi: {new_debt:,.0f}",
                code="CREDIT_LIMIT_EXCEEDED",
                details={
                    "customer_id": customer_id,
                    "current_debt": current_debt,
                    "max_allowed": max_allowed,
                    "new_total": new_debt
                }
            )
        
        return customer
    
    def check_margin(self, variant: ProductVariant, sale_price: float) -> bool:
        """
        Check minimum margin requirement (Margin Guard)
        
        Returns True if margin is acceptable
        Raises CheckoutError if margin too low
        """
        if not self.tenant:
            return True
        
        min_margin = self.tenant.min_margin_percent or 0
        if min_margin <= 0:
            return True
        
        cost_price = variant.cost_price or 0
        if cost_price <= 0:
            return True
        
        margin = ((sale_price - cost_price) / cost_price) * 100
        
        if margin < min_margin:
            raise CheckoutError(
                message=f"Marja juda past: {variant.sku}. Minimal: {min_margin}%, Joriy: {margin:.1f}%",
                code="MARGIN_TOO_LOW",
                details={
                    "sku": variant.sku,
                    "min_margin": min_margin,
                    "actual_margin": margin,
                    "cost_price": cost_price,
                    "sale_price": sale_price
                }
            )
        
        return True
    
    def calculate_totals(self, validated_items: List[Dict], customer: Optional[CustomerV2] = None) -> Dict:
        """
        Calculate cart totals with price tiers and taxes
        """
        subtotal = 0.0
        tax_total = 0.0
        discount_total = 0.0
        service_charge = 0.0
        
        item_details = []
        
        for item in validated_items:
            variant = item["variant"]
            product = item["product"]
            quantity = item["quantity"]
            discount_percent = item.get("discount_percent", 0)
            
            # Get price (with tier if applicable)
            unit_price = self.business_logic.calculate_price_with_tiers(
                variant=variant,
                quantity=quantity,
                customer_tier=customer.price_tier if customer else "retail"
            )
            
            # Check margin
            self.check_margin(variant, unit_price)
            
            # Calculate line totals
            line_subtotal = unit_price * quantity
            line_discount = line_subtotal * (discount_percent / 100) if discount_percent else 0
            after_discount = line_subtotal - line_discount
            
            tax_rate = product.tax_rate if product else 0
            line_tax = after_discount * (tax_rate / 100)
            
            line_total = after_discount + line_tax
            
            subtotal += line_subtotal
            tax_total += line_tax
            discount_total += line_discount
            
            item_details.append({
                "variant_id": variant.id,
                "sku": variant.sku,
                "name": product.name if product else variant.sku,
                "quantity": quantity,
                "unit_price": unit_price,
                "cost_price": variant.cost_price or 0,
                "discount_percent": discount_percent,
                "discount_amount": line_discount,
                "tax_rate": tax_rate,
                "tax_amount": line_tax,
                "total": line_total,
                "variant": variant,
                "product": product,
                "is_service": item.get("is_service", False)
            })
        
        # Service charge for HORECA
        if self.business_type in ["horeca", "cafe", "kitchen"]:
            service_charge = subtotal * 0.10
        
        total = subtotal - discount_total + tax_total + service_charge
        
        return {
            "subtotal": subtotal,
            "tax_amount": tax_total,
            "discount_amount": discount_total,
            "service_charge": service_charge,
            "total": total,
            "items": item_details
        }
    
    def create_sale(
        self,
        items: List[Dict],
        payment_method: str,
        customer_id: Optional[int] = None,
        branch_id: Optional[int] = None,
        notes: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> SaleV2:
        """
        Create a new sale with all validations and updates
        
        This is the main checkout method that:
        1. Validates all items
        2. Checks customer credit (for debt)
        3. Calculates totals with price tiers
        4. Creates sale and sale items
        5. Updates stock
        6. Updates customer debt
        7. Creates ledger entry
        """
        try:
            # 1. Validate items
            validated_items = self.validate_items(items)
            
            # 2. Get customer if specified
            customer = None
            if customer_id:
                customer = self.db.query(CustomerV2).filter(
                    and_(
                        CustomerV2.id == customer_id,
                        CustomerV2.tenant_id == self.tenant_id
                    )
                ).first()
            
            # 3. Calculate totals
            totals = self.calculate_totals(validated_items, customer)
            
            # 4. Check credit limit for debt payments
            is_debt = payment_method == "debt"
            if is_debt and customer:
                self.check_customer_credit(customer_id, totals["total"])
            
            # 5. Generate receipt number
            receipt_number = self.generate_receipt_number()
            
            # 6. Process business-specific metadata
            sale_metadata = self.business_logic.process_sale_metadata(
                sale=None,
                business_type=self.business_type,
                additional_data=metadata or {}
            )
            
            # 7. Create sale
            sale = SaleV2(
                tenant_id=self.tenant_id,
                cashier_id=self.user_id,
                customer_id=customer_id,
                branch_id=branch_id,
                total_amount=totals["total"],
                subtotal=totals["subtotal"],
                tax_amount=totals["tax_amount"],
                discount_amount=totals["discount_amount"],
                service_charge=totals["service_charge"],
                payment_method=PaymentMethod(payment_method),
                status=SaleStatus.COMPLETED,
                is_debt=is_debt,
                debt_amount=totals["total"] if is_debt else 0.0,
                notes=notes,
                receipt_number=receipt_number,
                sale_metadata=sale_metadata
            )
            self.db.add(sale)
            self.db.flush()
            
            # 8. Create sale items and update stock
            for item_detail in totals["items"]:
                variant = item_detail["variant"]
                
                sale_item = SaleItemV2(
                    sale_id=sale.id,
                    variant_id=variant.id,
                    quantity=item_detail["quantity"],
                    unit_price=item_detail["unit_price"],
                    cost_price=item_detail["cost_price"],
                    total=item_detail["total"],
                    discount_percent=item_detail["discount_percent"],
                    discount_amount=item_detail["discount_amount"],
                    tax_rate=item_detail["tax_rate"],
                    tax_amount=item_detail["tax_amount"],
                    is_service_item=item_detail["is_service"]
                )
                self.db.add(sale_item)
                
                # Update stock (skip for services)
                if not item_detail["is_service"]:
                    variant.stock_quantity = (variant.stock_quantity or 0) - item_detail["quantity"]
            
            # 9. Update customer debt
            if is_debt and customer:
                customer.current_debt = (customer.current_debt or 0) + totals["total"]
                
                # Create ledger entry
                ledger_entry = CustomerLedger(
                    customer_id=customer.id,
                    tenant_id=self.tenant_id,
                    sale_id=sale.id,
                    transaction_type="sale",
                    amount=totals["total"],
                    debit=totals["total"],
                    credit=0,
                    balance_after=customer.current_debt,
                    description=f"Sotuv: {receipt_number}",
                    reference_number=receipt_number,
                    created_by=self.user_id
                )
                self.db.add(ledger_entry)
            
            # 10. Commit transaction
            self.db.commit()
            self.db.refresh(sale)
            
            logger.info(f"✅ Sale created: {receipt_number}, Total: {totals['total']:,.0f}")
            
            return sale
            
        except CheckoutError:
            self.db.rollback()
            raise
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"❌ Checkout error: {e}", exc_info=True)
            raise CheckoutError(
                message=f"Checkout xatosi: {str(e)}",
                code="CHECKOUT_FAILED",
                details={"error": str(e)}
            )


def process_checkout(
    db: Session,
    tenant_id: int,
    user_id: int,
    items: List[Dict],
    payment_method: str,
    customer_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    notes: Optional[str] = None,
    metadata: Optional[Dict] = None
) -> SaleV2:
    """
    Convenience function for checkout
    
    Usage:
        sale = process_checkout(
            db=db,
            tenant_id=tenant_id,
            user_id=current_user.id,
            items=[{"variant_id": 1, "quantity": 2}],
            payment_method="cash"
        )
    """
    service = CheckoutService(db, tenant_id, user_id)
    return service.create_sale(
        items=items,
        payment_method=payment_method,
        customer_id=customer_id,
        branch_id=branch_id,
        notes=notes,
        metadata=metadata
    )
