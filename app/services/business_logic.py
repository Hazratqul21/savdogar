"""
Business Logic Service Layer
Handles industry-specific workflows for each business type.
Implements the "Golden Rules" for POS systems.

NOTE: business_type is now stored as a string (e.g., "retail", "wholesale", "tobacco")
      not as an enum. All comparisons use string literals.
"""
from typing import Dict, Any, Optional, List, Tuple, Union
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.product_v2 import ProductV2, ProductVariant
from app.models.sale_v2 import SaleV2, SaleItemV2
from app.models.customer_v2 import CustomerV2
from app.services.logging import get_logger

logger = get_logger(__name__)


class BusinessLogicService:
    """
    Centralized business logic for different business types.
    Each method implements industry-specific rules.
    
    business_type is a string: "retail", "fashion", "horeca", "cafe", 
                               "wholesale", "jewelry", "tobacco", "kitchen", etc.
    """
    
    @staticmethod
    def can_add_to_cart(
        db: Session,
        variant: ProductVariant,
        quantity: Decimal,
        business_type: str,
        customer: Optional[CustomerV2] = None,
        tenant_config: Optional[Dict] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if item can be added to cart based on business type rules.
        
        Returns:
            (can_add: bool, error_message: Optional[str])
        """
        tenant_config = tenant_config or {}
        
        if business_type == "wholesale":
            # Check minimum order quantity
            moq = variant.product.product_metadata.get("moq", 0)
            if moq > 0 and quantity < moq:
                return False, f"Minimal buyurtma miqdori: {moq}"
            
            # Check credit limit if customer exists
            if customer:
                credit_limit = tenant_config.get("credit_limit", 0)
                if credit_limit > 0:
                    current_balance = customer.balance or 0
                    if current_balance >= credit_limit:
                        return False, f"Mijoz kredit limiti: {credit_limit} so'm. Joriy balans: {current_balance} so'm"
        
        elif business_type == "tobacco":
            # Check MGC (Minimum Government Price) compliance
            mgc_enabled = tenant_config.get("mgc_enabled", False)
            if mgc_enabled:
                mgc_price = variant.product.product_metadata.get("mgc_price")
                if mgc_price and variant.price < mgc_price:
                    return False, f"Davlat minimal narxi (MGC): {mgc_price} so'm. Narx past bo'lishi mumkin emas."
        
        # Stock check: Respect 'allow_negative_stock' configuration for all business types
        allow_negative = tenant_config.get("allow_negative_stock", False)
        if not allow_negative and variant.stock_quantity < quantity:
            return False, f"Omborda yetarli emas. Mavjud: {variant.stock_quantity}"
        
        return True, None
    
    @staticmethod
    def requires_variant_selection(
        product: ProductV2,
        business_type: str
    ) -> bool:
        """
        Check if product requires variant selection before adding to cart.
        """
        if business_type == "fashion":
            # Fashion: Always show size/color matrix
            if product.type.value == "variable":
                return True
        
        if business_type == "jewelry":
            # Jewelry: Show variant grid for visual selection
            if product.type.value == "variable":
                return True
        
        return False
    
    @staticmethod
    def get_variant_selection_ui(
        product: ProductV2,
        business_type: str
    ) -> Dict[str, Any]:
        """
        Get UI configuration for variant selection based on business type.
        """
        if business_type == "fashion":
            # 2D Matrix: Rows (Sizes) x Cols (Colors)
            attributes = product.variants[0].attributes if product.variants else {}
            sizes = sorted(set(v.attributes.get("size", "") for v in product.variants if v.attributes.get("size")))
            colors = sorted(set(v.attributes.get("color", "") for v in product.variants if v.attributes.get("color")))
            
            return {
                "type": "matrix",
                "rows": sizes,
                "cols": colors,
                "layout": "grid"
            }
        
        if business_type == "jewelry":
            # Visual grid with thumbnails
            return {
                "type": "visual_grid",
                "show_thumbnails": True,
                "thumbnail_size": "large"
            }
        
        return {"type": "simple", "variants": []}
    
    @staticmethod
    def process_sale_metadata(
        sale: SaleV2,
        business_type: str,
        additional_data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Process and add business-type-specific metadata to sale.
        """
        metadata = sale.sale_metadata if sale else {}
        metadata = metadata or {}
        additional_data = additional_data or {}
        
        if business_type in ["horeca", "cafe"]:
            metadata.update({
                "table_number": additional_data.get("table_number"),
                "parked": additional_data.get("parked", False),
                "kitchen_ticket_printed": False
            })
        
        elif business_type == "wholesale":
            if sale and sale.customer_id:
                customer = sale.customer
                metadata.update({
                    "credit_approved": not sale.is_debt or customer.balance < (customer.credit_limit or 0),
                    "tier_used": additional_data.get("price_tier")
                })
        
        elif business_type == "tobacco":
            metadata.update({
                "age_verified": additional_data.get("age_verified", False),
                "mgc_compliant": additional_data.get("mgc_compliant", True),
                "license_valid": True  # Should check tenant license expiry
            })
        
        elif business_type == "kitchen":
            metadata.update({
                "recipe_ingredients_deducted": False  # Will be set after processing
            })
        
        return metadata
    
    @staticmethod
    def process_sale_item_metadata(
        item: Optional[SaleItemV2],
        business_type: str,
        additional_data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Process and add business-type-specific metadata to sale item.
        """
        metadata = item.item_metadata if item else {}
        metadata = metadata or {}
        additional_data = additional_data or {}
        
        if business_type == "fashion":
            # Store size/color for return policy
            variant_attrs = additional_data.get("variant_attributes", {})
            metadata.update({
                "size": variant_attrs.get("size"),
                "color": variant_attrs.get("color"),
                "return_policy_applied": True,
                "return_deadline": None  # Calculate from tenant config
            })
        
        elif business_type in ["horeca", "cafe"]:
            # Store modifiers
            metadata.update({
                "modifiers": additional_data.get("modifiers", {}),
                "special_instructions": additional_data.get("special_instructions")
            })
        
        elif business_type == "tobacco":
            # Store unit conversion info
            metadata.update({
                "unit_sold": additional_data.get("unit_sold", "pack"),
                "block_opened": additional_data.get("block_opened", False),
                "conversion_applied": additional_data.get("conversion_applied", False)
            })
        
        elif business_type == "kitchen":
            # Store recipe deduction info
            metadata.update({
                "recipe_applied": True,
                "ingredients_deducted": additional_data.get("ingredients_deducted", {})
            })
        
        return metadata
    
    @staticmethod
    def requires_age_verification(
        business_type: str,
        tenant_config: Optional[Dict] = None
    ) -> bool:
        """
        Check if age verification is required before payment.
        """
        if business_type == "tobacco":
            tenant_config = tenant_config or {}
            return tenant_config.get("enforce_age_check", False)
        return False
    
    @staticmethod
    def check_license_expiry(
        business_type: str,
        tenant_config: Optional[Dict] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if license is expiring soon (within 30 days).
        
        Returns:
            (is_valid: bool, warning_message: Optional[str])
        """
        if business_type == "tobacco":
            tenant_config = tenant_config or {}
            license_expiry = tenant_config.get("license_expiry")
            if license_expiry:
                from datetime import datetime, timedelta
                try:
                    expiry_date = datetime.fromisoformat(license_expiry)
                    days_until_expiry = (expiry_date - datetime.now()).days
                    if days_until_expiry < 0:
                        return False, "Litsenziya muddati tugagan!"
                    elif days_until_expiry <= 30:
                        return True, f"Litsenziya {days_until_expiry} kundan keyin tugaydi!"
                except:
                    pass
        return True, None
    
    @staticmethod
    def apply_tobacco_unit_conversion(
        db: Session,
        variant: ProductVariant,
        quantity: Decimal,
        target_unit: str  # "pack" or "block"
    ) -> Tuple[bool, Optional[str], Optional[Dict]]:
        """
        Handle tobacco multi-unit conversion (Block -> Packs).
        
        Returns:
            (success: bool, error_message: Optional[str], conversion_data: Optional[Dict])
        """
        metadata = variant.product.product_metadata or {}
        conversion_chain = metadata.get("conversion_chain", {})
        
        if not conversion_chain:
            return False, "Conversion chain not configured", None
        
        # Example: 1 Block = 10 Packs
        # If selling 1 Block, decrease Block stock by 1, increase Pack stock by 10
        parent_product_id = metadata.get("parent_product_id")
        
        if target_unit == "block" and variant.primary_unit == "block":
            # Opening a block - need to find pack variant
            pack_conversion = conversion_chain.get("block_to_pack", 10)
            # This would need to find the pack variant and update stock
            return True, None, {
                "block_opened": True,
                "packs_added": pack_conversion,
                "conversion_applied": True
            }
        
        return True, None, None
    
    @staticmethod
    def calculate_price_with_tiers(
        variant: ProductVariant,
        quantity: Decimal,
        business_type: str,
        customer: Optional[CustomerV2] = None
    ) -> Decimal:
        """
        Calculate price with tiered pricing (for Wholesale).
        Uses Decimal for precision.
        """
        if business_type != "wholesale":
            return Decimal(str(variant.price))
        
        # Check price tiers
        if variant.price_tiers:
            for tier in sorted(variant.price_tiers, key=lambda t: t.min_quantity, reverse=True):
                if quantity >= Decimal(str(tier.min_quantity)):
                    return Decimal(str(tier.price))
        
        return Decimal(str(variant.price))
    
    @staticmethod
    def should_print_kitchen_ticket(
        business_type: str,
        tenant_config: Optional[Dict] = None
    ) -> bool:
        """
        Check if kitchen ticket should be printed.
        """
        if business_type in ["horeca", "cafe", "kitchen"]:
            tenant_config = tenant_config or {}
            return tenant_config.get("print_kitchen_ticket", True)
        return False
    
    @staticmethod
    def should_auto_deduct_recipe(
        business_type: str,
        product: ProductV2
    ) -> bool:
        """
        Check if recipe ingredients should be auto-deducted (Kitchen).
        """
        if business_type == "kitchen":
            metadata = product.product_metadata or {}
            return metadata.get("auto_deduct", False) and product.recipe is not None
        return False


# Global instance
business_logic = BusinessLogicService()
