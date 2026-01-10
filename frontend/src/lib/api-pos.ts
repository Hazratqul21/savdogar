/**
 * POS API Client
 * Uses centralized API configuration from api.ts
 */
import { getAuthHeaders, getApiBaseUrl } from './api';

// =============================================================================
// API URL Helper
// =============================================================================

const getApiUrl = (): string => {
  try {
    return getApiBaseUrl();
  } catch {
    if (typeof window === 'undefined') return '';
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }
};

// =============================================================================
// Type Definitions
// =============================================================================

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
  attributes: Record<string, any>;
  barcode_aliases: string[];
  velocity_score: number;
  embedding_vector?: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product?: {
    id: number;
    name: string;
    tax_rate: number;
  };
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  price_tier: 'retail' | 'vip' | 'wholesaler';
  balance: number;
  credit_limit: number;
  max_debt_allowed: number;
}

export interface CartCalculationRequest {
  items: Array<{
    variant_id: number;
    quantity: number;
    discount_percent?: number;
  }>;
  customer_id?: number;
}

export interface CartCalculationResult {
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  items: Array<{
    variant_id: number;
    sku: string;
    name: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
  }>;
  applied_price_tiers: Array<{
    variant_id: number;
    tier_id: number;
    tier_type: string;
    min_quantity: number;
    price: number;
  }>;
}

export interface CheckoutRequest {
  items: Array<{
    variant_id: number;
    quantity: number;
    discount_percent?: number;
    serial_number?: string;
    is_service_item?: boolean;
    linked_variant_id?: number;
  }>;
  customer_id?: number;
  branch_id?: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'debt' | 'mixed' | 'payme' | 'click';
  debt_amount?: number;
  notes?: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// Product APIs
// =============================================================================

export async function getProducts(tenantId: number): Promise<any[]> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/products_v2`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

export type { GlobalCatalogProduct } from './supabase';
export { 
  searchGlobalCatalogByBarcode as searchGlobalCatalog, 
  contributeToGlobalCatalogRPC as contributeToGlobalCatalog 
} from './supabase';

export async function searchProductsByBarcode(barcode: string, tenantId: number): Promise<ProductVariant | null> {
  const products = await getProducts(tenantId);

  for (const product of products) {
    for (const variant of product.variants || []) {
      if (variant.barcode_aliases?.includes(barcode)) {
        return mapVariant(variant, product, tenantId);
      }
    }
  }
  return null;
}

export async function searchProductsBySku(sku: string, tenantId: number): Promise<ProductVariant | null> {
  if (!sku?.trim()) return null;

  const products = await getProducts(tenantId);
  const lowerSku = sku.toLowerCase();

  // Exact match first
  for (const product of products) {
    for (const variant of product.variants || []) {
      if (variant.sku.toLowerCase() === lowerSku) {
        return mapVariant(variant, product, tenantId);
      }
    }
  }

  // Partial match
  for (const product of products) {
    for (const variant of product.variants || []) {
      if (variant.sku.toLowerCase().includes(lowerSku)) {
        return mapVariant(variant, product, tenantId);
      }
    }
  }
  
  return null;
}

function mapVariant(variant: any, product: any, tenantId: number): ProductVariant {
  return {
    id: variant.id,
    product_id: variant.product_id,
    tenant_id: variant.tenant_id || tenantId,
    sku: variant.sku,
    price: variant.price,
    cost_price: variant.cost_price,
    stock_quantity: variant.stock_quantity,
    min_stock_level: variant.min_stock_level || 0,
    max_stock_level: variant.max_stock_level,
    primary_unit: variant.primary_unit || 'piece',
    secondary_unit: variant.secondary_unit,
    unit_conversion_factor: variant.unit_conversion_factor,
    requires_serial_number: variant.requires_serial_number || false,
    is_serialized: variant.is_serialized || false,
    attributes: variant.attributes || {},
    barcode_aliases: variant.barcode_aliases || [],
    velocity_score: variant.velocity_score || 0,
    embedding_vector: variant.embedding_vector,
    is_active: variant.is_active !== false,
    created_at: variant.created_at || new Date().toISOString(),
    updated_at: variant.updated_at || new Date().toISOString(),
    product: product,
  };
}

// =============================================================================
// Cart & Checkout APIs
// =============================================================================

export async function calculateCart(request: CartCalculationRequest): Promise<CartCalculationResult> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/sales/cart/calculate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to calculate cart');
  return response.json();
}

export async function checkout(request: CheckoutRequest): Promise<any> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/sales/checkout`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Checkout xatosi' }));
    throw new Error(error.detail || 'Checkout xatosi');
  }
  return response.json();
}

// =============================================================================
// Customer APIs
// =============================================================================

export async function getCustomers(tenantId: number): Promise<Customer[]> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/customers`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch customers');
  return response.json();
}

// =============================================================================
// AI Analytics APIs
// =============================================================================

export async function searchSemantic(query: string): Promise<ProductVariant[]> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/analytics/ai/semantic-search?query=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to perform semantic search');
  return response.json();
}

export async function getStockAlerts(): Promise<any[]> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/analytics/ai/stock-alerts`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch stock alerts');
  return response.json();
}

export async function getTenantInfo(): Promise<{ id: number; business_type: string; config: any }> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/tenants/me`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch tenant info');
  return response.json();
}
