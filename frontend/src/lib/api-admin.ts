/**
 * Admin API Functions
 * For Super Admin dashboard operations
 */

import { getAuthHeaders } from "./api";

const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : process.env.NEXT_PUBLIC_API_URL || '';

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
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
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
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/tenants`, {
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
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/tenants/${tenantId}/status`, {
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
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/tenants/${tenantId}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch tenant details');
  }
  
  return response.json();
}
