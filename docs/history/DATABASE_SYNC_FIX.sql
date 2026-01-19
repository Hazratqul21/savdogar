-- ============================================================================
-- DATABASE SYNC FIX: organizations -> tenants
-- ============================================================================
-- Muammo: products_v2.tenant_id FK constraint tenants jadvaliga ishora qiladi
-- Lekin ba'zi userlar organization_id ishlatmoqda
-- Yechim: Organizations'larni tenants'ga sync qilish
-- ============================================================================

-- 1. Organizations jadvalidagi barcha record'larni tenants'ga ko'chirish
INSERT INTO tenants (id, name, business_type, email, phone, address, is_active, created_at)
SELECT 
    id, 
    name, 
    'retail' as business_type,  -- Default business type
    email,
    phone,
    address,
    is_active,
    created_at
FROM organizations
WHERE id NOT IN (SELECT id FROM tenants)
ON CONFLICT (id) DO NOTHING;

-- 2. User'larning tenant_id'sini organization_id'dan sync qilish
UPDATE users 
SET tenant_id = organization_id 
WHERE tenant_id IS NULL AND organization_id IS NOT NULL;

-- 3. Eski products jadvalidagi tenant_id'ni tekshirish (agar organization_id dan kelgan bo'lsa)
-- Bu faqat eski products jadval uchun (products_v2 emas)
-- UPDATE products SET organization_id = tenant_id WHERE organization_id IS NULL;

-- 4. ALTERNATIVE: FK constraint'ni temporarily o'chirish (agar kerak bo'lsa)
-- ALTER TABLE products_v2 DROP CONSTRAINT IF EXISTS products_v2_tenant_id_fkey;
-- ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_tenant_id_fkey;

-- 5. Sequence'larni sync qilish (agar kerak bo'lsa)
SELECT setval('tenants_id_seq', COALESCE((SELECT MAX(id) FROM tenants), 1), true);

-- 6. Tekshirish
SELECT 
    u.id as user_id,
    u.username,
    u.organization_id,
    u.tenant_id,
    t.name as tenant_name,
    o.name as org_name
FROM users u
LEFT JOIN tenants t ON u.tenant_id = t.id
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.is_active = TRUE
LIMIT 10;

-- ============================================================================
-- Post-migration verification
-- ============================================================================
-- Run this to verify sync:
SELECT 
    (SELECT COUNT(*) FROM tenants) as tenants_count,
    (SELECT COUNT(*) FROM organizations) as orgs_count,
    (SELECT COUNT(*) FROM users WHERE tenant_id IS NOT NULL) as users_with_tenant,
    (SELECT COUNT(*) FROM users WHERE organization_id IS NOT NULL) as users_with_org;
