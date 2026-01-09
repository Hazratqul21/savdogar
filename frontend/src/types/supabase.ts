/**
 * Supabase Database Types
 * Generated to match the new Supabase schema (products_v2, tenants, global_catalog)
 */

// ============================================
// ENUMS (matching PostgreSQL ENUM types)
// ============================================

export type UserRole = 'super_admin' | 'owner' | 'manager' | 'cashier' | 'warehouse_manager';
export type BusinessType = 'retail' | 'fashion' | 'horeca' | 'wholesale' | 'jewelry' | 'cafe' | 'kitchen' | 'plumbing_hvac' | 'tobacco';
export type ProductType = 'simple' | 'variable' | 'composite' | 'service' | 'bundle';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'debt' | 'mixed' | 'payme' | 'click';
export type SaleStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';
export type CustomerTier = 'retail' | 'vip' | 'wholesaler';
export type PriceTierType = 'retail' | 'vip' | 'wholesaler' | 'bulk';

// ============================================
// CORE TABLES
// ============================================

/**
 * Tenant (Multi-tenant root)
 */
export type SubscriptionPlan = 'trial' | 'standard' | 'pro';
export type SubscriptionStatus = 'active' | 'suspended' | 'cancelled' | 'expired';

export interface Tenant {
  id: number;
  name: string;
  business_type: BusinessType;
  base_currency: string;
  usd_to_uzs_rate: number;
  min_margin_percent: number;
  config: Record<string, any>; // JSONB
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  // Subscription & Plan Limits
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  trial_ends_at?: string; // ISO timestamp
  max_users: number;
  max_branches: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * User (with auth_id linking to Supabase Auth)
 */
export interface User {
  id: number;
  auth_id: string | null; // UUID - links to auth.users(id)
  username: string;
  email?: string;
  hashed_password: string;
  role: UserRole;
  is_active: boolean;
  full_name?: string;
  phone_number?: string;
  pin_code_hash?: string;
  profile_image?: string;
  address?: string;
  birth_date?: string;
  passport_data?: string;
  job_title?: string;
  hired_date: string;
  user_settings: Record<string, any>; // JSONB
  organization_id?: number;
  tenant_id?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Product V2 (from products_v2 table)
 */
export interface ProductV2 {
  id: number;
  tenant_id: number;
  category_id?: number;
  name: string;
  description?: string;
  type: ProductType;
  base_price: number;
  cost_price: number;
  tax_rate: number;
  is_active: boolean;
  metadata: Record<string, any>; // JSONB
  recipe?: Record<string, any>; // JSONB
  service_duration_hours?: number;
  service_category?: string;
  linked_product_ids?: number[]; // ARRAY
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
}

/**
 * Product Variant (from product_variants table)
 */
export interface ProductVariant {
  id: number;
  product_id: number;
  tenant_id: number;
  sku: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level?: number;
  primary_unit: string;
  secondary_unit?: string;
  unit_conversion_factor?: number;
  requires_serial_number: boolean;
  is_serialized: boolean;
  attributes: Record<string, any>; // JSONB
  barcode_aliases: string[]; // ARRAY
  velocity_score: number;
  embedding_vector?: number[]; // ARRAY
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product?: {
    id: number;
    name: string;
    tax_rate: number;
  };
}

/**
 * Customer V2 (from customers_v2 table)
 */
export interface CustomerV2 {
  id: number;
  tenant_id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  price_tier: CustomerTier;
  balance: number;
  credit_limit: number;
  max_debt_allowed: number;
  loyalty_points: number;
  ai_preferences?: Record<string, any>; // JSONB
  metadata: Record<string, any>; // JSONB
  created_at: string;
  updated_at: string;
}

/**
 * Sale V2 (from sales_v2 table)
 */
export interface SaleV2 {
  id: number;
  tenant_id: number;
  cashier_id?: number;
  customer_id?: number;
  branch_id?: number;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  service_charge: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  is_debt: boolean;
  debt_amount: number;
  notes?: string;
  receipt_number?: string;
  metadata: Record<string, any>; // JSONB
  created_at: string;
  updated_at: string;
  items?: SaleItemV2[];
}

/**
 * Sale Item V2 (from sale_items_v2 table)
 */
export interface SaleItemV2 {
  id: number;
  sale_id: number;
  variant_id: number;
  quantity: number;
  unit_price: number;
  cost_price: number;
  total: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  serial_number_id?: number;
  is_service_item: boolean;
  linked_sale_item_id?: number;
  notes?: string;
  metadata: Record<string, any>; // JSONB
  created_at: string;
}

/**
 * Global Catalog Product (from global_catalog table in Supabase)
 */
export interface GlobalCatalogProduct {
  barcode: string;
  name: string;
  category?: string;
  image_url?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  created_by_user_id?: string; // UUID
  contribution_count?: number;
  last_contributed_at?: string;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

/**
 * Product Create Request (for POST /api/v1/products_v2)
 */
export interface ProductCreateRequest {
  name: string;
  type: ProductType;
  base_price: number;
  cost_price?: number;
  tax_rate?: number;
  description?: string;
  category_id?: number;
  product_metadata?: Record<string, any>;
  recipe?: Record<string, any>;
  service_duration_hours?: number;
  service_category?: string;
  linked_product_ids?: number[];
  variants?: Array<{
    sku: string;
    price: number;
    cost_price?: number;
    stock_quantity?: number;
    min_stock_level?: number;
    max_stock_level?: number;
    primary_unit?: string;
    secondary_unit?: string;
    unit_conversion_factor?: number;
    requires_serial_number?: boolean;
    is_serialized?: boolean;
    attributes?: Record<string, any>;
    barcode_aliases?: string[];
    is_active?: boolean;
  }>;
}

/**
 * Product Response (from GET /api/v1/products_v2)
 */
export interface ProductResponse extends ProductV2 {
  variants: ProductVariant[];
}
