-- ============================================================================
-- SAVDOGAR - TO'LIQ DATABASE SETUP
-- ============================================================================
-- Bu script Supabase SQL Editor da ishga tushiring
-- Barcha kerakli jadvallarni yaratadi
-- ============================================================================

-- ============================================================================
-- 1. TENANTS (Tashkilotlar)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50) NOT NULL DEFAULT 'retail',
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    logo_url TEXT,
    config JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'trial',
    max_users INTEGER DEFAULT 5,
    max_branches INTEGER DEFAULT 1,
    min_margin_percent FLOAT DEFAULT 5.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. USERS (Foydalanuvchilar)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    organization_id INTEGER,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    full_name VARCHAR(255),
    phone_number VARCHAR(50),
    role VARCHAR(50) DEFAULT 'cashier',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- 3. CATEGORIES (Kategoriyalar)
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER,
    tenant_id INTEGER REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES categories(id),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);

-- ============================================================================
-- 4. PRODUCTS_V2 (Mahsulotlar - Yangi versiya)
-- ============================================================================
CREATE TABLE IF NOT EXISTS products_v2 (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    category_id INTEGER REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'simple' NOT NULL,
    base_price FLOAT DEFAULT 0.0,
    cost_price FLOAT DEFAULT 0.0,
    tax_rate FLOAT DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    recipe JSONB DEFAULT '{}',
    service_duration_hours FLOAT,
    service_category VARCHAR(100),
    linked_product_ids INTEGER[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_v2_tenant ON products_v2(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_v2_name ON products_v2(name);
CREATE INDEX IF NOT EXISTS idx_products_v2_tenant_active ON products_v2(tenant_id, is_active);

-- ============================================================================
-- 5. PRODUCT_VARIANTS (Mahsulot variantlari)
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products_v2(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    sku VARCHAR(255) NOT NULL,
    price FLOAT NOT NULL DEFAULT 0.0,
    cost_price FLOAT DEFAULT 0.0,
    stock_quantity FLOAT DEFAULT 0.0,
    min_stock_level FLOAT DEFAULT 0.0,
    max_stock_level FLOAT,
    primary_unit VARCHAR(50) DEFAULT 'piece',
    secondary_unit VARCHAR(50),
    unit_conversion_factor FLOAT,
    requires_serial_number BOOLEAN DEFAULT FALSE,
    is_serialized BOOLEAN DEFAULT FALSE,
    expiry_date DATE,
    batch_number VARCHAR(100),
    attributes JSONB DEFAULT '{}',
    barcode_aliases TEXT[] DEFAULT '{}',
    velocity_score FLOAT DEFAULT 0.0,
    embedding_vector FLOAT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_tenant ON product_variants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
CREATE UNIQUE INDEX IF NOT EXISTS idx_variants_tenant_sku ON product_variants(tenant_id, sku);
CREATE INDEX IF NOT EXISTS idx_variants_expiry ON product_variants(expiry_date);
CREATE INDEX IF NOT EXISTS idx_variants_attributes ON product_variants USING GIN(attributes);
CREATE INDEX IF NOT EXISTS idx_variants_barcodes ON product_variants USING GIN(barcode_aliases);

-- ============================================================================
-- 6. PRICE_TIERS (Narx darajalari - Optom uchun)
-- ============================================================================
CREATE TABLE IF NOT EXISTS price_tiers (
    id SERIAL PRIMARY KEY,
    variant_id INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    tier_type VARCHAR(50) DEFAULT 'quantity',
    min_quantity FLOAT DEFAULT 1,
    max_quantity FLOAT,
    price FLOAT NOT NULL,
    customer_group VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_price_tiers_variant ON price_tiers(variant_id);

-- ============================================================================
-- 7. CUSTOMERS_V2 (Mijozlar)
-- ============================================================================
CREATE TABLE IF NOT EXISTS customers_v2 (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    price_tier VARCHAR(50) DEFAULT 'retail',
    balance FLOAT DEFAULT 0.0,
    credit_limit FLOAT DEFAULT 0.0,
    max_debt_allowed FLOAT DEFAULT 0.0,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_v2_tenant ON customers_v2(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_v2_phone ON customers_v2(phone);

-- ============================================================================
-- 8. SALES_V2 (Sotuvlar)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales_v2 (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    cashier_id INTEGER REFERENCES users(id),
    customer_id INTEGER REFERENCES customers_v2(id),
    branch_id INTEGER,
    shift_id INTEGER,
    receipt_number VARCHAR(100),
    total_amount FLOAT NOT NULL DEFAULT 0.0,
    subtotal FLOAT DEFAULT 0.0,
    tax_amount FLOAT DEFAULT 0.0,
    discount_amount FLOAT DEFAULT 0.0,
    service_charge FLOAT DEFAULT 0.0,
    payment_method VARCHAR(50) DEFAULT 'cash',
    status VARCHAR(50) DEFAULT 'completed',
    is_debt BOOLEAN DEFAULT FALSE,
    debt_amount FLOAT DEFAULT 0.0,
    notes TEXT,
    sale_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_v2_tenant ON sales_v2(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_v2_created ON sales_v2(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_v2_customer ON sales_v2(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_v2_cashier ON sales_v2(cashier_id);

-- ============================================================================
-- 9. SALE_ITEMS_V2 (Sotuv elementlari)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sale_items_v2 (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales_v2(id) ON DELETE CASCADE,
    variant_id INTEGER NOT NULL REFERENCES product_variants(id),
    quantity FLOAT NOT NULL DEFAULT 1,
    unit_price FLOAT NOT NULL DEFAULT 0.0,
    cost_price FLOAT DEFAULT 0.0,
    total FLOAT NOT NULL DEFAULT 0.0,
    discount_percent FLOAT DEFAULT 0.0,
    discount_amount FLOAT DEFAULT 0.0,
    tax_rate FLOAT DEFAULT 0.0,
    tax_amount FLOAT DEFAULT 0.0,
    notes TEXT,
    item_metadata JSONB DEFAULT '{}',
    serial_number_id INTEGER,
    is_service_item BOOLEAN DEFAULT FALSE,
    linked_sale_item_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items_v2(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_variant ON sale_items_v2(variant_id);

-- ============================================================================
-- 10. CUSTOMER_LEDGER (Qarz daftari)
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_ledger (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers_v2(id),
    sale_id INTEGER REFERENCES sales_v2(id),
    debit FLOAT DEFAULT 0.0,
    credit FLOAT DEFAULT 0.0,
    balance_after FLOAT DEFAULT 0.0,
    description TEXT,
    reference_number VARCHAR(100),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ledger_customer ON customer_ledger(customer_id);

-- ============================================================================
-- 11. SHIFTS (Smenalar / Z-Report)
-- ============================================================================
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    cashier_id INTEGER NOT NULL REFERENCES users(id),
    branch_id INTEGER,
    status VARCHAR(20) DEFAULT 'open',
    opening_cash FLOAT DEFAULT 0.0,
    closing_cash FLOAT,
    expected_cash FLOAT,
    cash_difference FLOAT,
    total_sales FLOAT DEFAULT 0.0,
    total_transactions INTEGER DEFAULT 0,
    cash_sales FLOAT DEFAULT 0.0,
    card_sales FLOAT DEFAULT 0.0,
    debt_sales FLOAT DEFAULT 0.0,
    refunds FLOAT DEFAULT 0.0,
    cash_in FLOAT DEFAULT 0.0,
    cash_out FLOAT DEFAULT 0.0,
    notes TEXT,
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shifts_tenant ON shifts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shifts_cashier ON shifts(cashier_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);

-- ============================================================================
-- 12. CASH_MOVEMENTS (Kassa harakatlari)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cash_movements (
    id SERIAL PRIMARY KEY,
    shift_id INTEGER NOT NULL REFERENCES shifts(id),
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    movement_type VARCHAR(20) NOT NULL,
    amount FLOAT NOT NULL,
    reason TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cash_movements_shift ON cash_movements(shift_id);

-- ============================================================================
-- 13. MODIFIER_GROUPS (Modifikator guruhlari - Cafe uchun)
-- ============================================================================
CREATE TABLE IF NOT EXISTS modifier_groups (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    is_required BOOLEAN DEFAULT FALSE,
    min_selections INTEGER DEFAULT 0,
    max_selections INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_modifier_groups_tenant ON modifier_groups(tenant_id);

-- ============================================================================
-- 14. MODIFIER_OPTIONS (Modifikator variantlari)
-- ============================================================================
CREATE TABLE IF NOT EXISTS modifier_options (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    price_adjustment FLOAT DEFAULT 0.0,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_modifier_options_group ON modifier_options(group_id);

-- ============================================================================
-- 15. PRODUCT_MODIFIERS (Mahsulot-Modifikator bog'lanishi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_modifiers (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products_v2(id) ON DELETE CASCADE,
    modifier_group_id INTEGER NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, modifier_group_id)
);

CREATE INDEX IF NOT EXISTS idx_product_modifiers_product ON product_modifiers(product_id);

-- ============================================================================
-- 16. SERIAL_NUMBERS (Seriya raqamlari - Plumbing/HVAC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS serial_numbers (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    variant_id INTEGER NOT NULL REFERENCES product_variants(id),
    serial_number VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'in_stock',
    maintenance_status VARCHAR(50) DEFAULT 'ok',
    is_sold BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sale_id INTEGER REFERENCES sales_v2(id),
    purchase_date DATE,
    warranty_start_date DATE,
    warranty_end_date DATE,
    warranty_duration_months INTEGER,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    customer_id INTEGER REFERENCES customers_v2(id),
    notes TEXT,
    serial_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_serial_numbers_tenant ON serial_numbers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_variant ON serial_numbers(variant_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_serial ON serial_numbers(serial_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_serial_numbers_unique ON serial_numbers(tenant_id, variant_id, serial_number);

-- ============================================================================
-- 17. WARRANTIES (Kafolatlar)
-- ============================================================================
CREATE TABLE IF NOT EXISTS warranties (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    serial_number_id INTEGER REFERENCES serial_numbers(id),
    customer_id INTEGER REFERENCES customers_v2(id),
    product_variant_id INTEGER REFERENCES product_variants(id),
    warranty_type VARCHAR(50) DEFAULT 'standard',
    status VARCHAR(50) DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_months INTEGER,
    terms TEXT,
    warranty_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_warranties_tenant ON warranties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_warranties_serial ON warranties(serial_number_id);
CREATE INDEX IF NOT EXISTS idx_warranties_customer ON warranties(customer_id);

-- ============================================================================
-- 18. PRODUCT_BUNDLES (Mahsulot to'plamlari)
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_bundles (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products_v2(id) ON DELETE CASCADE,
    component_variant_id INTEGER NOT NULL REFERENCES product_variants(id),
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    quantity FLOAT DEFAULT 1.0,
    price_override FLOAT,
    is_required BOOLEAN DEFAULT TRUE,
    sequence INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bundles_product ON product_bundles(product_id);

-- ============================================================================
-- 19. GLOBAL_CATALOG (Global mahsulot katalogi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS global_catalog (
    id SERIAL PRIMARY KEY,
    barcode VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    category VARCHAR(255),
    brand VARCHAR(255),
    description TEXT,
    image_url TEXT,
    unit VARCHAR(50) DEFAULT 'piece',
    metadata JSONB DEFAULT '{}',
    contribution_count INTEGER DEFAULT 1,
    last_contributed_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_global_catalog_barcode ON global_catalog(barcode);
CREATE INDEX IF NOT EXISTS idx_global_catalog_name ON global_catalog(name);

-- ============================================================================
-- 20. AUDIT_LOGS (Audit loglari)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INTEGER,
    old_value JSONB,
    new_value JSONB,
    severity VARCHAR(20) DEFAULT 'info',
    category VARCHAR(50),
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================================
-- RLS (Row Level Security) - Ixtiyoriy
-- Hozircha o'chirilgan - Backend orqali nazorat qilinadi
-- ============================================================================
-- ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products_v2 ENABLE ROW LEVEL SECURITY;
-- (va hokazo)

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Global catalog qidirish funksiyasi
CREATE OR REPLACE FUNCTION search_global_catalog(search_barcode TEXT)
RETURNS TABLE (
    id INTEGER,
    barcode VARCHAR,
    name VARCHAR,
    category VARCHAR,
    brand VARCHAR,
    image_url TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.barcode,
        g.name,
        g.category,
        g.brand,
        g.image_url,
        g.description
    FROM global_catalog g
    WHERE g.barcode = search_barcode;
END;
$$ LANGUAGE plpgsql;

-- Global catalog ga qo'shish/yangilash funksiyasi
CREATE OR REPLACE FUNCTION contribute_to_global_catalog(
    p_barcode TEXT,
    p_name TEXT,
    p_category TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
    existing_id INTEGER;
BEGIN
    -- Mavjud yozuvni tekshirish
    SELECT id INTO existing_id FROM global_catalog WHERE barcode = p_barcode;
    
    IF existing_id IS NOT NULL THEN
        -- Mavjud bo'lsa, yangilash
        UPDATE global_catalog
        SET 
            name = COALESCE(p_name, name),
            category = COALESCE(p_category, category),
            image_url = COALESCE(p_image_url, image_url),
            description = COALESCE(p_description, description),
            contribution_count = contribution_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = existing_id;
        
        result := jsonb_build_object('status', 'updated', 'id', existing_id);
    ELSE
        -- Yangi yozuv qo'shish
        INSERT INTO global_catalog (barcode, name, category, image_url, description)
        VALUES (p_barcode, p_name, p_category, p_image_url, p_description)
        RETURNING id INTO existing_id;
        
        result := jsonb_build_object('status', 'created', 'id', existing_id);
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'Database setup completed successfully!' as message;
