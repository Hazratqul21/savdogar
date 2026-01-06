// API Base URL configuration
// Monorepo deployment: Use relative path /api (same domain)
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
  
  // Production monorepo: use relative path (same domain)
  // This works because frontend and backend are on the same domain
  return '/api';
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









