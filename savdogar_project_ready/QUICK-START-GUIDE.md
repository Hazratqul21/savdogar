# Multi-Tenant POS System - Quick Start Guide

## 🚀 Tez Boshlash

### 1. Migration ni Ishga Tushirish

```bash
cd /home/ali/dokon/backend
source venv/bin/activate
alembic upgrade head
```

### 2. Tenant Yaratish

```bash
# API orqali
curl -X POST http://localhost:8000/api/v1/v2/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "My Fashion Store",
    "business_type": "fashion",
    "config": {
      "size_chart": {"S": 36, "M": 38, "L": 40},
      "color_variants": true
    }
  }'
```

### 3. Product Yaratish (Fashion - Variable)

```bash
curl -X POST http://localhost:8000/api/v1/v2/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Nike T-Shirt",
    "type": "variable",
    "base_price": 50.0,
    "variants": [
      {
        "sku": "NIKE-TS-XL-RED",
        "price": 50.0,
        "stock_quantity": 100,
        "attributes": {
          "size": "XL",
          "color": "Red",
          "fabric": "Cotton"
        },
        "barcode_aliases": ["1234567890123"]
      },
      {
        "sku": "NIKE-TS-L-BLUE",
        "price": 50.0,
        "stock_quantity": 50,
        "attributes": {
          "size": "L",
          "color": "Blue"
        }
      }
    ]
  }'
```

### 4. Wholesale Pricing Qo'shish

```bash
curl -X POST http://localhost:8000/api/v1/v2/products/variants/1/price-tiers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tier_type": "wholesaler",
    "min_quantity": 10,
    "max_quantity": 49,
    "price": 40.0,
    "customer_group": "wholesale"
  }'
```

### 5. Mijoz Yaratish (Wholesale)

```bash
curl -X POST http://localhost:8000/api/v1/v2/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "ABC Wholesale",
    "phone": "+998901234567",
    "price_tier": "wholesaler",
    "credit_limit": 10000.0,
    "max_debt_allowed": 5000.0
  }'
```

### 6. Savatcha Hisoblash

```bash
curl -X POST http://localhost:8000/api/v1/v2/sales/cart/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [
      {"variant_id": 1, "quantity": 15}
    ],
    "customer_id": 1
  }'
```

**Natija:**
- 15 dona uchun wholesale narx qo'llanadi (10+ dona)
- `applied_price_tiers` da qo'llangan narx ko'rsatiladi

### 7. Checkout (Qarz bilan)

```bash
curl -X POST http://localhost:8000/api/v1/v2/sales/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [
      {"variant_id": 1, "quantity": 15}
    ],
    "customer_id": 1,
    "payment_method": "debt",
    "debt_amount": 600.0
  }'
```

**Natija:**
- Ombor yangilandi
- Sale yaratildi
- CustomerLedger ga yozuv qo'shildi
- Customer balance yangilandi

---

## 📋 Asosiy Prinsiplar

### 1. Polymorphic Products
- Bitta `products_v2` jadvali barcha turdagi mahsulotlar uchun
- `type` field: simple, variable, composite
- `attributes` JSONB: Flexible ma'lumotlar

### 2. Variant-Based System
- Har bir variant o'z SKU, narxi va omboriga ega
- Variantlar `attributes` orqali farqlanadi

### 3. Dynamic Pricing
- PriceTiers miqdor va mijoz darajasiga qarab narxni o'zgartiradi
- Auto-wholesale: Miqdor katta bo'lsa, avtomatik wholesale narx

### 4. Debt Management
- Customer balance: Positive = Credit, Negative = Debt
- CustomerLedger: Barcha qarz/pul o'tkazishlar
- Qarz limiti: `max_debt_allowed`

### 5. ACID Transactions
- Checkout da barcha operatsiyalar transaction ichida
- Ombor va qarz bir vaqtda yangilanadi

---

## 🔍 Test Qilish

### 1. Migration Test
```bash
cd /home/ali/dokon/backend
source venv/bin/activate
alembic current  # Hozirgi versiya
alembic upgrade head  # Migration qilish
```

### 2. API Test
```bash
# Health check
curl http://localhost:8000/health

# Products list
curl http://localhost:8000/api/v1/v2/products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📚 Batafsil Ma'lumot

- **Database Struktura:** `/home/ali/dokon/DATABASE-STRUKTURA.md`
- **Multi-Tenant Config:** `/home/ali/dokon/MULTI-TENANT-POS-CONFIG.md`
- **API Docs:** http://localhost:8000/docs








