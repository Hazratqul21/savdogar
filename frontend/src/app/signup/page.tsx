"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup, login, saveToken } from "@/lib/api";
import { ChevronDown } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone_number: "",
    full_name: "",
    business_type: "retail",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const signupData: any = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        business_type: formData.business_type,
      };

      if (formData.full_name && formData.full_name.trim()) {
        signupData.full_name = formData.full_name.trim();
      }

      if (formData.phone_number && formData.phone_number.trim()) {
        signupData.phone_number = formData.phone_number.trim();
      }

      await signup(signupData);

      const loginResponse = await login({
        username: formData.username,
        password: formData.password,
      });

      saveToken(loginResponse.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 py-20">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg p-8 md:p-12 border border-gray-200 shadow-sm">
          <div className="flex flex-col items-center mb-10">
            <img
              src="/logo.png"
              alt="Savdogar Logo"
              className="w-20 h-20 object-contain rounded-xl mb-4"
            />
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <span className="text-gray-900">Savdo</span>
              <span className="text-blue-600 ml-1">gar</span>
            </h1>
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mt-2">Biznesingizni Avtomatlashtiring</p>
          </div>

          {error && (
            <div className="mb-8 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Biznesingiz turi</label>
              <div className="relative">
                <select
                  value={formData.business_type}
                  onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer font-medium text-gray-900"
                  required
                >
                  <option value="retail">Oziq-ovqat Do'koni</option>
                  <option value="fashion">Kiyim-kechak</option>
                  <option value="jewelry">Zargarlik / Aksessuarlar</option>
                  <option value="horeca">Kafe / Oshxona</option>
                  <option value="tobacco">Tamaki va Alkogol mahsulotlari</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Ismingiz</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder="Azizbek"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Loginingiz</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder="aziz_dev"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Email Manzilingiz</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder="aziz@savdogar.uz"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Parol Yarating</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-lg bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 transition-colors md:col-span-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "TAYYORLANMOQDA..." : "HISOB YARATISH"}
            </button>
          </form>

          <div className="mt-10 text-center space-y-4 border-t border-gray-200 pt-8">
            <p className="text-sm font-medium text-gray-600">
              Allaqachon a'zomisiz?{" "}
              <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                Kirish
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
