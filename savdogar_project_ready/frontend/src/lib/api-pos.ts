import { getAuthHeaders } from './api';

const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? ''
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');


export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  attributes: Record<string, any>;
  barcode_aliases: string[];
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
  }>;
  customer_id?: number;
  branch_id?: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'debt' | 'mixed' | 'payme' | 'click';
  debt_amount?: number;
  notes?: string;
}

// Product APIs
export async function getProducts(tenantId: number): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/v2/products`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

export async function searchProductsByBarcode(barcode: string, tenantId: number): Promise<ProductVariant | null> {
  // Search in product variants by barcode_aliases
  const products = await getProducts(tenantId);

  for (const product of products) {
    for (const variant of product.variants || []) {
      if (variant.barcode_aliases?.includes(barcode)) {
        return {
          id: variant.id,
          product_id: variant.product_id,
          sku: variant.sku,
          price: variant.price,
          cost_price: variant.cost_price,
          stock_quantity: variant.stock_quantity,
          attributes: variant.attributes || {},
          barcode_aliases: variant.barcode_aliases || [],
          product: product,
        };
      }
    }
  }
  return null;
}

export async function searchProductsBySku(sku: string, tenantId: number): Promise<ProductVariant | null> {
  if (!sku || sku.trim().length === 0) return null;

  const products = await getProducts(tenantId);

  // First try exact match
  for (const product of products) {
    for (const variant of product.variants || []) {
      if (variant.sku.toLowerCase() === sku.toLowerCase()) {
        return {
          id: variant.id,
          product_id: variant.product_id,
          sku: variant.sku,
          price: variant.price,
          cost_price: variant.cost_price,
          stock_quantity: variant.stock_quantity,
          attributes: variant.attributes || {},
          barcode_aliases: variant.barcode_aliases || [],
          product: product,
        };
      }
    }
  }

  // Then try partial match
  for (const product of products) {
    for (const variant of product.variants || []) {
      if (variant.sku.toLowerCase().includes(sku.toLowerCase())) {
        return {
          id: variant.id,
          product_id: variant.product_id,
          sku: variant.sku,
          price: variant.price,
          cost_price: variant.cost_price,
          stock_quantity: variant.stock_quantity,
          attributes: variant.attributes || {},
          barcode_aliases: variant.barcode_aliases || [],
          product: product,
        };
      }
    }
  }
  return null;
}

// Cart calculation
export async function calculateCart(request: CartCalculationRequest): Promise<CartCalculationResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/v2/sales/cart/calculate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to calculate cart');
  return response.json();
}

// Checkout
export async function checkout(request: CheckoutRequest): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/v2/sales/checkout`, {
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

// Customer APIs
export async function getCustomers(tenantId: number): Promise<Customer[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/v2/customers`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch customers');
  return response.json();
}

// AI Analytics & Brain Features
export async function searchSemantic(query: string): Promise<ProductVariant[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/analytics/ai/semantic-search?query=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to perform semantic search');
  return response.json();
}

export async function getStockAlerts(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/analytics/ai/stock-alerts`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch stock alerts');
  return response.json();
}

export async function getTenantInfo(): Promise<{ id: number; business_type: string; config: any }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/v2/tenants/me`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch tenant info');
  return response.json();
}









