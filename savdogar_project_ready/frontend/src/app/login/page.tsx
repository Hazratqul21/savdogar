"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Zap } from "lucide-react";
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
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Kirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center mesh-gradient text-foreground p-4">
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-[2.5rem] p-8 md:p-10 neon-border relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 translate-y-[-50%]" />

          <div className="flex flex-col items-center mb-10 relative z-10">
            <img
              src="/logo.png"
              alt="Savdogar Logo"
              className="w-16 h-16 object-contain shadow-glow rounded-2xl mb-4"
            />
            <h1 className="text-3xl font-black tracking-tighter flex items-center">
              <span className="text-foreground">Savdo</span>
              <span className="text-primary ml-[1px]">gar</span>
            </h1>




            <p className="text-sm text-foreground/60 font-medium mt-1">Avtomatlashtirilgan Biznes Boshqaruvi</p>
          </div>


          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-sm font-bold ml-1 opacity-70">Login / Email / Tel</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:neon-border focus:outline-none transition-all placeholder:text-muted-foreground/30 font-medium"
                placeholder="Username yoki Email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold ml-1 opacity-70">Parol</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:neon-border focus:outline-none transition-all placeholder:text-muted-foreground/30 font-medium"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-primary text-white font-black text-lg shadow-glow hover:translate-y--0.5 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "KIRILMOQDA..." : "KIRISH"}
            </button>
          </form>

          <div className="mt-10 text-center space-y-4 relative z-10">
            <p className="text-sm font-medium text-muted-foreground">
              Hisobingiz yo'qmi?{" "}
              <Link href="/signup" className="text-secondary font-bold hover:underline">
                Ro'yxatdan o'tish
              </Link>
            </p>
            <Link href="/" className="block text-xs font-bold opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest">
              ← ASOSIY SAHIFA
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}









