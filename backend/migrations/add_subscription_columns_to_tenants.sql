-- ============================================
-- ADD SUBSCRIPTION COLUMNS TO TENANTS TABLE
-- ============================================
-- 
-- This migration adds subscription plan columns to the tenants table.
-- IMPORTANT: This does NOT delete existing data - only adds new columns with defaults.
-- 
-- Run this SQL in your database (PostgreSQL/Supabase)
-- 
-- ============================================

-- Add subscription_plan column (default: 'trial')
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'trial' 
CHECK (subscription_plan IN ('trial', 'standard', 'pro'));

-- Add subscription_status column (default: 'active')
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'
CHECK (subscription_status IN ('active', 'suspended', 'cancelled', 'expired'));

-- Add trial_ends_at column (default: NOW() + 1 month for existing rows)
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Set default trial_ends_at for existing tenants (now + 1 month)
UPDATE public.tenants 
SET trial_ends_at = NOW() + INTERVAL '1 month'
WHERE trial_ends_at IS NULL;

-- Add max_users column (default: 5)
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5
CHECK (max_users > 0);

-- Add max_branches column (default: 1)
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS max_branches INTEGER DEFAULT 1
CHECK (max_branches > 0);

-- Update existing tenants based on subscription_plan
-- Standard plan: max_users = 5, max_branches = 1
-- Pro plan: max_users = 25, max_branches = 5
-- Trial: max_users = 5, max_branches = 1 (already default)
UPDATE public.tenants 
SET 
  max_users = CASE 
    WHEN subscription_plan = 'pro' THEN 25
    WHEN subscription_plan = 'standard' THEN 5
    ELSE 5
  END,
  max_branches = CASE 
    WHEN subscription_plan = 'pro' THEN 5
    WHEN subscription_plan = 'standard' THEN 1
    ELSE 1
  END
WHERE subscription_plan IS NOT NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_plan ON public.tenants(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON public.tenants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_trial_ends_at ON public.tenants(trial_ends_at);

-- Add comments for documentation
COMMENT ON COLUMN public.tenants.subscription_plan IS 'Subscription plan: trial, standard, or pro';
COMMENT ON COLUMN public.tenants.subscription_status IS 'Subscription status: active, suspended, cancelled, or expired';
COMMENT ON COLUMN public.tenants.trial_ends_at IS 'When the trial period ends (for trial plans)';
COMMENT ON COLUMN public.tenants.max_users IS 'Maximum number of users allowed for this tenant';
COMMENT ON COLUMN public.tenants.max_branches IS 'Maximum number of branches allowed for this tenant';
