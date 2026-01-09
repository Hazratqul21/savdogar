-- ============================================
-- SUPER ADMIN RLS POLICIES FOR SUPABASE
-- ============================================
-- 
-- This SQL file contains Row Level Security (RLS) policies that grant
-- unrestricted access to users with role = 'super_admin'.
-- 
-- IMPORTANT: Run this SQL in Supabase SQL Editor, not via Alembic.
-- 
-- Prerequisites:
-- 1. Users table must have 'role' column (enum: 'super_admin', 'owner', etc.)
-- 2. Users table must have 'auth_id' column (UUID linking to auth.users)
-- 3. RLS must be enabled on all tables
-- 
-- ============================================

-- Helper function: Check if current user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE auth_id = auth.uid() 
    AND role = 'super_admin'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TENANTS TABLE
-- ============================================

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "super_admin_all_access_tenants" ON public.tenants;
DROP POLICY IF EXISTS "tenant_isolation_tenants" ON public.tenants;

-- Super Admin: Full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "super_admin_all_access_tenants"
ON public.tenants
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Regular users: Tenant isolation (if needed)
-- Uncomment if you want tenant isolation for regular users:
-- CREATE POLICY "tenant_isolation_tenants"
-- ON public.tenants
-- FOR SELECT
-- USING (
--   id IN (
--     SELECT tenant_id FROM public.users WHERE auth_id = auth.uid()
--   )
--   OR is_super_admin()
-- );

-- ============================================
-- USERS TABLE
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_all_access_users" ON public.users;
DROP POLICY IF EXISTS "users_can_view_own_tenant" ON public.users;

-- Super Admin: Full access
CREATE POLICY "super_admin_all_access_users"
ON public.users
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Regular users: Can view users in their tenant
CREATE POLICY "users_can_view_own_tenant"
ON public.users
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE auth_id = auth.uid()
  )
  OR is_super_admin()
);

-- ============================================
-- PRODUCTS_V2 TABLE
-- ============================================

ALTER TABLE public.products_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_all_access_products_v2" ON public.products_v2;
DROP POLICY IF EXISTS "tenant_isolation_products_v2" ON public.products_v2;

-- Super Admin: Full access
CREATE POLICY "super_admin_all_access_products_v2"
ON public.products_v2
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Regular users: Tenant isolation
CREATE POLICY "tenant_isolation_products_v2"
ON public.products_v2
FOR ALL
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE auth_id = auth.uid()
  )
  OR is_super_admin()
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE auth_id = auth.uid()
  )
  OR is_super_admin()
);

-- ============================================
-- PRODUCT_VARIANTS TABLE
-- ============================================

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_all_access_product_variants" ON public.product_variants;
DROP POLICY IF EXISTS "tenant_isolation_product_variants" ON public.product_variants;

-- Super Admin: Full access
CREATE POLICY "super_admin_all_access_product_variants"
ON public.product_variants
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Regular users: Tenant isolation (via product_v2.tenant_id)
CREATE POLICY "tenant_isolation_product_variants"
ON public.product_variants
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.products_v2 p
    WHERE p.id = product_variants.product_id
    AND (
      p.tenant_id IN (
        SELECT tenant_id FROM public.users WHERE auth_id = auth.uid()
      )
      OR is_super_admin()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products_v2 p
    WHERE p.id = product_variants.product_id
    AND (
      p.tenant_id IN (
        SELECT tenant_id FROM public.users WHERE auth_id = auth.uid()
      )
      OR is_super_admin()
    )
  )
);

-- ============================================
-- SALES TABLE
-- ============================================

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_all_access_sales" ON public.sales;
DROP POLICY IF EXISTS "tenant_isolation_sales" ON public.sales;

-- Super Admin: Full access
CREATE POLICY "super_admin_all_access_sales"
ON public.sales
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Regular users: Tenant isolation
CREATE POLICY "tenant_isolation_sales"
ON public.sales
FOR ALL
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE auth_id = auth.uid()
  )
  OR is_super_admin()
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE auth_id = auth.uid()
  )
  OR is_super_admin()
);

-- ============================================
-- CUSTOMERS_V2 TABLE
-- ============================================

ALTER TABLE public.customers_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_all_access_customers_v2" ON public.customers_v2;
DROP POLICY IF EXISTS "tenant_isolation_customers_v2" ON public.customers_v2;

-- Super Admin: Full access
CREATE POLICY "super_admin_all_access_customers_v2"
ON public.customers_v2
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Regular users: Tenant isolation
CREATE POLICY "tenant_isolation_customers_v2"
ON public.customers_v2
FOR ALL
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE auth_id = auth.uid()
  )
  OR is_super_admin()
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.users WHERE auth_id = auth.uid()
  )
  OR is_super_admin()
);

-- ============================================
-- GLOBAL_CATALOG TABLE
-- ============================================
-- Note: Global catalog is shared, but super_admin should have full access

ALTER TABLE public.global_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_all_access_global_catalog" ON public.global_catalog;
DROP POLICY IF EXISTS "everyone_can_read_global_catalog" ON public.global_catalog;
DROP POLICY IF EXISTS "authenticated_can_contribute_global_catalog" ON public.global_catalog;

-- Super Admin: Full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "super_admin_all_access_global_catalog"
ON public.global_catalog
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Everyone: Can read (for product lookup)
CREATE POLICY "everyone_can_read_global_catalog"
ON public.global_catalog
FOR SELECT
USING (true);

-- Authenticated users: Can contribute (INSERT/UPDATE via RPC function)
-- The upsert_global_catalog RPC function handles this with SECURITY DEFINER

-- ============================================
-- ADDITIONAL TABLES (Add as needed)
-- ============================================
-- Repeat the pattern for other tables:
-- - inventory_logs
-- - work_sessions
-- - attendance
-- - etc.

-- Example for inventory_logs:
-- ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "super_admin_all_access_inventory_logs" ON public.inventory_logs;
-- CREATE POLICY "super_admin_all_access_inventory_logs"
-- ON public.inventory_logs
-- FOR ALL
-- USING (is_super_admin())
-- WITH CHECK (is_super_admin());

-- ============================================
-- NOTES
-- ============================================
-- 
-- 1. The is_super_admin() function uses SECURITY DEFINER, so it runs with
--    elevated privileges to check the users table.
-- 
-- 2. All policies check is_super_admin() first, so super_admins bypass
--    tenant isolation completely.
-- 
-- 3. Regular users still have tenant isolation via their tenant_id.
-- 
-- 4. To test: Create a user with role = 'super_admin' and auth_id matching
--    your Supabase Auth user UUID.
-- 
-- 5. Make sure the users table has an index on (auth_id, role) for performance:
--    CREATE INDEX IF NOT EXISTS idx_users_auth_id_role ON public.users(auth_id, role);
-- 
-- ============================================
