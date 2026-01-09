// API Base URL configuration
// Vercel deployment: Use empty string (routes are handled by vercel.json)
// Development: Use localhost backend
// External deployment: Use NEXT_PUBLIC_API_URL environment variable
const getApiBaseUrl = (): string => {
  // If explicitly set via environment variable, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Development: use localhost backend
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }
  
  // Production (Vercel): use empty string
  // Vercel routes /api/* to backend, so we just use /api/v1/... directly
  return '';
};

const API_BASE_URL = getApiBaseUrl();


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
  try {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Kirishda xatolik yuz berdi' }));
      throw new Error(error.detail || 'Kirishda xatolik yuz berdi');
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
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Ro'yxatdan o'tishda xatolik yuz berdi" }));
      const errorMessage = error.detail || "Ro'yxatdan o'tishda xatolik yuz berdi";

      // Database migration error
      if (errorMessage.includes("migration") || errorMessage.includes("jadvallari yaratilmagan")) {
        throw new Error(
          "Database jadvallari yaratilmagan. Backend da quyidagi buyruqni bajaring:\n" +
          "cd backend && source venv/bin/activate && alembic upgrade head"
        );
      }

      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
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
  const response = await fetch(`${API_BASE_URL}/api/v1/settings/me`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Sozlamalarni yuklashda xatolik");
  return response.json();
}

export async function updateProfile(data: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/settings/profile`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Profilni yangilashda xatolik");
  return response.json();
}

export async function updateTenant(data: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/settings/tenant`, {
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
  const formData = new FormData();
  formData.append('file', file);

  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api/v1/nakladnoy/upload-scan`, {
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
  const response = await fetch(`${API_BASE_URL}/api/v1/nakladnoy/import-to-inventory`, {
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
  const formData = new FormData();
  formData.append('file', file);

  const token = getToken();
  const response = await fetch(
    `${API_BASE_URL}/api/v1/invoice-scanner/scan?mode=${mode}`,
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
  const formData = new FormData();
  formData.append('file', file);

  const token = getToken();
  const response = await fetch(
    `${API_BASE_URL}/api/v1/ai/parse-invoice?is_handwritten=${isHandwritten}`,
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









