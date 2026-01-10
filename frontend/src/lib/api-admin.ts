/**
 * Admin API Functions
 * For Super Admin dashboard operations
 */

import { getAuthHeaders } from "./api";

// API Base URL configuration
// Frontend and backend are now deployed separately on Vercel
// REQUIRED: Set NEXT_PUBLIC_API_URL environment variable to your backend URL
const getApiBaseUrl = (): string => {
  // If explicitly set via environment variable, use it (REQUIRED for production)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Development: use localhost backend (only at runtime, not during build)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }
  
  // Build-time fallback: return empty string during build/SSR
  // This prevents build errors when env var is not set at build time
  if (typeof window === 'undefined') {
    // Server-side (build-time or SSR): return empty string
    // Runtime validation will happen when API is actually called on client-side
    return '';
  }
  
  // Runtime (client-side): throw error if NEXT_PUBLIC_API_URL is not set
  throw new Error(
    'NEXT_PUBLIC_API_URL environment variable is not set. ' +
    'Please configure it in Vercel dashboard: Settings → Environment Variables'
  );
};

// Get API base URL with runtime validation (safe for build-time)
const getCachedApiBaseUrl = (): string => {
  try {
    return getApiBaseUrl();
  } catch {
    // Build-time: return empty string to allow build to complete
    if (typeof window === 'undefined') {
      return '';
    }
    // Runtime (client-side): rethrow error if env var is not set
    throw new Error(
      'NEXT_PUBLIC_API_URL environment variable is not set. ' +
      'Please configure it in Vercel dashboard: Settings → Environment Variables'
    );
  }
};

// Module-level constant for build-time compatibility (may be empty string at build time)
// In API functions, use getCachedApiBaseUrl() for runtime validation
const API_BASE_URL = (() => {
  try {
    return getApiBaseUrl();
  } catch {
    // Build-time: return empty string to allow build to complete
    return '';
  }
})();

export interface Tenant {
  id: number;
  name: string;
  business_type: string;
  config: Record<string, any>;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email?: string;
  role: string;
  is_active: boolean;
  full_name?: string;
  tenant_id?: number;
}

/**
 * Get current user information (including role)
 */
export async function getCurrentUser(): Promise<UserInfo> {
  const apiUrl = getCachedApiBaseUrl();
  const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch user information');
  }
  
  return response.json();
}

/**
 * Get all tenants (Super Admin only)
 */
export async function getAllTenants(): Promise<Tenant[]> {
  const apiUrl = getCachedApiBaseUrl();
  const response = await fetch(`${apiUrl}/api/v1/admin/tenants`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Access denied. Super Admin access required.');
    }
    throw new Error('Failed to fetch tenants');
  }
  
  return response.json();
}

/**
 * Update tenant status (activate/deactivate)
 */
export async function updateTenantStatus(
  tenantId: number,
  isActive: boolean
): Promise<Tenant> {
  const apiUrl = getCachedApiBaseUrl();
  const response = await fetch(`${apiUrl}/api/v1/admin/tenants/${tenantId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ is_active: isActive }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update tenant status');
  }
  
  return response.json();
}

/**
 * Get tenant details by ID
 */
export async function getTenantById(tenantId: number): Promise<Tenant> {
  const apiUrl = getCachedApiBaseUrl();
  const response = await fetch(`${apiUrl}/api/v1/admin/tenants/${tenantId}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch tenant details');
  }
  
  return response.json();
}
