# Database Struktura Tekshiruvi

## ✅ Tekshiruv Natijalari

### 1. **Attributes ustuni JSONB qilinganmi?**

**Javob: ✅ HA**

**Kod:**
```python
# backend/app/models/product_v2.py, 83-qator
attributes = Column(JSONB, nullable=True, default={})
```

**Migration:**
```python
# backend/alembic/versions/69ac33912f1c_add_multi_tenant_pos_system.py, 84-qator
sa.Column('attributes', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
```

**Index:**
```python
# GIN index JSONB uchun
Index('idx_variants_attributes', 'attributes', postgresql_using='gin')
```

**Ishlatish misollari:**
- Fashion: `{"size": "XL", "color": "Red", "fabric": "Cotton"}`
- Grocery: `{"expiry_date": "2025-12-01", "weight": "500g"}`
- Wholesale: `{"pack_size": 50, "inner_sku": "ITEM-001"}`

---

### 2. **Product va ProductVariant alohida ajratilganmi?**

**Javob: ✅ HA**

**Struktura:**

#### Product (products_v2)
```python
# backend/app/models/product_v2.py, 14-53 qatorlar
class Product(Base):
    __tablename__ = "products_v2"
    
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    name = Column(String, nullable=False)
    type = Column(Enum(ProductType))  # simple, variable, composite
    base_price = Column(Float)
    product_metadata = Column("metadata", JSONB)  # Product-level metadata
    
    # Relationship
    variants = relationship("ProductVariant", back_populates="product")
```

#### ProductVariant (product_variants)
```python
# backend/app/models/product_v2.py, 55-103 qatorlar
class ProductVariant(Base):
    __tablename__ = "product_variants"
    
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products_v2.id"))  # ← Product ga bog'langan
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    sku = Column(String, nullable=False)  # Unique per tenant
    price = Column(Float)  # Override base_price
    stock_quantity = Column(Float)
    attributes = Column(JSONB)  # Variant-level attributes
    barcode_aliases = Column(ARRAY(String))
    
    # Relationship
    product = relationship("Product", back_populates="variants")
```

**Alohida ajratilgan sabablar:**
- ✅ **Product** = Asosiy mahsulot (Nike T-Shirt)
- ✅ **ProductVariant** = Haqiqiy sotiladigan SKU (XL-Red, L-Blue)
- ✅ Bir Product ko'p Variantlarga ega bo'lishi mumkin
- ✅ Har bir Variant o'z narxi, ombori va atributlariga ega

**Foreign Key:**
```sql
product_id → products_v2.id
```

---

### 3. **barcode_aliases (Shtrix kodlar massivi) bormi?**

**Javob: ✅ HA**

**Kod:**
```python
# backend/app/models/product_v2.py, 87-qator
barcode_aliases = Column(ARRAY(String), nullable=True, default=[])
```

**Migration:**
```python
# backend/alembic/versions/69ac33912f1c_add_multi_tenant_pos_system.py, 85-qator
sa.Column('barcode_aliases', postgresql.ARRAY(sa.String()), nullable=True),
```

**Index:**
```python
# GIN index Array uchun
Index('idx_variants_barcodes', 'barcode_aliases', postgresql_using='gin')
```

**Ishlatish:**
```python
# Bir nechta barcode saqlash mumkin
variant.barcode_aliases = [
    "1234567890123",  # Manufacturer barcode
    "QR-CODE-ABC-123",  # Internal QR code
    "CUSTOM-BARCODE-001"  # Custom barcode
]
```

**Qidirish:**
```python
# Frontend: searchProductsByBarcode()
# Barcha barcode_aliases ichida qidirish
if variant.barcode_aliases?.includes(barcode):
    return variant
```

---

## 📊 Jadval Struktura

### products_v2
```
id | tenant_id | name | type | base_price | metadata (JSONB)
```

### product_variants
```
id | product_id | tenant_id | sku | price | stock_quantity | 
attributes (JSONB) | barcode_aliases (ARRAY) | is_active
```

---

## 🔍 SQL Tekshiruv

```sql
-- 1. Attributes JSONB tekshiruvi
SELECT column_name, data_type, udt_name
FROM information_schema.columns 
WHERE table_name = 'product_variants' 
AND column_name = 'attributes';
-- Natija: data_type = 'USER-DEFINED', udt_name = 'jsonb' ✅

-- 2. Alohida jadvallar tekshiruvi
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('products_v2', 'product_variants');
-- Natija: 2 ta jadval ✅

-- 3. barcode_aliases ARRAY tekshiruvi
SELECT column_name, data_type, udt_name
FROM information_schema.columns 
WHERE table_name = 'product_variants' 
AND column_name = 'barcode_aliases';
-- Natija: data_type = 'ARRAY' ✅
```

---

## ✅ Xulosa

Barcha 3 ta talab **TO'LIQ BAJARILGAN**:

1. ✅ **attributes** → JSONB (PostgreSQL JSONB type)
2. ✅ **Product va ProductVariant** → Alohida jadvallar (Foreign Key bilan bog'langan)
3. ✅ **barcode_aliases** → ARRAY(String) (PostgreSQL Array type)

**Indexlar:**
- `idx_variants_attributes` (GIN) - JSONB qidirish uchun
- `idx_variants_barcodes` (GIN) - Array qidirish uchun
- `idx_variants_tenant_sku` (UNIQUE) - SKU uniqueness uchun








