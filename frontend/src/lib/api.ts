/**
 * API Client for SmartPOS CRM
 * 
 * Frontend and backend are deployed separately on Vercel.
 * REQUIRED: Set NEXT_PUBLIC_API_URL environment variable to your backend URL
 * 
 * Example:
 *   Development: http://localhost:8000
 *   Production: https://your-backend.vercel.app
 */

// =============================================================================
// API Base URL Configuration
// =============================================================================

/**
 * Get the API base URL
 * Priority: NEXT_PUBLIC_API_URL > localhost (dev only)
 */
export const getApiBaseUrl = (): string => {
  // 1. Use environment variable if set (REQUIRED for production)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 2. Development: use localhost backend
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }
  
  // 3. Build-time: return empty string (validation happens at runtime)
  if (typeof window === 'undefined') {
    return '';
  }
  
  // 4. Runtime without env var: throw error
  throw new Error(
    'NEXT_PUBLIC_API_URL environment variable is not set. ' +
    'Please configure it in Vercel: Settings → Environment Variables'
  );
};

// Cache for API URL
let _apiUrlCache: string | null = null;

/**
 * Get cached API base URL with runtime validation
 */
const getApiUrl = (): string => {
  // Build-time safety
  if (typeof window === 'undefined') {
    try {
      return getApiBaseUrl();
    } catch {
      return '';
    }
  }
  
  // Client-side: cache and validate
  if (_apiUrlCache === null) {
    _apiUrlCache = getApiBaseUrl();
  }
  
  if (!_apiUrlCache) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not configured. ' +
      'Set it in Vercel: Settings → Environment Variables'
    );
  }
  
  return _apiUrlCache;
};

// =============================================================================
// Token Management
// =============================================================================

export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
    document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax`;
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    document.cookie = 'access_token=; path=/; max-age=0';
  }
}

export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

// =============================================================================
// Error Handling
// =============================================================================

/**
 * Handle API errors with user-friendly messages
 */
async function handleApiError(response: Response, defaultMessage: string): Promise<never> {
  try {
    const error = await response.json();
    throw new Error(error.detail || error.error || defaultMessage);
  } catch (e) {
    if (e instanceof Error && e.message !== defaultMessage) {
      throw e;
    }
    throw new Error(defaultMessage);
  }
}

/**
 * Handle network errors
 */
function handleNetworkError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error("Backend serverga ulanib bo'lmadi. Backend ishlayotganini tekshiring.");
    }
    throw error;
  }
  throw new Error("Noma'lum xatolik yuz berdi");
}

// =============================================================================
// Types
// =============================================================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  phone_number?: string;
  full_name?: string;
  business_type?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// =============================================================================
// Authentication API
// =============================================================================

export async function login(credentials: LoginRequest): Promise<TokenResponse> {
  const apiUrl = getApiUrl();
  
  try {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    if (!response.ok) {
      await handleApiError(response, 'Kirishda xatolik yuz berdi');
    }

    return await response.json();
  } catch (error) {
    throw handleNetworkError(error);
  }
}

export async function signup(userData: SignupRequest): Promise<any> {
  const apiUrl = getApiUrl();
  
  try {
    const response = await fetch(`${apiUrl}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      await handleApiError(response, "Ro'yxatdan o'tishda xatolik yuz berdi");
    }

    return await response.json();
  } catch (error) {
    throw handleNetworkError(error);
  }
}

// =============================================================================
// Settings API
// =============================================================================

export async function getSettings(): Promise<any> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/settings/me`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Sozlamalarni yuklashda xatolik");
  return response.json();
}

export async function updateProfile(data: any): Promise<any> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/settings/profile`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Profilni yangilashda xatolik");
  return response.json();
}

export async function updateTenant(data: any): Promise<any> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/settings/tenant`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Tashkilotni yangilashda xatolik");
  return response.json();
}

// =============================================================================
// Invoice Scanner API
// =============================================================================

export interface NakladnoyItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
}

export interface NakladnoyScanResult {
  success: boolean;
  items: NakladnoyItem[];
  image_path?: string;
}

export async function scanNakladnoyImage(file: File): Promise<NakladnoyScanResult> {
  const apiUrl = getApiUrl();
  const formData = new FormData();
  formData.append('file', file);

  const token = getToken();
  const response = await fetch(`${apiUrl}/api/v1/nakladnoy/upload-scan`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    await handleApiError(response, 'Nakladnoy tahlil qilishda xatolik');
  }

  return response.json();
}

export async function importNakladnoyToInventory(items: NakladnoyItem[]): Promise<any> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/nakladnoy/import-to-inventory`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(items),
  });

  if (!response.ok) {
    await handleApiError(response, 'Omborga import qilishda xatolik');
  }

  return response.json();
}

// =============================================================================
// AI Invoice Parser API
// =============================================================================

export interface ParsedInvoiceItem {
  product_name: string;
  quantity: number;
  price: number;
  unit: string;
}

export interface ParseInvoiceResponse {
  success: boolean;
  items: ParsedInvoiceItem[];
  model_used: string;
  mode: string;
  image_url?: string;
  error?: string;
}

export async function parseInvoice(
  file: File,
  isHandwritten: boolean = false
): Promise<ParseInvoiceResponse> {
  const apiUrl = getApiUrl();
  const formData = new FormData();
  formData.append('file', file);

  const token = getToken();
  const response = await fetch(
    `${apiUrl}/api/v1/ai/parse-invoice?is_handwritten=${isHandwritten}`,
    {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    }
  );

  if (!response.ok) {
    await handleApiError(response, 'Invoice tahlil qilishda xatolik');
  }

  return response.json();
}

export interface HybridScanItem {
  product_name: string;
  quantity: number;
  price: number;
  unit: string;
}

export interface HybridScanResponse {
  success: boolean;
  items: HybridScanItem[];
  model_used: string;
  mode: string;
  image_path?: string;
  error?: string;
}

export async function scanInvoiceHybrid(
  file: File,
  mode: 'printed' | 'handwritten' = 'printed'
): Promise<HybridScanResponse> {
  const apiUrl = getApiUrl();
  const formData = new FormData();
  formData.append('file', file);

  const token = getToken();
  const response = await fetch(
    `${apiUrl}/api/v1/invoice-scanner/scan?mode=${mode}`,
    {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    }
  );

  if (!response.ok) {
    await handleApiError(response, 'Invoice tahlil qilishda xatolik');
  }

  return response.json();
}
