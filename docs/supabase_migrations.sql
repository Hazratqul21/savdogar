-- ===========================================
-- SUPABASE MIGRATIONS - New Tables
-- ===========================================
-- Run this SQL in Supabase SQL Editor
-- Created: 2025-01-11

-- ===========================================
-- 1. SHIFTS TABLE (Smena/Z-Report)
-- ===========================================
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cashier_id INTEGER NOT NULL REFERENCES users(id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'open' NOT NULL,
    
    -- Times
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Opening cash
    opening_cash DECIMAL(15,2) DEFAULT 0 NOT NULL,
    
    -- Sales stats (calculated on close)
    total_sales DECIMAL(15,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    
    -- Payment methods
    cash_sales DECIMAL(15,2) DEFAULT 0,
    card_sales DECIMAL(15,2) DEFAULT 0,
    transfer_sales DECIMAL(15,2) DEFAULT 0,
    debt_sales DECIMAL(15,2) DEFAULT 0,
    
    -- Refunds
    total_refunds DECIMAL(15,2) DEFAULT 0,
    refund_count INTEGER DEFAULT 0,
    
    -- Discounts
    total_discounts DECIMAL(15,2) DEFAULT 0,
    
    -- Cash balance
    expected_cash DECIMAL(15,2) DEFAULT 0,
    actual_cash DECIMAL(15,2),
    cash_difference DECIMAL(15,2) DEFAULT 0,
    cash_withdrawn DECIMAL(15,2) DEFAULT 0,
    
    -- Notes
    opening_notes TEXT,
    closing_notes TEXT,
    
    -- Metadata
    shift_metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shifts_tenant ON shifts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shifts_cashier ON shifts(cashier_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_opened_at ON shifts(opened_at);

-- RLS
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant shifts"
ON shifts FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()::integer));

CREATE POLICY "Users can insert own tenant shifts"
ON shifts FOR INSERT
WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()::integer));

CREATE POLICY "Users can update own tenant shifts"
ON shifts FOR UPDATE
USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()::integer));

-- ===========================================
-- 2. CASH MOVEMENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS cash_movements (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    shift_id INTEGER NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    
    -- Movement type
    movement_type VARCHAR(20) NOT NULL, -- 'in' or 'out'
    amount DECIMAL(15,2) NOT NULL,
    
    -- Reason
    reason VARCHAR(100),
    notes TEXT,
    
    -- Who
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cash_movements_shift ON cash_movements(shift_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_tenant ON cash_movements(tenant_id);

-- RLS
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tenant cash movements"
ON cash_movements FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()::integer));

-- ===========================================
-- 3. MODIFIER GROUPS TABLE (Cafe)
-- ===========================================
CREATE TABLE IF NOT EXISTS modifier_groups (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic info
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    
    -- Selection rules
    is_required BOOLEAN DEFAULT FALSE,
    min_selections INTEGER DEFAULT 0,
    max_selections INTEGER DEFAULT 1,
    
    -- Order
    sort_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_modifier_groups_tenant ON modifier_groups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_modifier_groups_active ON modifier_groups(is_active);

-- RLS
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tenant modifier groups"
ON modifier_groups FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()::integer));

-- ===========================================
-- 4. MODIFIER OPTIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS modifier_options (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    
    -- Basic info
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    
    -- Price adjustment
    price_adjustment DECIMAL(15,2) DEFAULT 0,
    
    -- Default
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Order
    sort_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_modifier_options_group ON modifier_options(group_id);

-- RLS (inherits from group's tenant)
ALTER TABLE modifier_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage modifier options via groups"
ON modifier_options FOR ALL
USING (group_id IN (
    SELECT id FROM modifier_groups WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()::integer
    )
));

-- ===========================================
-- 5. PRODUCT MODIFIERS TABLE (Link)
-- ===========================================
CREATE TABLE IF NOT EXISTS product_modifiers (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products_v2(id) ON DELETE CASCADE,
    modifier_group_id INTEGER NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    
    -- Order
    sort_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Unique constraint
    UNIQUE(product_id, modifier_group_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_modifiers_product ON product_modifiers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_modifiers_group ON product_modifiers(modifier_group_id);

-- RLS
ALTER TABLE product_modifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage product modifiers"
ON product_modifiers FOR ALL
USING (product_id IN (
    SELECT id FROM products_v2 WHERE tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()::integer
    )
));

-- ===========================================
-- 6. ADD EXPIRY DATE TO PRODUCT VARIANTS
-- ===========================================
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(50);

-- Index for expiry tracking
CREATE INDEX IF NOT EXISTS idx_variants_expiry ON product_variants(expiry_date) 
WHERE expiry_date IS NOT NULL;

-- ===========================================
-- 7. GRANT PERMISSIONS
-- ===========================================
GRANT ALL ON shifts TO authenticated;
GRANT ALL ON cash_movements TO authenticated;
GRANT ALL ON modifier_groups TO authenticated;
GRANT ALL ON modifier_options TO authenticated;
GRANT ALL ON product_modifiers TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ===========================================
-- DONE!
-- ===========================================
-- Run this SQL in Supabase SQL Editor
-- After running, verify tables are created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
