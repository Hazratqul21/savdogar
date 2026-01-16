-- ============================================================================
-- SAVDOGAR POS - TO'LIQ DATABASE MIGRATION SCRIPT
-- Supabase SQL Editor da ishga tushiring
-- ============================================================================
-- Yaratildi: 2026-01-16
-- Maqsad: Barcha jadvallarni yaratish va yangilash
-- ============================================================================

-- ============================================================================
-- 1. ENUM TYPES (Agar mavjud bo'lmasa)
-- ============================================================================

-- ProductType enum
DO $$ BEGIN
    CREATE TYPE product_type AS ENUM ('simple', 'variable', 'composite', 'service', 'bundle');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- PaymentMethod enum
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'debt', 'mixed', 'payme', 'click');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SaleStatus enum
DO $$ BEGIN
    CREATE TYPE sale_status AS ENUM ('pending', 'completed', 'cancelled', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CustomerTier enum
DO $$ BEGIN
    CREATE TYPE customer_tier AS ENUM ('retail', 'vip', 'wholesaler');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- PriceTierType enum
DO $$ BEGIN
    CREATE TYPE price_tier_type AS ENUM ('retail', 'vip', 'wholesaler', 'bulk');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- MoveState enum
DO $$ BEGIN
    CREATE TYPE move_state AS ENUM ('draft', 'confirmed', 'assigned', 'done', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- QuantStatus enum
DO $$ BEGIN
    CREATE TYPE quant_status AS ENUM ('available', 'reserved', 'in_transit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SerialNumberStatus enum
DO $$ BEGIN
    CREATE TYPE serial_number_status AS ENUM ('active', 'inactive', 'consumed', 'delivered', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- MaintenanceStatus enum
DO $$ BEGIN
    CREATE TYPE maintenance_status AS ENUM ('under_warranty', 'out_of_warranty', 'under_amc', 'out_of_amc');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- WarrantyStatus enum
DO $$ BEGIN
    CREATE TYPE warranty_status AS ENUM ('active', 'expired', 'void', 'claimed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- WarrantyType enum
DO $$ BEGIN
    CREATE TYPE warranty_type AS ENUM ('manufacturer', 'seller', 'installation', 'extended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. ASOSIY JADVALLAR
-- ============================================================================

-- Tenants jadvali (Multi-tenant tizim uchun)
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    business_type VARCHAR(50) DEFAULT 'retail' NOT NULL,
    base_currency VARCHAR DEFAULT 'UZS',
    usd_to_uzs_rate FLOAT DEFAULT 12800.0,
    min_margin_percent FLOAT DEFAULT 5.0,
    config JSONB DEFAULT '{}',
    description TEXT,
    address TEXT,
    phone VARCHAR,
    email VARCHAR,
    subscription_plan VARCHAR DEFAULT 'trial',
    trial_ends_at TIMESTAMP,
    max_users INTEGER DEFAULT 5,
    max_branches INTEGER DEFAULT 1,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_name ON tenants(name);
CREATE INDEX IF NOT EXISTS idx_tenants_business_type ON tenants(business_type);
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON tenants(is_active);
CREATE INDEX IF NOT EXISTS idx_tenants_onboarding ON tenants(onboarding_completed);

-- Organizations jadvali (Legacy support)
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    business_type VARCHAR(50) DEFAULT 'retail',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Categories jadvali
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    name VARCHAR NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);

-- Branches jadvali
CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
    name VARCHAR NOT NULL,
    address TEXT,
    phone VARCHAR,
    is_main BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_branches_tenant ON branches(tenant_id);

-- Users jadvali
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR UNIQUE NOT NULL,
    email VARCHAR UNIQUE,
    hashed_password VARCHAR NOT NULL,
    role VARCHAR(50) DEFAULT 'cashier',
    is_active BOOLEAN DEFAULT TRUE,
    full_name VARCHAR,
    phone_number VARCHAR,
    pin_code_hash VARCHAR,
    profile_image VARCHAR,
    address VARCHAR,
    birth_date DATE,
    passport_data VARCHAR,
    job_title VARCHAR,
    hired_date DATE DEFAULT CURRENT_DATE,
    user_settings JSONB DEFAULT '{}',
    organization_id INTEGER REFERENCES organizations(id),
    tenant_id INTEGER REFERENCES tenants(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- ============================================================================
-- 3. MAHSULOTLAR JADVALLARI (V2)
-- ============================================================================

-- Products V2 jadvali
CREATE TABLE IF NOT EXISTS products_v2 (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    name VARCHAR NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'simple' NOT NULL,
    base_price FLOAT DEFAULT 0.0,
    cost_price FLOAT DEFAULT 0.0,
    tax_rate FLOAT DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    recipe JSONB DEFAULT '{}',
    service_duration_hours FLOAT,
    service_category VARCHAR,
    linked_product_ids INTEGER[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_v2_tenant ON products_v2(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_v2_name ON products_v2(name);
CREATE INDEX IF NOT EXISTS idx_products_v2_tenant_active ON products_v2(tenant_id, is_active);

-- Product Variants jadvali
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products_v2(id) NOT NULL,
    tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
    sku VARCHAR NOT NULL,
    price FLOAT DEFAULT 0.0 NOT NULL,
    cost_price FLOAT DEFAULT 0.0,
    stock_quantity FLOAT DEFAULT 0.0,
    min_stock_level FLOAT DEFAULT 0.0,
    max_stock_level FLOAT,
    primary_unit VARCHAR DEFAULT 'piece' NOT NULL,
    secondary_unit VARCHAR,
    unit_conversion_factor FLOAT,
    requires_serial_number BOOLEAN DEFAULT FALSE,
    is_serialized BOOLEAN DEFAULT FALSE,
    expiry_date DATE,
    batch_number VARCHAR,
    attributes JSONB DEFAULT '{}',
    barcode_aliases VARCHAR[] DEFAULT '{}',
    velocity_score FLOAT DEFAULT 0.0,
    embedding_vector FLOAT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_variants_tenant_sku ON product_variants(tenant_id, sku);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_expiry ON product_variants(expiry_date);
CREATE INDEX IF NOT EXISTS idx_variants_serial ON product_variants(requires_serial_number);
CREATE INDEX IF NOT EXISTS idx_variants_is_active ON product_variants(is_active);

-- Product Bundles jadvali
CREATE TABLE IF NOT EXISTS product_bundles (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
    product_id INTEGER REFERENCES products_v2(id) NOT NULL,
    component_variant_id INTEGER REFERENCES product_variants(id) NOT NULL,
    quantity FLOAT DEFAULT 1.0 NOT NULL,
    price_override FLOAT,
    sequence INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_bundle_product ON product_bundles(product_id, sequence);
CREATE INDEX IF NOT EXISTS idx_bundle_tenant ON product_bundles(tenant_id);

-- Price Tiers jadvali
CREATE TABLE IF NOT EXISTS price_tiers (
    id SERIAL PRIMARY KEY,
    variant_id INTEGER REFERENCES product_variants(id) NOT NULL,
    tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
    tier_type VARCHAR(20) DEFAULT 'retail' NOT NULL,
    min_quantity FLOAT DEFAULT 1.0 NOT NULL,
    max_quantity FLOAT,
    price FLOAT NOT NULL,
    customer_group VARCHAR
);

CREATE INDEX IF NOT EXISTS idx_price_tiers_variant ON price_tiers(variant_id, min_quantity);
CREATE INDEX IF NOT EXISTS idx_price_tiers_tenant ON price_tiers(tenant_id);

-- ============================================================================
-- 4. MIJOZLAR JADVALLARI (V2)
-- ============================================================================

-- Customers V2 jadvali
CREATE TABLE IF NOT EXISTS customers_v2 (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
    name VARCHAR NOT NULL,
    phone VARCHAR,
    email VARCHAR,
    address TEXT,
    price_tier VARCHAR(20) DEFAULT 'retail' NOT NULL,
    balance FLOAT DEFAULT 0.0 NOT NULL,
    credit_limit FLOAT DEFAULT 0.0,
    max_debt_allowed FLOAT DEFAULT 0.0,
    current_debt FLOAT DEFAULT 0.0 NOT NULL,
    loyalty_points FLOAT DEFAULT 0.0,
    ai_preferences JSONB,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_v2_tenant ON customers_v2(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_v2_name ON customers_v2(name);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_phone ON customers_v2(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers_v2(price_tier);

-- Customer Transactions V2 jadvali
CREATE TABLE IF NOT EXISTS customer_transactions_v2 (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers_v2(id) NOT NULL,
    sale_id INTEGER,
    amount FLOAT NOT NULL,
    transaction_type VARCHAR NOT NULL,
    payment_method VARCHAR(20),
    points_earned FLOAT DEFAULT 0.0,
    points_used FLOAT DEFAULT 0.0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_transactions_customer ON customer_transactions_v2(customer_id);

-- ============================================================================
-- 5. SOTUVLAR JADVALLARI (V2)
-- ============================================================================

-- Sales V2 jadvali
CREATE TABLE IF NOT EXISTS sales_v2 (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
    cashier_id INTEGER REFERENCES users(id),
    customer_id INTEGER REFERENCES customers_v2(id),
    branch_id INTEGER REFERENCES branches(id),
    total_amount FLOAT DEFAULT 0.0 NOT NULL,
    subtotal FLOAT DEFAULT 0.0,
    tax_amount FLOAT DEFAULT 0.0,
    discount_amount FLOAT DEFAULT 0.0,
    service_charge FLOAT DEFAULT 0.0,
    payment_method VARCHAR(20) DEFAULT 'cash' NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' NOT NULL,
    is_debt BOOLEAN DEFAULT FALSE,
    debt_amount FLOAT DEFAULT 0.0,
    notes TEXT,
    receipt_number VARCHAR,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_v2_tenant ON sales_v2(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_v2_receipt ON sales_v2(receipt_number);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_date ON sales_v2(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales_v2(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_debt ON sales_v2(is_debt, status);

-- Sale Items V2 jadvali
CREATE TABLE IF NOT EXISTS sale_items_v2 (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales_v2(id) NOT NULL,
    variant_id INTEGER REFERENCES product_variants(id) NOT NULL,
    quantity FLOAT DEFAULT 1.0 NOT NULL,
    unit_price FLOAT NOT NULL,
    cost_price FLOAT DEFAULT 0.0,
    total FLOAT NOT NULL,
    discount_percent FLOAT DEFAULT 0.0,
    discount_amount FLOAT DEFAULT 0.0,
    tax_rate FLOAT DEFAULT 0.0,
    tax_amount FLOAT DEFAULT 0.0,
    serial_number_id INTEGER,
    is_service_item BOOLEAN DEFAULT FALSE,
    linked_sale_item_id INTEGER REFERENCES sale_items_v2(id),
    notes TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items_v2(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_variant ON sale_items_v2(variant_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_service ON sale_items_v2(is_service_item);

-- Customer Ledger jadvali (Qarz kitobi)
CREATE TABLE IF NOT EXISTS customer_ledger (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers_v2(id) NOT NULL,
    tenant_id INTEGER REFERENCES tenants(id),
    sale_id INTEGER REFERENCES sales_v2(id),
    transaction_type VARCHAR DEFAULT 'sale',
    amount FLOAT DEFAULT 0.0,
    debit FLOAT DEFAULT 0.0,
    credit FLOAT DEFAULT 0.0,
    balance_after FLOAT NOT NULL,
    description TEXT,
    reference_number VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ledger_customer ON customer_ledger(customer_id);
CREATE INDEX IF NOT EXISTS idx_ledger_customer_date ON customer_ledger(customer_id, created_at);

-- ============================================================================
-- 6. SMENA VA KASSA JADVALLARI
-- ============================================================================

-- Shifts jadvali
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
    cashier_id INTEGER REFERENCES users(id) NOT NULL,
    status VARCHAR(20) DEFAULT 'open' NOT NULL,
    opened_at TIMESTAMP DEFAULT NOW() NOT NULL,
    closed_at TIMESTAMP,
    opening_cash FLOAT DEFAULT 0.0 NOT NULL,
    total_sales FLOAT DEFAULT 0.0,
    total_transactions INTEGER DEFAULT 0,
    cash_sales FLOAT DEFAULT 0.0,
    card_sales FLOAT DEFAULT 0.0,
    transfer_sales FLOAT DEFAULT 0.0,
    debt_sales FLOAT DEFAULT 0.0,
    total_refunds FLOAT DEFAULT 0.0,
    refund_count INTEGER DEFAULT 0,
    total_discounts FLOAT DEFAULT 0.0,
    expected_cash FLOAT DEFAULT 0.0,
    actual_cash FLOAT,
    cash_difference FLOAT DEFAULT 0.0,
    cash_withdrawn FLOAT DEFAULT 0.0,
    opening_notes TEXT,
    closing_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_tenant ON shifts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shifts_cashier ON shifts(cashier_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);

-- Cash Movements jadvali
CREATE TABLE IF NOT EXISTS cash_movements (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
    shift_id INTEGER REFERENCES shifts(id) NOT NULL,
    movement_type VARCHAR(20) NOT NULL,
    amount FLOAT NOT NULL,
    reason VARCHAR(100),
    notes TEXT,
    created_by INTEGER REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_movements_shift ON cash_movements(shift_id);

-- ============================================================================
-- 7. OMBOR JADVALLARI (Double-Entry System)
-- ============================================================================

-- Stock Locations jadvali
CREATE TABLE IF NOT EXISTS stock_locations (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    parent_id INTEGER REFERENCES stock_locations(id),
    usage VARCHAR(50) DEFAULT 'internal' NOT NULL,
    address TEXT,
    is_active VARCHAR(10) DEFAULT '1' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_location_tenant_code ON stock_locations(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_location_usage ON stock_locations(usage);

-- Stock Lots jadvali
CREATE TABLE IF NOT EXISTS stock_lots (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    product_id INTEGER REFERENCES products_v2(id),
    variant_id INTEGER REFERENCES product_variants(id),
    expiry_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lot_tenant_name ON stock_lots(tenant_id, name);

-- Stock Moves jadvali
CREATE TABLE IF NOT EXISTS stock_moves (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
    reference VARCHAR(255),
    product_id INTEGER,
    variant_id INTEGER REFERENCES product_variants(id),
    location_id INTEGER REFERENCES stock_locations(id) NOT NULL,
    location_dest_id INTEGER REFERENCES stock_locations(id) NOT NULL,
    product_uom_qty NUMERIC(18,6) NOT NULL,
    quantity_done NUMERIC(18,6) DEFAULT 0,
    state VARCHAR(20) DEFAULT 'draft' NOT NULL,
    lot_id INTEGER REFERENCES stock_lots(id),
    package_id INTEGER,
    owner_id INTEGER,
    date TIMESTAMP DEFAULT NOW() NOT NULL,
    date_done TIMESTAMP,
    origin VARCHAR(255),
    inventory_movement_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    CONSTRAINT check_positive_uom_qty CHECK (product_uom_qty >= 0),
    CONSTRAINT check_positive_done_qty CHECK (quantity_done >= 0)
);

CREATE INDEX IF NOT EXISTS idx_move_product_location ON stock_moves(variant_id, location_id, location_dest_id, state);
CREATE INDEX IF NOT EXISTS idx_move_state_date ON stock_moves(state, date);
CREATE INDEX IF NOT EXISTS idx_move_tenant ON stock_moves(tenant_id, state);

-- Stock Quants jadvali
CREATE TABLE IF NOT EXISTS stock_quants (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
    product_id INTEGER,
    variant_id INTEGER REFERENCES product_variants(id),
    location_id INTEGER REFERENCES stock_locations(id) NOT NULL,
    quantity NUMERIC(18,6) DEFAULT 0 NOT NULL,
    reserved_quantity NUMERIC(18,6) DEFAULT 0 NOT NULL,
    lot_id INTEGER REFERENCES stock_lots(id),
    package_id INTEGER,
    owner_id INTEGER,
    status VARCHAR(20) DEFAULT 'available' NOT NULL,
    in_date TIMESTAMP DEFAULT NOW() NOT NULL,
    move_id INTEGER REFERENCES stock_moves(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quant_product_location ON stock_quants(variant_id, location_id, lot_id, package_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_quant_location_status ON stock_quants(location_id, status);
CREATE INDEX IF NOT EXISTS idx_quant_tenant ON stock_quants(tenant_id);

-- ============================================================================
-- 8. SERIAL NUMBER VA WARRANTY JADVALLARI
-- ============================================================================

-- Serial Numbers jadvali
CREATE TABLE IF NOT EXISTS serial_numbers (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
    variant_id INTEGER REFERENCES product_variants(id) NOT NULL,
    serial_number VARCHAR NOT NULL,
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    maintenance_status VARCHAR(20),
    warehouse VARCHAR,
    location VARCHAR,
    sale_id INTEGER REFERENCES sales_v2(id),
    sale_item_id INTEGER,
    customer_id INTEGER REFERENCES customers_v2(id),
    warranty_start_date DATE,
    warranty_duration_months INTEGER DEFAULT 12,
    warranty_end_date DATE,
    amc_start_date DATE,
    amc_expiry_date DATE,
    amc_provider VARCHAR,
    installation_date DATE,
    installation_address TEXT,
    installer_name VARCHAR,
    installer_phone VARCHAR,
    purchase_rate FLOAT DEFAULT 0.0,
    posting_date DATE,
    reference_type VARCHAR(100),
    reference_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_sold BOOLEAN DEFAULT FALSE,
    is_installed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    manufacturer_serial VARCHAR,
    batch_number VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_serial_tenant_number ON serial_numbers(tenant_id, serial_number);
CREATE INDEX IF NOT EXISTS idx_serial_variant ON serial_numbers(variant_id);
CREATE INDEX IF NOT EXISTS idx_serial_customer ON serial_numbers(customer_id);
CREATE INDEX IF NOT EXISTS idx_serial_warranty ON serial_numbers(warranty_end_date);
CREATE INDEX IF NOT EXISTS idx_serial_status ON serial_numbers(status);
CREATE INDEX IF NOT EXISTS idx_serial_amc_expiry ON serial_numbers(amc_expiry_date);

-- Serial Number Movements jadvali
CREATE TABLE IF NOT EXISTS serial_number_movements (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
    serial_number_id INTEGER REFERENCES serial_numbers(id) NOT NULL,
    move_id INTEGER,
    reference_type VARCHAR(100),
    reference_name VARCHAR(255),
    from_location VARCHAR(255),
    to_location VARCHAR(255),
    from_warehouse VARCHAR(255),
    to_warehouse VARCHAR(255),
    movement_type VARCHAR(50) NOT NULL,
    movement_date TIMESTAMP DEFAULT NOW() NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_serial_movement_date ON serial_number_movements(serial_number_id, movement_date);
CREATE INDEX IF NOT EXISTS idx_serial_movement_tenant ON serial_number_movements(tenant_id, movement_date);

-- Warranties jadvali
CREATE TABLE IF NOT EXISTS warranties (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
    serial_number_id INTEGER REFERENCES serial_numbers(id) NOT NULL,
    warranty_type VARCHAR(20) DEFAULT 'manufacturer' NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_months INTEGER DEFAULT 12 NOT NULL,
    duration_days INTEGER,
    status VARCHAR(20) DEFAULT 'active' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    coverage_description TEXT,
    terms_and_conditions TEXT,
    warranty_terms TEXT,
    warranty_provider VARCHAR,
    provider VARCHAR,
    claim_count INTEGER DEFAULT 0,
    last_claim_date DATE,
    notes TEXT,
    warranty_number VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warranty_tenant_serial ON warranties(tenant_id, serial_number_id);
CREATE INDEX IF NOT EXISTS idx_warranty_status_date ON warranties(status, end_date);
CREATE INDEX IF NOT EXISTS idx_warranty_expiry ON warranties(end_date, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_warranty_number ON warranties(warranty_number) WHERE warranty_number IS NOT NULL;

-- ============================================================================
-- 9. LEGACY SUPPORT JADVALLARI
-- ============================================================================

-- Legacy Products jadvali (eski tizim uchun)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    price FLOAT DEFAULT 0.0,
    cost_price FLOAT DEFAULT 0.0,
    stock_quantity FLOAT DEFAULT 0.0,
    barcode VARCHAR,
    category_id INTEGER REFERENCES categories(id),
    organization_id INTEGER REFERENCES organizations(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inventory Movements jadvali (eski tizim)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) NOT NULL,
    quantity FLOAT NOT NULL,
    movement_type VARCHAR(20) DEFAULT 'in',
    reference_type VARCHAR,
    reference_id INTEGER,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Suppliers jadvali
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    contact_person VARCHAR,
    phone VARCHAR,
    email VARCHAR,
    address TEXT,
    bank_details TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 10. QOŞIMCHA JADVALLAR
-- ============================================================================

-- Audit Logs jadvali
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    user_id INTEGER REFERENCES users(id),
    action VARCHAR NOT NULL,
    entity_type VARCHAR NOT NULL,
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Receipts jadvali (Cheklar)
CREATE TABLE IF NOT EXISTS receipts (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
    sale_id INTEGER REFERENCES sales_v2(id),
    receipt_number VARCHAR NOT NULL,
    receipt_data JSONB DEFAULT '{}',
    qr_code TEXT,
    printed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_number ON receipts(tenant_id, receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_sale ON receipts(sale_id);

-- Work Sessions jadvali
CREATE TABLE IF NOT EXISTS work_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_work_sessions_user ON work_sessions(user_id);

-- Attendance jadvali
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    status VARCHAR(20) DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id);

-- Employee Documents jadvali
CREATE TABLE IF NOT EXISTS employee_documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    document_type VARCHAR NOT NULL,
    file_url VARCHAR,
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_documents_user ON employee_documents(user_id);

-- Employee AI Insights jadvali
CREATE TABLE IF NOT EXISTS employee_ai_insights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    insight_type VARCHAR NOT NULL,
    insight_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_ai_insights_user ON employee_ai_insights(user_id);

-- ============================================================================
-- 11. MAVJUD JADVALLARNI YANGILASH (ADD COLUMN IF NOT EXISTS)
-- ============================================================================

-- customers_v2 ga current_debt column qo'shish
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers_v2' AND column_name = 'current_debt'
    ) THEN
        ALTER TABLE customers_v2 ADD COLUMN current_debt FLOAT DEFAULT 0.0 NOT NULL;
    END IF;
END $$;

-- customers_v2 ga is_active column qo'shish
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers_v2' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE customers_v2 ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- sales_v2 ga receipt_number column qo'shish
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales_v2' AND column_name = 'receipt_number'
    ) THEN
        ALTER TABLE sales_v2 ADD COLUMN receipt_number VARCHAR;
        CREATE INDEX IF NOT EXISTS idx_sales_v2_receipt ON sales_v2(receipt_number);
    END IF;
END $$;

-- product_variants ga yangi columnlar qo'shish
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_variants' AND column_name = 'primary_unit'
    ) THEN
        ALTER TABLE product_variants ADD COLUMN primary_unit VARCHAR DEFAULT 'piece' NOT NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_variants' AND column_name = 'secondary_unit'
    ) THEN
        ALTER TABLE product_variants ADD COLUMN secondary_unit VARCHAR;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_variants' AND column_name = 'unit_conversion_factor'
    ) THEN
        ALTER TABLE product_variants ADD COLUMN unit_conversion_factor FLOAT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_variants' AND column_name = 'requires_serial_number'
    ) THEN
        ALTER TABLE product_variants ADD COLUMN requires_serial_number BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_variants' AND column_name = 'is_serialized'
    ) THEN
        ALTER TABLE product_variants ADD COLUMN is_serialized BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_variants' AND column_name = 'expiry_date'
    ) THEN
        ALTER TABLE product_variants ADD COLUMN expiry_date DATE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_variants' AND column_name = 'batch_number'
    ) THEN
        ALTER TABLE product_variants ADD COLUMN batch_number VARCHAR;
    END IF;
END $$;

-- sale_items_v2 ga yangi columnlar qo'shish
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sale_items_v2' AND column_name = 'serial_number_id'
    ) THEN
        ALTER TABLE sale_items_v2 ADD COLUMN serial_number_id INTEGER;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sale_items_v2' AND column_name = 'is_service_item'
    ) THEN
        ALTER TABLE sale_items_v2 ADD COLUMN is_service_item BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sale_items_v2' AND column_name = 'linked_sale_item_id'
    ) THEN
        ALTER TABLE sale_items_v2 ADD COLUMN linked_sale_item_id INTEGER REFERENCES sale_items_v2(id);
    END IF;
END $$;

-- products_v2 ga yangi columnlar qo'shish
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products_v2' AND column_name = 'service_duration_hours'
    ) THEN
        ALTER TABLE products_v2 ADD COLUMN service_duration_hours FLOAT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products_v2' AND column_name = 'service_category'
    ) THEN
        ALTER TABLE products_v2 ADD COLUMN service_category VARCHAR;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products_v2' AND column_name = 'linked_product_ids'
    ) THEN
        ALTER TABLE products_v2 ADD COLUMN linked_product_ids INTEGER[];
    END IF;
END $$;

-- customer_ledger ga tenant_id va transaction_type qo'shish
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customer_ledger' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE customer_ledger ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customer_ledger' AND column_name = 'transaction_type'
    ) THEN
        ALTER TABLE customer_ledger ADD COLUMN transaction_type VARCHAR DEFAULT 'sale';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customer_ledger' AND column_name = 'amount'
    ) THEN
        ALTER TABLE customer_ledger ADD COLUMN amount FLOAT DEFAULT 0.0;
    END IF;
END $$;

-- ============================================================================
-- 12. DEFAULT LOCATIONS YARATISH (OPTIONAL - skip if stock_locations doesn't have 'code' column)
-- ============================================================================

-- NOTE: Bu qism ixtiyoriy. Agar stock_locations jadvalida 'code' column bo'lmasa, skip qiling.
-- Default locationlar keyinroq app orqali avtomatik yaratiladi.

DO $$
BEGIN
    -- Check if stock_locations table has 'code' column before inserting
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_locations' AND column_name = 'code'
    ) THEN
        -- Insert default locations only if code column exists
        INSERT INTO stock_locations (tenant_id, name, code, usage)
        SELECT t.id, 'Asosiy ombor', 'WH/STOCK', 'internal'
        FROM tenants t
        WHERE NOT EXISTS (
            SELECT 1 FROM stock_locations sl 
            WHERE sl.tenant_id = t.id AND sl.code = 'WH/STOCK'
        );
        
        INSERT INTO stock_locations (tenant_id, name, code, usage)
        SELECT t.id, 'Mijozlar', 'CUSTOMERS', 'customer'
        FROM tenants t
        WHERE NOT EXISTS (
            SELECT 1 FROM stock_locations sl 
            WHERE sl.tenant_id = t.id AND sl.code = 'CUSTOMERS'
        );
        
        INSERT INTO stock_locations (tenant_id, name, code, usage)
        SELECT t.id, 'Yetkazib beruvchilar', 'SUPPLIERS', 'supplier'
        FROM tenants t
        WHERE NOT EXISTS (
            SELECT 1 FROM stock_locations sl 
            WHERE sl.tenant_id = t.id AND sl.code = 'SUPPLIERS'
        );
    END IF;
END $$;

-- ============================================================================
-- MIGRATION TUGADI
-- ============================================================================

SELECT 'Migration muvaffaqiyatli yakunlandi! ✅' as status;
