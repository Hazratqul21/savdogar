# Business Logic Implementation Guide

## Overview

This document describes the industry-specific business logic for each of the 9 supported business types in Savdo-Gar POS system.

## Architecture

- **Centralized Logic**: `app/services/business_logic.py` - Single service layer for all business rules
- **Metadata Storage**: JSONB columns in `products_v2`, `sales_v2`, and `sale_items_v2` tables
- **No Separate Tables**: Industry-specific fields stored in metadata, not separate tables

---

## Business Types & Their Logic

### 1. 🛒 RETAIL (Chakana Savdo)

**Focus:** Extreme Speed

**Key Features:**
- **Quick Keys**: Non-barcoded items (Bread, Bags) have quick key shortcuts
- **No Popups**: Scan → Beep → Add. No variant selection unless absolutely necessary
- **Optimistic UI**: Items appear in cart immediately

**Metadata Structure:**
```json
{
  "quick_key": "F1",
  "allow_negative_stock": true,
  "require_barcode": false
}
```

**Workflow:**
1. Scan barcode → Add to cart immediately
2. Quick key press → Add item (no popup)
3. Enter → Pay

---

### 2. 👗 FASHION (Kiyim-kechak)

**Focus:** Matrix Inventory (Size × Color)

**Key Features:**
- **Variant Selection Required**: When selecting a T-Shirt, DO NOT add immediately
- **2D Grid UI**: Rows (S, M, L) × Cols (Red, Blue)
- **Strict Return Policy**: Return deadline tracking in metadata

**Metadata Structure:**
```json
{
  "size_chart": {"S": 36, "M": 38, "L": 40},
  "color_variants": true,
  "return_policy_days": 14
}
```

**Workflow:**
1. Select product → Show 2D matrix
2. Click cell (e.g., "M × Red") → Add to cart
3. Return tracking: Store size/color in `sale_items_v2.metadata`

---

### 3. 🍽️ HORECA & ☕ CAFE (Restaurant/Cafe)

**Focus:** Table Management & Modifiers

**Key Features:**
- **Park Order**: Hold orders assigned to Table Number
- **Modifiers**: Coffee → [Sugar: None, 1, 2] → [Milk: Soy, Regular]
- **Kitchen Ticket**: Auto-print on "Send to Kitchen"

**Metadata Structure:**
```json
{
  "print_kitchen_ticket": true,
  "table_service": true,
  "modifiers": {
    "sugar": ["none", "1", "2"],
    "milk": ["soy", "regular"]
  }
}
```

**Sale Metadata:**
```json
{
  "table_number": 5,
  "parked": false,
  "kitchen_ticket_printed": true
}
```

**Sale Item Metadata:**
```json
{
  "modifiers": {"sugar": "2", "milk": "soy"},
  "special_instructions": "no onions"
}
```

---

### 4. 💍 JEWELRY (Accessories & Bijouterie)

**Context:** NOT high-end gold/diamonds. Hair clips, brooches, cheap accessories.

**Key Features:**
- **NO Mandatory Serial Numbers**: Removed to speed up sales
- **Visual Heavy**: Large thumbnails in search (names like "Hairclip A1" are confusing)
- **Bundle Focus**: "Wedding Hair Set" bundles

**Metadata Structure:**
```json
{
  "visual_thumbnail_url": "https://...",
  "bundle_components": [123, 124, 125],
  "bundle_focus": true
}
```

**Workflow:**
1. Search → Show large thumbnails
2. Click → Add (or show variant grid if variable)
3. Bundle products auto-pull components

---

### 5. 📦 WHOLESALE (B2B)

**Focus:** Volume & Credit

**Key Features:**
- **Tiered Pricing**: Price A (1-10 qty), Price B (10-100 qty)
- **Credit Limit**: Prevent sale if Customer Balance > Limit
- **Packing**: Sell in "Master Cartons" but track inventory in "Units"

**Metadata Structure:**
```json
{
  "min_order_quantity": 10,
  "credit_limit": 10000,
  "tiered_pricing": true,
  "pack_type": "carton"
}
```

**Sale Metadata:**
```json
{
  "credit_approved": true,
  "tier_used": "B"
}
```

**Workflow:**
1. Select customer (MANDATORY)
2. Add items → Auto-apply price tier based on quantity
3. Check credit limit before checkout
4. Pack quantity conversion (cartons → units)

---

### 6. 🍳 KITCHEN (Ghost Kitchen/Production)

**Focus:** Recipe Costing

**Key Features:**
- **Auto-Deduct Ingredients**: Selling "Burger" deducts 1 Bun, 1 Meat, 1 Cheese
- **Recipe Tracking**: Store recipe in `products_v2.recipe` JSONB

**Metadata Structure:**
```json
{
  "recipe": {
    "ingredients": [
      {"id": 101, "name": "Bun", "qty": 1},
      {"id": 102, "name": "Meat", "qty": 1},
      {"id": 103, "name": "Cheese", "qty": 1}
    ]
  },
  "auto_deduct": true
}
```

**Sale Item Metadata:**
```json
{
  "recipe_applied": true,
  "ingredients_deducted": {
    "101": 1,
    "102": 1,
    "103": 1
  }
}
```

**Workflow:**
1. Sell "Burger" → Auto-deduct ingredients from stock
2. Track in `sale_items_v2.metadata`

---

### 7. 🔧 PLUMBING_HVAC (Sanitary & Construction)

**Focus:** Warranties & Bundles

**Key Features:**
- **Product Bundles**: "Boiler Kit" auto-pulls pipes, valves, boiler
- **Warranty Cards**: Print specific warranty card with receipt
- **Serial Numbers**: Optional. Only required for big machines (Boilers), NOT for pipes

**Metadata Structure:**
```json
{
  "warranty_months": 12,
  "bundle_auto_pull": true,
  "serial_required": false  // Only true for boilers
}
```

**Workflow:**
1. Sell bundle → Auto-pull components from stock
2. Print warranty card (if configured)
3. Serial number only for expensive items

---

### 8. 🚬 TOBACCO (Licensed Shop) - NEW

**Focus:** Compliance & Multi-Unit Conversion

**Key Features:**

#### A. Multi-Unit Conversion (The "Block" Problem)
- **Parent-Child Relationship**: Products have unit hierarchy
- **Buying**: 1 Master Case = 50 Blocks
- **Selling (Wholesale)**: Sold as Blocks (10 packs)
- **Selling (Retail)**: Sold as Packs (1 pack)
- **Conversion Logic**: Opening a Block decreases Block stock by 1, increases Pack stock by 10

**Product Metadata:**
```json
{
  "parent_product_id": null,  // null for top-level (Master Case)
  "unit_type": "pack",  // "pack", "block", "master_case"
  "conversion_chain": {
    "block_to_pack": 10,
    "master_case_to_block": 50
  },
  "mgc_price": 50000  // Minimum Government Price
}
```

#### B. Age Verification (Compliance)
- **Toggle in Settings**: "Enforce Age Check"
- **Before Payment**: Show popup "Is customer 20+ years old?" (Yes/No)
- **Keyboard Shortcuts**: Enter = Yes, Esc = Cancel

**Sale Metadata:**
```json
{
  "age_verified": true,
  "age_verified_by": 5,  // User ID
  "age_verified_at": "2025-01-01T12:00:00Z",
  "mgc_compliant": true,
  "license_valid": true
}
```

#### C. License Tracking
- **Tenant Settings**: "Tobacco License Expiry Date"
- **Dashboard Warning**: Show if expiry within 30 days

**Tenant Config:**
```json
{
  "enforce_age_check": true,
  "license_expiry": "2025-12-31",
  "mgc_enabled": true,
  "mgc_prices": {
    "product_123": 50000
  }
}
```

#### D. MGC (Minimum Government Price)
- **Prevent Discounting**: Cannot manually discount below state-mandated minimum
- **Validation**: Check in `business_logic.can_add_to_cart()`

**Sale Item Metadata:**
```json
{
  "unit_sold": "pack",
  "block_opened": false,
  "conversion_applied": false,
  "original_unit": "block",
  "converted_quantity": 10
}
```

**Workflow:**
1. Add tobacco product → Check MGC compliance
2. Before payment → Age verification modal
3. Check license expiry (dashboard warning)
4. Process sale → Store age verification in metadata

---

## Implementation Details

### Backend

**Files:**
- `app/services/business_logic.py` - Central business logic service
- `app/models/tenant.py` - BusinessType enum (includes TOBACCO)
- `app/models/product_v2.py` - Metadata JSONB column
- `app/models/sale_v2.py` - Sale and item metadata JSONB columns
- `app/api/v1/endpoints/sales_v2.py` - Checkout with business logic integration

**Key Methods:**
- `can_add_to_cart()` - Validation before adding to cart
- `requires_variant_selection()` - Check if variant selection needed
- `process_sale_metadata()` - Add business-type-specific metadata to sale
- `process_sale_item_metadata()` - Add business-type-specific metadata to item
- `requires_age_verification()` - Tobacco age check
- `check_license_expiry()` - Tobacco license validation
- `apply_tobacco_unit_conversion()` - Multi-unit conversion logic

### Frontend

**Files:**
- `frontend/src/stores/pos-state.ts` - BusinessType includes 'tobacco'
- `frontend/src/components/pos/PosLayout.tsx` - Routes to appropriate view
- `frontend/src/components/pos/AgeVerificationModal.tsx` - Tobacco age verification
- `frontend/src/hooks/useCheckout.ts` - Checkout with business logic

**Key Components:**
- Age Verification Modal (Tobacco)
- Variant Selection Matrix (Fashion/Jewelry)
- Modifier Selection (Horeca/Cafe)
- Price Tier Display (Wholesale)

---

## Database Migration

Run migration to add TOBACCO business type and metadata columns:

```bash
cd backend
alembic upgrade head
```

Migration file: `alembic/versions/add_tobacco_business_type.py`

---

## Testing Checklist

### Retail
- [ ] Quick key shortcuts work
- [ ] No popups for simple items
- [ ] Optimistic UI updates

### Fashion
- [ ] 2D matrix shows on variable products
- [ ] Return policy metadata stored

### Horeca/Cafe
- [ ] Table number stored
- [ ] Modifiers saved in metadata
- [ ] Kitchen ticket triggers

### Wholesale
- [ ] Price tiers applied
- [ ] Credit limit enforced
- [ ] Pack quantity conversion

### Tobacco
- [ ] Age verification modal shows
- [ ] MGC price validation
- [ ] License expiry warning
- [ ] Unit conversion (Block → Packs)

### Kitchen
- [ ] Recipe ingredients auto-deducted
- [ ] Metadata tracks deductions

### Plumbing/HVAC
- [ ] Bundle auto-pull works
- [ ] Warranty cards print
- [ ] Serial numbers optional

---

## Future Enhancements

1. **Fashion Return Policy**: Automated return deadline calculation
2. **Tobacco Unit Conversion UI**: Visual interface for opening blocks
3. **Kitchen Recipe Editor**: Visual recipe builder
4. **Wholesale Credit Dashboard**: Credit limit monitoring

---

## Notes

- All currency calculations use `Decimal` for precision
- All critical operations use database transactions (ACID)
- Metadata is flexible - can add new fields without migrations
- Business logic is centralized - easy to maintain and test
