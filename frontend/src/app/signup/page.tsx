"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Zap } from "lucide-react";
import { signup, login, saveToken } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone_number: "",
    full_name: "",
    business_type: "retail", // Default to Grocery
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Prepare signup data
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

      // Create user
      await signup(signupData);

      // Auto login after signup
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
    <div className="min-h-screen flex items-center justify-center mesh-gradient text-foreground p-6 py-20">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-[2.5rem] p-8 md:p-12 neon-border relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-40 h-40 bg-secondary/10 blur-3xl rounded-full translate-x-[-50%] translate-y-[-50%]" />

          <div className="flex flex-col items-center mb-10 relative z-10">
            <img
              src="/logo.png"
              alt="Savdogar Logo"
              className="w-20 h-20 object-contain shadow-glow rounded-3xl mb-4"
            />
            <h1 className="text-3xl font-black tracking-tighter flex items-center">
              <span className="text-foreground">Savdo</span>
              <span className="text-primary ml-[1px]">gar</span>
            </h1>

            <p className="text-sm font-bold text-foreground/60 uppercase tracking-widest mt-2">Biznesingizni Avtomatlashtiring</p>


          </div>


          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 relative z-10">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest ml-1 opacity-50">Biznesingiz turi</label>
              <div className="relative group">
                <select
                  value={formData.business_type}
                  onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                  className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:neon-border focus:outline-none transition-all appearance-none cursor-pointer font-bold"
                  required
                >
                  <option value="retail" className="bg-background">Oziq-ovqat Do'koni</option>
                  <option value="fashion" className="bg-background">Kiyim-kechak</option>
                  <option value="jewelry" className="bg-background">Zargarlik / Aksessuarlar</option>
                  <option value="horeca" className="bg-background">Kafe / Oshxona</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                  <Zap size={16} className="text-primary" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest ml-1 opacity-50">Ismingiz</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 focus:neon-border focus:outline-none transition-all font-medium"
                placeholder="Azizbek"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest ml-1 opacity-50">Loginingiz</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 focus:neon-border focus:outline-none transition-all font-medium"
                placeholder="aziz_dev"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest ml-1 opacity-50">Email Manzilingiz</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 focus:neon-border focus:outline-none transition-all font-medium"
                placeholder="aziz@savdogar.uz"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest ml-1 opacity-50">Parol Yarating</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 focus:neon-border focus:outline-none transition-all font-medium"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 rounded-2xl bg-primary text-white font-black text-xl shadow-glow hover:translate-y--1 active:scale-95 transition-all md:col-span-2 mt-4"
            >
              {loading ? "TAYYORLANMOQDA..." : "HISOB YARATISH"}
            </button>
          </form>

          <div className="mt-10 text-center space-y-4 relative z-10 border-t border-white/5 pt-8">
            <p className="text-sm font-medium opacity-60">
              Allaqachon a'zomisiz?{" "}
              <Link href="/login" className="text-accent font-black hover:underline px-2 py-1 bg-accent/5 rounded-lg">
                Kirish
              </Link>
            </p>
            <Link href="/" className="block text-xs font-black opacity-30 hover:opacity-100 transition-opacity uppercase tracking-widest">
              ← ASOSIY SAHIFA
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

