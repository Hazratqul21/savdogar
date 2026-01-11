"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, saveToken } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if redirected due to expired token
  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      setError("Sessiya muddati tugagan. Iltimos, qayta kiring.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login(formData);
      saveToken(response.access_token);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Kirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg p-8 md:p-10 border border-gray-200 shadow-sm">
          <div className="flex flex-col items-center mb-10">
            <img
              src="/logo.png"
              alt="Savdogar Logo"
              className="w-16 h-16 object-contain rounded-xl mb-4"
            />
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <span className="text-gray-900">Savdo</span>
              <span className="text-blue-600 ml-1">gar</span>
            </h1>
            <p className="text-sm text-gray-600 font-medium mt-2">Avtomatlashtirilgan Biznes Boshqaruvi</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Login / Email / Tel</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder="Username yoki Email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Parol</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                />
                {/* Eye icon to toggle password visibility */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "KIRILMOQDA..." : "KIRISH"}
            </button>
          </form>

          <div className="mt-10 text-center space-y-4">
            <p className="text-sm font-medium text-gray-600">
              Hisobingiz yo'qmi?{" "}
              <Link href="/signup" className="text-blue-600 font-semibold hover:underline">
                Ro'yxatdan o'tish
              </Link>
            </p>
            <Link href="/" className="block text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">
              ← ASOSIY SAHIFA
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
