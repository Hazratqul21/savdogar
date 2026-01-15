"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup, login, saveToken } from "@/lib/api";
import { ChevronDown, Eye, EyeOff, Check, X } from "lucide-react";

// Password strength calculator
function calculatePasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  bgColor: string;
  requirements: { met: boolean; text: string }[];
} {
  const requirements = [
    { met: password.length >= 8, text: "Kamida 8 ta belgi" },
    { met: /[A-Z]/.test(password), text: "Katta harf (A-Z)" },
    { met: /[a-z]/.test(password), text: "Kichik harf (a-z)" },
    { met: /[0-9]/.test(password), text: "Raqam (0-9)" },
    { met: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: "Maxsus belgi (!@#$%)" },
  ];

  const metCount = requirements.filter((r) => r.met).length;

  if (password.length === 0) {
    return { score: 0, label: "", color: "", bgColor: "bg-gray-200", requirements };
  }

  if (metCount <= 1) {
    return { score: 1, label: "Juda zaif", color: "text-red-600", bgColor: "bg-red-500", requirements };
  }

  if (metCount === 2) {
    return { score: 2, label: "Zaif", color: "text-orange-500", bgColor: "bg-orange-500", requirements };
  }

  if (metCount === 3) {
    return { score: 3, label: "O'rtacha", color: "text-yellow-500", bgColor: "bg-yellow-500", requirements };
  }

  if (metCount === 4) {
    return { score: 4, label: "Kuchli", color: "text-green-500", bgColor: "bg-green-500", requirements };
  }

  return { score: 5, label: "Juda kuchli", color: "text-green-600", bgColor: "bg-green-600", requirements };
}

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
  const [showPassword, setShowPassword] = useState(false);

  // Calculate password strength
  const passwordStrength = useMemo(
    () => calculatePasswordStrength(formData.password),
    [formData.password]
  );

  // Check if password meets minimum requirements (first 4)
  const passwordValid = passwordStrength.requirements.slice(0, 4).every((r) => r.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password before submitting
    if (!passwordValid) {
      setError("Parol talablarga javob bermayapti. Iltimos, kuchli parol yarating.");
      return;
    }

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

      // Wait a bit before login to ensure user is fully created
      await new Promise(resolve => setTimeout(resolve, 500));

      const loginResponse = await login({
        username: formData.username,
        password: formData.password,
      });

      saveToken(loginResponse.access_token);
      // New users go to onboarding wizard first
      router.push("/onboarding");
    } catch (err: any) {
      // Better error message handling
      console.error('Signup error:', err);
      let errorMessage = err.message || "Ro'yxatdan o'tishda xatolik yuz berdi";
      
      // Check for common errors and provide helpful messages
      if (errorMessage.includes('Backend serverga ulanib bo\'lmadi') || 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('NEXT_PUBLIC_API_URL')) {
        errorMessage = "Backend serverga ulanib bo'lmadi. Iltimos, backend ishlayotganini va API URL sozlanganini tekshiring.";
      } else if (errorMessage.includes('already exists') || errorMessage.includes('mavjud')) {
        // Keep the original message from backend
      } else if (!errorMessage || errorMessage === "Ro'yxatdan o'tishda xatolik yuz berdi") {
        errorMessage = "Ro'yxatdan o'tishda xatolik yuz berdi. Iltimos, ma'lumotlaringizni tekshirib qayta urinib ko'ring.";
      }
      
      setError(errorMessage);
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

            {/* Password field with visibility toggle and strength indicator */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Parol Yarating</label>
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

              {/* Password strength indicator */}
              {formData.password.length > 0 && (
                <div className="mt-3 space-y-3">
                  {/* Strength bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">Parol kuchliligi:</span>
                      <span className={`text-xs font-bold ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.bgColor}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Requirements checklist */}
                  <div className="grid grid-cols-2 gap-1">
                    {passwordStrength.requirements.slice(0, 4).map((req, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-1.5 text-xs ${
                          req.met ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {req.met ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <X size={14} className="text-gray-300" />
                        )}
                        <span>{req.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordValid}
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
