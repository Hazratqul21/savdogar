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
  // Handle 403 Forbidden (token expired or invalid)
  if (response.status === 403) {
    // Clear token and redirect to login
    removeToken();
    if (typeof window !== 'undefined') {
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }
    throw new Error("Sessiya muddati tugagan. Iltimos, qayta kiring.");
  }

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
    // Check for network errors
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      const apiUrl = typeof window !== 'undefined' ? getApiBaseUrl() : 'unknown';
      throw new Error(
        `Backend serverga ulanib bo'lmadi. ` +
        `API URL: ${apiUrl || 'not configured'}. ` +
        `Backend ishlayotganini va NEXT_PUBLIC_API_URL sozlanganingini tekshiring.`
      );
    }
    // Check for API URL configuration errors
    if (error.message.includes('NEXT_PUBLIC_API_URL') || error.message.includes('API URL')) {
      throw error; // Already has good message
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
  
  // Log for debugging
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🔐 Login request:', { apiUrl, username: credentials.username });
  }
  
  try {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    });

    // Log response for debugging
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('📥 Login response:', { status: response.status, statusText: response.statusText });
    }

    if (!response.ok) {
      // Try to get detailed error message
      let errorMessage = 'Kirishda xatolik yuz berdi';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage;
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.error('❌ Login error:', errorData);
        }
      } catch (e) {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('✅ Login success');
    }
    return result;
  } catch (error) {
    // Enhanced error handling
    if (error instanceof Error) {
      // If it's already a proper error with message, throw it as is
      if (error.message && error.message !== 'Kirishda xatolik yuz berdi') {
        throw error;
      }
    }
    throw handleNetworkError(error);
  }
}

export async function signup(userData: SignupRequest): Promise<any> {
  const apiUrl = getApiUrl();
  
  // Log for debugging
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('🔐 Signup request:', { apiUrl, username: userData.username, email: userData.email });
  }
  
  try {
    const response = await fetch(`${apiUrl}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    // Log response for debugging
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('📥 Signup response:', { status: response.status, statusText: response.statusText });
    }

    if (!response.ok) {
      // Try to get detailed error message
      let errorMessage = "Ro'yxatdan o'tishda xatolik yuz berdi";
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage;
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.error('❌ Signup error:', errorData);
        }
      } catch (e) {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('✅ Signup success:', result);
    }
    return result;
  } catch (error) {
    // Enhanced error handling
    if (error instanceof Error) {
      // If it's already a proper error with message, throw it as is
      if (error.message && error.message !== "Ro'yxatdan o'tishda xatolik yuz berdi") {
        throw error;
      }
    }
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
// Onboarding API
// =============================================================================

export async function updateOnboarding(data: {
  step?: number;
  completed?: boolean;
  business_type?: string;
  store_name?: string;
  store_address?: string;
  store_phone?: string;
}): Promise<any> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/settings/onboarding`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Onboarding yangilashda xatolik");
  return response.json();
}

// =============================================================================
// Team Management API
// =============================================================================

export async function getTeamMembers(): Promise<any[]> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/team`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Jamoa a'zolarini yuklashda xatolik");
  return response.json();
}

export async function createTeamMember(data: {
  username: string;
  password: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  role: string;
}): Promise<any> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/team`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Xodim qo'shishda xatolik");
  }
  return response.json();
}

export async function updateTeamMember(id: number, data: {
  full_name?: string;
  email?: string;
  phone_number?: string;
  role?: string;
  is_active?: boolean;
}): Promise<any> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/team/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Xodimni yangilashda xatolik");
  return response.json();
}

export async function deleteTeamMember(id: number): Promise<any> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/team/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Xodimni o'chirishda xatolik");
  return response.json();
}

export async function getAvailableRoles(): Promise<any> {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/v1/team/roles`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Rollarni yuklashda xatolik");
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
