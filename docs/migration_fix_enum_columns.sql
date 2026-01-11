-- Migration: Fix ENUM columns to VARCHAR
-- This fixes case-sensitivity issues between Python enums and PostgreSQL ENUM types
-- 
-- IMPORTANT: Run this in Supabase SQL Editor

-- Step 1: Find and drop all policies that depend on these columns
-- (This will list all policies, you can drop them individually)

-- List all policies on tenants table
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tenants' OR tablename = 'users'
ORDER BY tablename, policyname;

-- Step 2: Drop the specific policy that's causing the error
DROP POLICY IF EXISTS users_manage_own_tenant ON tenants;

-- Step 3: Drop any other policies that might reference these columns
-- (List them first, then drop if needed)
-- You can check with:
-- SELECT policyname FROM pg_policies WHERE definition LIKE '%role%' OR definition LIKE '%business_type%';

-- Step 4: Now alter the columns
-- business_type: ENUM -> VARCHAR(50)
ALTER TABLE tenants 
ALTER COLUMN business_type TYPE VARCHAR(50) 
USING business_type::text;

-- role: ENUM -> VARCHAR(50)  
ALTER TABLE users 
ALTER COLUMN role TYPE VARCHAR(50) 
USING role::text;

-- Step 5: Normalize existing values to lowercase
UPDATE tenants SET business_type = LOWER(business_type) WHERE business_type IS NOT NULL;
UPDATE users SET role = LOWER(role) WHERE role IS NOT NULL;

-- Step 6: Drop the old ENUM types (optional, but recommended)
DROP TYPE IF EXISTS businesstype CASCADE;
DROP TYPE IF EXISTS userrole CASCADE;

-- Step 7: Recreate the policy (if it was critical)
-- Note: Adjust the policy definition based on your actual RLS needs
-- Example (uncomment and modify if needed):
/*
CREATE POLICY users_manage_own_tenant ON tenants
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM users 
            WHERE id = auth.uid()::text
        )
    );
*/

-- Verify the changes
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'tenants' AND column_name = 'business_type';

SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';
