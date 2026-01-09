-- ============================================
-- SmartPOS CRM - Create Admin User (CORRECT)
-- Run this in Supabase SQL Editor
-- ============================================

-- Valid UserRole enum values:
-- 'super_admin', 'owner', 'manager', 'cashier', 'warehouse_manager'
-- We'll use 'super_admin' for full access

-- ============================================
-- Step 1: Check if tables exist
-- ============================================

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'users'
) as users_exists,
EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'tenants'
) as tenants_exists;

-- ============================================
-- Step 2: Create tenants table if not exists
-- ============================================

CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    business_type VARCHAR(50) DEFAULT 'retail',
    subscription_plan VARCHAR(50) DEFAULT 'pro',
    max_users INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default tenant if not exists
INSERT INTO tenants (name, business_type, subscription_plan, max_users, is_active)
VALUES ('Default Organization', 'retail', 'pro', 100, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- Step 3: Create users table if not exists
-- ============================================

-- Note: If table already exists with ENUM, this will fail
-- In that case, just run the INSERT statement below

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone_number VARCHAR(20),
    role VARCHAR(20) DEFAULT 'cashier',  -- Will be converted to ENUM if needed
    is_active BOOLEAN DEFAULT true,
    tenant_id INTEGER,
    organization_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Step 4: Insert admin user
-- ============================================

-- Password: admin123 (bcrypt hash)
-- Hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4nFJsWQxqgqKqaWi

INSERT INTO users (
    username, 
    email, 
    hashed_password, 
    full_name, 
    role, 
    is_active,
    tenant_id
)
VALUES (
    'engineer',
    'xazratabduraufov@gmail.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4nFJsWQxqgqKqaWi',  -- admin123
    'Xazratqul',
    'super_admin',  -- ✅ CORRECT enum value (not 'admin')
    true,
    (SELECT id FROM tenants WHERE name = 'Default Organization' LIMIT 1)
)
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    hashed_password = EXCLUDED.hashed_password;

-- ============================================
-- Step 5: Verify user was created
-- ============================================

SELECT 
    id, 
    username, 
    email, 
    full_name, 
    role, 
    is_active, 
    tenant_id,
    created_at
FROM users
WHERE username = 'engineer';

-- ============================================
-- Login Credentials:
-- Username: engineer
-- Email: xazratabduraufov@gmail.com
-- Password: admin123
-- Role: super_admin (full access)
-- ============================================
