"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, saveToken } from "@/lib/api";
import { Eye, EyeOff, Store, ArrowRight, Loader2, ShieldCheck, Zap, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('expired') === 'true') {
        setError("Sessiya muddati tugagan. Iltimos, qayta kiring.");
      }
    }
  }, []);

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
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-10">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Savdo<span className="text-primary">gar</span>
                </h1>
                <p className="text-xs text-muted-foreground">Biznes Boshqaruv Tizimi</p>
              </div>
            </Link>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">
              Xush kelibsiz! 👋
            </h2>
            <p className="text-muted-foreground mt-2">
              Hisobingizga kirish uchun ma'lumotlaringizni kiriting
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs">!</span>
              </div>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Login
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="input-modern"
                placeholder="Username, email yoki telefon"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Parol
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="input-modern pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full btn-primary flex items-center justify-center gap-2 h-14 text-base",
                loading && "opacity-80"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Kirilmoqda...
                </>
              ) : (
                <>
                  Kirish
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Hisobingiz yo'qmi?{" "}
              <Link 
                href="/signup" 
                className="text-primary font-semibold hover:underline"
              >
                Ro'yxatdan o'tish
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              © {new Date().getFullYear()} Savdogar. Barcha huquqlar himoyalangan.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg">
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm font-medium border border-white/10">
              <Zap className="w-4 h-4 text-yellow-400" />
              Tez va Qulay
            </span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Biznesingizni
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Avtomatlashtiring
            </span>
          </h2>

          <p className="text-lg text-slate-300 mb-10 leading-relaxed">
            Savdogar - O'zbekistondagi eng ilg'or POS va CRM tizimi. 
            Do'koningizni boshqarishni osonlashtiring.
          </p>

          {/* Features */}
          <div className="space-y-4">
            <Feature 
              icon={<ShieldCheck className="w-5 h-5" />}
              title="Xavfsiz va Ishonchli"
              description="Ma'lumotlaringiz xavfsiz saqlanadi"
            />
            <Feature 
              icon={<Zap className="w-5 h-5" />}
              title="Tezkor POS Terminali"
              description="Bir soniyada sotuv qiling"
            />
            <Feature 
              icon={<BarChart3 className="w-5 h-5" />}
              title="Batafsil Hisobotlar"
              description="Real vaqtda statistika"
            />
          </div>

          {/* Trust Badges */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-sm text-slate-400 mb-4">Ishonchli bizneslar tanlovi</p>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">1000+</p>
                <p className="text-xs text-slate-400">Do'konlar</p>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">50K+</p>
                <p className="text-xs text-slate-400">Tranzaksiyalar</p>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">99.9%</p>
                <p className="text-xs text-slate-400">Uptime</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-white">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
}
