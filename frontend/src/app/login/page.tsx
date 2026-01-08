"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, saveToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder="••••••••"
              />
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
