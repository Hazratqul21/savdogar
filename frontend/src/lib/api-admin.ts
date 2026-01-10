/**
 * Admin API Functions
 * For Super Admin dashboard operations
 * Uses centralized API configuration from api.ts
 */

import { getAuthHeaders, getApiBaseUrl } from "./api";

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

// =============================================================================
// User API
// =============================================================================

export async function getCurrentUser(): Promise<UserInfo> {
  const apiUrl = getApiUrl();
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

// =============================================================================
// Tenant API (Super Admin only)
// =============================================================================

export async function getAllTenants(): Promise<Tenant[]> {
  const apiUrl = getApiUrl();
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

export async function updateTenantStatus(
  tenantId: number,
  isActive: boolean
): Promise<Tenant> {
  const apiUrl = getApiUrl();
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

export async function getTenantById(tenantId: number): Promise<Tenant> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/admin/tenants/${tenantId}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch tenant details');
  }
  
  return response.json();
}
