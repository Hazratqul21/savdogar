// API Base URL configuration
// Frontend and backend are now deployed separately on Vercel
// REQUIRED: Set NEXT_PUBLIC_API_URL environment variable to your backend URL
// Development: Use localhost backend (http://localhost:8000)
// Production: Use your deployed backend URL (e.g., https://your-backend.vercel.app)
// API Base URL helper function
export const getApiBaseUrl = (): string => {
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

// Get API base URL with runtime validation
// This function is called in each API function to ensure runtime validation
let _cachedApiBaseUrl: string | null = null;
const getCachedApiBaseUrl = (): string => {
  // Build-time safety: return empty string during SSR/build
  if (typeof window === 'undefined') {
    // During build/SSR, getApiBaseUrl returns empty string if env var not set
    // This is safe - runtime validation happens on client-side
    if (_cachedApiBaseUrl === null) {
      try {
        _cachedApiBaseUrl = getApiBaseUrl();
      } catch {
        _cachedApiBaseUrl = '';
      }
    }
    return _cachedApiBaseUrl || '';
  }
  
  // Client-side: cache and validate
  if (_cachedApiBaseUrl === null) {
    try {
      _cachedApiBaseUrl = getApiBaseUrl();
    } catch (error) {
      // Re-throw on client-side if env var not set
      throw error;
    }
  }
  
  // Runtime validation for client-side: ensure URL is set
  if (_cachedApiBaseUrl === '' && typeof window !== 'undefined') {
    throw new Error(
      'NEXT_PUBLIC_API_URL environment variable is not set. ' +
      'Please configure it in Vercel dashboard: Settings → Environment Variables'
    );
  }
  
  return _cachedApiBaseUrl;
};

// Module-level constant for build-time compatibility (may be empty string at build time)
// In API functions, use getCachedApiBaseUrl() instead for runtime validation
const API_BASE_URL = (() => {
  try {
    return getApiBaseUrl();
  } catch {
    // Build-time: return empty string to allow build to complete
    return '';
  }
})();


export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

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

export async function login(credentials: LoginRequest): Promise<TokenResponse> {
  // Runtime validation: get API URL with validation
  const apiUrl = getCachedApiBaseUrl();
  
  try {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Kirishda xatolik yuz berdi' }));
      const errorMessage = error.detail || 'Kirishda xatolik yuz berdi';
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error("Backend serverga ulanib bo'lmadi. Iltimos, backend ishlayotganini tekshiring (http://localhost:8000)");
    }
    throw error;
  }
}

export async function signup(userData: SignupRequest): Promise<any> {
  // Runtime validation: get API URL with validation
  const apiUrl = getCachedApiBaseUrl();
  const signupUrl = `${apiUrl}/api/v1/auth/signup`;
  
  try {
    const response = await fetch(signupUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/c32e21c4-955b-4bd3-ad02-aa07e2117d26',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:94',message:'signup fetch after',data:{status:response.status,statusText:response.statusText,ok:response.ok,url:response.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/c32e21c4-955b-4bd3-ad02-aa07e2117d26',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:98',message:'signup response not ok',data:{status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const error = await response.json().catch(() => ({ detail: "Ro'yxatdan o'tishda xatolik yuz berdi" }));
      const errorMessage = error.detail || "Ro'yxatdan o'tishda xatolik yuz berdi";
      throw new Error(errorMessage);
    }

    const result = await response.json();
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/c32e21c4-955b-4bd3-ad02-aa07e2117d26',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:106',message:'signup success',data:{hasResult:!!result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return result;
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/c32e21c4-955b-4bd3-ad02-aa07e2117d26',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:110',message:'signup error',data:{errorMessage:error.message,errorName:error.name,errorType:typeof error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // Network error handling
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error("Backend serverga ulanib bo'lmadi. Iltimos, backend ishlayotganini tekshiring (http://localhost:8000)");
    }
    throw error;
  }
}

export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
    // Cookie ga ham saqlash (middleware uchun)
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
    // Cookie ni ham o'chirish
    document.cookie = 'access_token=; path=/; max-age=0';
  }
}

export async function getSettings(): Promise<any> {
  const apiUrl = getCachedApiBaseUrl();
  const response = await fetch(`${apiUrl}/api/v1/settings/me`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Sozlamalarni yuklashda xatolik");
  return response.json();
}

export async function updateProfile(data: any): Promise<any> {
  const apiUrl = getCachedApiBaseUrl();
  const response = await fetch(`${apiUrl}/api/v1/settings/profile`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Profilni yangilashda xatolik");
  return response.json();
}

export async function updateTenant(data: any): Promise<any> {
  const apiUrl = getCachedApiBaseUrl();
  const response = await fetch(`${apiUrl}/api/v1/settings/tenant`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Tashkilotni yangilashda xatolik");
  return response.json();
}

// Nakladnoy Scanner API
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
  const apiUrl = getCachedApiBaseUrl();
  const formData = new FormData();
  formData.append('file', file);

  const token = getToken();
  const response = await fetch(`${apiUrl}/api/v1/nakladnoy/upload-scan`, {
    method: 'POST',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Nakladnoy tahlil qilishda xatolik' }));
    throw new Error(error.detail || 'Nakladnoy tahlil qilishda xatolik');
  }

  return response.json();
}

export async function importNakladnoyToInventory(items: NakladnoyItem[]): Promise<any> {
  const apiUrl = getCachedApiBaseUrl();
  const response = await fetch(`${apiUrl}/api/v1/nakladnoy/import-to-inventory`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(items),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Omborga import qilishda xatolik' }));
    throw new Error(error.detail || 'Omborga import qilishda xatolik');
  }

  return response.json();
}

// Hybrid Invoice Scanner API
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
  const apiUrl = getCachedApiBaseUrl();
  const formData = new FormData();
  formData.append('file', file);

  const token = getToken();
  const response = await fetch(
    `${apiUrl}/api/v1/invoice-scanner/scan?mode=${mode}`,
    {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      error: 'Invoice tahlil qilishda xatolik',
      success: false 
    }));
    throw new Error(error.error || error.detail || 'Invoice tahlil qilishda xatolik');
  }

  return response.json();
}

// ============================================
// AI Invoice Parser API (Smart Dual-Model)
// ============================================

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

/**
 * Parse invoice image using AI (Smart Dual-Model)
 * 
 * @param file - Image file to parse
 * @param isHandwritten - Toggle: true for handwritten (gpt-4o), false for printed (gpt-4o-mini)
 * @returns Parsed invoice items
 */
export async function parseInvoice(
  file: File,
  isHandwritten: boolean = false
): Promise<ParseInvoiceResponse> {
  const apiUrl = getCachedApiBaseUrl();
  const formData = new FormData();
  formData.append('file', file);

  const token = getToken();
  const response = await fetch(
    `${apiUrl}/api/v1/ai/parse-invoice?is_handwritten=${isHandwritten}`,
    {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      error: 'Invoice tahlil qilishda xatolik',
      success: false 
    }));
    throw new Error(error.error || error.detail || 'Invoice tahlil qilishda xatolik');
  }

  return response.json();
}









