-- ============================================
-- SmartPOS CRM - Create Admin User
-- Run this in Supabase SQL Editor
-- ============================================

-- First, check if users table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'users'
) as users_table_exists;

-- If table doesn't exist, you need to run migrations first
-- Or create the table manually:

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone_number VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    tenant_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tenants table if not exists (for multi-tenant support)
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    business_type VARCHAR(50) DEFAULT 'retail',
    subscription_plan VARCHAR(50) DEFAULT 'free',
    max_users INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default tenant
INSERT INTO tenants (name, business_type, subscription_plan, max_users, is_active)
VALUES ('Default Organization', 'retail', 'pro', 100, true)
ON CONFLICT DO NOTHING;

-- Get tenant ID
-- SELECT id FROM tenants WHERE name = 'Default Organization';

-- Insert admin user
-- Password: admin123 (bcrypt hashed)
-- Hash generated with: passlib.hash.bcrypt.hash("admin123")
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
    'admin',
    true,
    (SELECT id FROM tenants WHERE name = 'Default Organization' LIMIT 1)
)
ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Verify user was created
SELECT id, username, email, full_name, role, is_active, created_at
FROM users
WHERE username = 'engineer';

-- ============================================
-- Login credentials:
-- Username: engineer
-- Email: xazratabduraufov@gmail.com
-- Password: admin123
-- ============================================
