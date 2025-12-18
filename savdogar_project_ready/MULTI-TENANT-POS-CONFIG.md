# Multi-Tenant POS System - To'liq Konfiguratsiya

## 🎯 Maqsad
4 turdagi faoliyat uchun yagona, flexible va high-performance POS tizimi:
- **Retail** (Chakana savdo - Grocery)
- **Fashion** (Kiyim-kechak)
- **Horeca** (Kafe/Restoran)
- **Wholesale** (Optovaya - B2B)

---

## 📊 Database Schema

### 1. Tenants (Multi-Tenant Isolation)
```sql
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    business_type ENUM('retail', 'fashion', 'horeca', 'wholesale'),
    config JSONB,  -- Industry-specific settings
    ...
);
```

**Config misollari:**
- **Retail:** `{"allow_negative_stock": true, "require_barcode": false}`
- **Fashion:** `{"size_chart": {...}, "color_variants": true}`
- **Horeca:** `{"print_kitchen_ticket": true, "table_service": true}`
- **Wholesale:** `{"min_order_quantity": 10, "credit_limit": 10000}`

### 2. Polymorphic Product System

#### Products (Asosiy mahsulot)
- `type`: ENUM('simple', 'variable', 'composite')
- `base_price`: Default narx
- `metadata`: JSONB (flexible ma'lumotlar)

#### ProductVariants (Haqiqiy sotiladigan SKU)
- `sku`: Unique per tenant
- `price`: Variant narxi (base_price ni override)
- `attributes`: **JSONB** (muhim!)
  - Fashion: `{"size": "XL", "color": "Red", "fabric": "Cotton"}`
  - Grocery: `{"expiry_date": "2025-12-01", "weight": "500g"}`
  - Horeca: `{"portion": "large", "spice_level": "medium"}`
  - Wholesale: `{"pack_size": 50, "inner_sku": "ITEM-001"}`
- `barcode_aliases`: Text[] (bir nechta barcode)

**Indexes:**
- GIN index `attributes` (JSONB) uchun
- GIN index `barcode_aliases` (Array) uchun
- Unique index `(tenant_id, sku)`

### 3. Wholesale Pricing

#### PriceTiers
- `variant_id` → ProductVariant
- `min_quantity`: Minimal miqdor
- `max_quantity`: Maksimal miqdor (NULL = cheksiz)
- `price`: Narx
- `tier_type`: ENUM('retail', 'vip', 'wholesaler', 'bulk')
- `customer_group`: String (optional)

**Misol:**
```python
# 1-9 dona: $10
# 10-49 dona: $8 (wholesale)
# 50+ dona: $6 (bulk)
```

### 4. Customer & Debt Management

#### Customers V2
- `price_tier`: ENUM('retail', 'vip', 'wholesaler')
- `balance`: Decimal
  - Positive = Credit (mijozda pul bor)
  - Negative = Debt (mijoz qarzdor)
- `credit_limit`: Maksimal qarz miqdori
- `max_debt_allowed`: Ruxsat etilgan qarz

#### CustomerLedger
- `debit`: Qarz (mijoz qarzdor bo'ldi)
- `credit`: To'lov (mijoz to'ladi)
- `balance_after`: Tranzaksiyadan keyingi balance

### 5. Sales V2

#### Sales
- `tenant_id`: Multi-tenant isolation
- `customer_id`: Mijoz
- `payment_method`: ENUM(..., 'debt')
- `is_debt`: Boolean
- `debt_amount`: Qarz miqdori

#### SaleItems
- `variant_id`: ProductVariant (product_id emas!)
- `quantity`, `unit_price`, `total`
- `discount_percent`, `discount_amount`
- `tax_rate`, `tax_amount`

---

## 🔧 API Endpoints

### Products

#### `POST /api/v1/v2/products`
**Body:**
```json
{
  "name": "Nike Air Max",
  "type": "variable",
  "base_price": 100.0,
  "variants": [
    {
      "sku": "NIKE-AM-XL-RED",
      "price": 100.0,
      "attributes": {"size": "XL", "color": "Red"},
      "barcode_aliases": ["1234567890123"]
    },
    {
      "sku": "NIKE-AM-L-BLUE",
      "price": 100.0,
      "attributes": {"size": "L", "color": "Blue"}
    }
  ]
}
```

**Logic:**
- Agar `type = VARIABLE` bo'lsa, variantlar avtomatik yaratiladi
- Agar `type = SIMPLE` bo'lsa, bitta variant avtomatik yaratiladi

#### `POST /api/v1/v2/products/variants/{variant_id}/price-tiers`
**Body:**
```json
{
  "tier_type": "wholesaler",
  "min_quantity": 10,
  "max_quantity": 49,
  "price": 8.0,
  "customer_group": "wholesale"
}
```

### Sales

#### `POST /api/v1/v2/sales/cart/calculate`
**Body:**
```json
{
  "items": [
    {"variant_id": 1, "quantity": 15, "discount_percent": 0}
  ],
  "customer_id": 5
}
```

**Response:**
```json
{
  "subtotal": 120.0,
  "tax_amount": 12.0,
  "discount_amount": 0.0,
  "total": 132.0,
  "items": [...],
  "applied_price_tiers": [
    {
      "variant_id": 1,
      "tier_id": 2,
      "tier_type": "wholesaler",
      "min_quantity": 10,
      "price": 8.0
    }
  ]
}
```

**Logic:**
1. Har bir variant uchun PriceTier ni tekshiradi
2. Miqdor va mijoz darajasiga qarab eng yaxshi narxni tanlaydi
3. Chegirma va soliqni hisoblaydi

#### `POST /api/v1/v2/sales/checkout`
**Body:**
```json
{
  "items": [
    {"variant_id": 1, "quantity": 15}
  ],
  "customer_id": 5,
  "payment_method": "debt",
  "debt_amount": 132.0
}
```

**Logic (ACID Transaction):**
1. Ombor tekshirish
2. Narx hisoblash (PriceTiers)
3. Omborni yangilash (`stock_quantity -= quantity`)
4. Sale va SaleItems yaratish
5. Agar `payment_method = DEBT`:
   - Qarz limitini tekshirish
   - CustomerLedger ga yozuv qo'shish
   - Customer balance ni yangilash

**Validation:**
- Qarz limiti: `abs(new_balance) <= max_debt_allowed`
- Ombor: `stock_quantity >= quantity`

### Customers

#### `POST /api/v1/v2/customers`
**Body:**
```json
{
  "name": "ABC Wholesale",
  "price_tier": "wholesaler",
  "credit_limit": 10000.0,
  "max_debt_allowed": 5000.0
}
```

#### `GET /api/v1/v2/customers/{customer_id}/ledger`
Qarz kitobini olish

---

## 💻 Code Examples

### Product Yaratish (Fashion)
```python
product = {
    "name": "Nike T-Shirt",
    "type": "variable",
    "base_price": 50.0,
    "variants": [
        {
            "sku": "NIKE-TS-XL-RED",
            "price": 50.0,
            "attributes": {
                "size": "XL",
                "color": "Red",
                "fabric": "Cotton"
            },
            "barcode_aliases": ["1234567890123"]
        }
    ]
}
```

### Product Yaratish (Grocery)
```python
product = {
    "name": "Coca-Cola",
    "type": "variable",
    "base_price": 2.0,
    "variants": [
        {
            "sku": "COKE-500ML",
            "price": 2.0,
            "attributes": {
                "weight": "500ml",
                "expiry_date": "2025-12-01",
                "batch": "BATCH-123"
            }
        }
    ]
}
```

### Wholesale Pricing
```python
# Variant uchun narx darajalari
price_tiers = [
    {
        "min_quantity": 1,
        "max_quantity": 9,
        "price": 10.0,
        "tier_type": "retail"
    },
    {
        "min_quantity": 10,
        "max_quantity": 49,
        "price": 8.0,
        "tier_type": "wholesaler"
    },
    {
        "min_quantity": 50,
        "max_quantity": None,  # Cheksiz
        "price": 6.0,
        "tier_type": "bulk"
    }
]
```

### Checkout (Qarz bilan)
```python
checkout = {
    "items": [
        {"variant_id": 1, "quantity": 15}
    ],
    "customer_id": 5,
    "payment_method": "debt",
    "debt_amount": 120.0
}

# Natija:
# - Ombor yangilandi
# - Sale yaratildi
# - CustomerLedger ga yozuv qo'shildi
# - Customer balance: -120.0 (qarzdor)
```

---

## 🔐 Security & Performance

### Indexes
- `idx_variants_tenant_sku` (UNIQUE) - Tez qidirish
- `idx_variants_attributes` (GIN) - JSONB qidirish
- `idx_variants_barcodes` (GIN) - Array qidirish
- `idx_price_tiers_variant_quantity` - Narx tekshirish

### ACID Transactions
- Checkout da barcha operatsiyalar transaction ichida
- Ombor va qarz boshqaruvi bir vaqtda

### Concurrency
- Database-level locking
- Optimistic locking variantlar uchun

---

## 📝 Migration

Migration fayl yaratildi: `69ac33912f1c_add_multi_tenant_pos_system.py`

Ishga tushirish:
```bash
cd /home/ali/dokon/backend
source venv/bin/activate
alembic upgrade head
```

---

## 🚀 Keyingi Qadamlar

1. Migration ni ishga tushirish
2. Test data yaratish
3. Frontend integratsiyasi
4. Performance testing








