"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Zap, Shield, BarChart3, Receipt, Sparkles, Star, Smartphone, Globe, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="min-h-screen mesh-gradient text-foreground overflow-x-hidden selection:bg-secondary/30 selection:text-secondary">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <img
              src="/logo.png"
              alt="Savdogar Logo"
              className="w-10 h-10 object-contain shadow-glow rounded-xl group-hover:scale-110 transition-transform"
            />
            <span className="text-2xl font-bold tracking-tighter flex items-center">
              <span className="text-foreground">Savdo</span>
              <span className="text-primary ml-[1px]">gar</span>
            </span>


          </div>

          <div className="hidden md:flex items-center gap-8 font-medium text-sm">
            {['Xususiyatlar', 'Qanday ishlaydi', 'Narxlar', 'Mijozlarimiz'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-primary transition-colors text-foreground/80">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="px-5 py-2 hover:bg-primary/10 rounded-full transition-all font-bold text-foreground">
              Kirish
            </Link>
            <Link href="/signup" className="px-6 py-2 bg-primary text-white rounded-full font-black shadow-glow hover:scale-105 active:scale-95 transition-all">
              Boshlash
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6">
        <div className="container mx-auto text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tight text-foreground"
          >
            Biznesingiz uchun <br />
            <span className="text-gradient">Neural Ekosistema</span>
          </motion.h1>


          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-foreground/70 max-w-3xl mx-auto mb-12 font-medium"
          >
            Savdogar — bu shunchaki kassa emas, bu sizning biznesingizni boshqaradigan,
            daromadni oshiradigan va eng muhim qarorlarni qabul qilishda yordam beradigan intellektual miyadir.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/signup" className="w-full sm:w-auto px-10 py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-glow hover:translate-y--1 transition-all flex items-center justify-center gap-2">
              Bepul boshlash <ArrowRight size={20} />
            </Link>
            <button className="w-full sm:w-auto px-10 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-md">
              Demo ko'rish
            </button>
          </motion.div>
        </div>

        {/* Dashboard Preview Overlay */}
        <motion.div
          initial={{ opacity: 0, y: 100, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 5 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="container mx-auto mt-20 relative"
          style={{ perspective: '2000px' }}
        >
          <div className="neon-border rounded-[2.5rem] overflow-hidden bg-background/50 backdrop-blur-2xl shadow-2xl p-2 max-w-5xl mx-auto">
            <div className="bg-background/40 rounded-[2rem] h-[500px] flex items-center justify-center relative overflow-hidden">
              {/* Mock UI Elements */}
              <div className="absolute top-10 left-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary/10 blur-3xl rounded-full" />
              <BrainCircuit size={100} className="text-primary/40 animate-pulse" />
              <div className="absolute bottom-10 left-10 right-10 grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-20 glass-card rounded-2xl p-4 border-white/5">
                    <div className="w-10 h-2 bg-white/10 rounded-full mb-2" />
                    <div className="w-20 h-4 bg-white/20 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6 text-gradient italic">Neural Ecosystem</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Har bir tugma, har bir amal — sun'iy intellekt tomonidan boshqariladi.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-[2rem] p-10 group hover:neon-border transition-all cursor-default"
              >
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 bg-white/5 text-primary group-hover:scale-110 group-hover:shadow-glow transition-all", f.color)}>
                  <f.icon size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-white/2">
        <div className="container mx-auto px-6 overflow-hidden">
          <p className="text-center text-sm font-bold uppercase tracking-[0.3em] opacity-30 mb-12">Ishonchli Hamkorlar</p>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24 grayscale opacity-40">
            <Star size={40} />
            <Smartphone size={40} />
            <Globe size={40} />
            <BrainCircuit size={40} />
            <Sparkles size={40} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-40 px-6 relative">
        <div className="container mx-auto text-center">
          <div className="inline-block glass-card rounded-[3rem] p-12 md:p-24 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <h2 className="text-5xl md:text-7xl font-black mb-8 relative z-10 leading-tight">
              Biznesingizni <br /> <span className="text-gradient">Singularity</span> darajasiga olib chiqing
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto relative z-10">
              Savdogar — bu kelajak. Hozirdan boshlang va raqobatdan 10 qadam oldinda boling.
            </p>
            <Link href="/signup" className="inline-flex px-12 py-5 bg-white text-black rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all relative z-10 shadow-2xl">
              TEZKOR BOSHLASH
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-tighter flex items-center">
              <span className="text-foreground">Savdo</span>
              <span className="text-primary ml-[1px]">gar</span>
            </span>
          </div>
          <p className="text-foreground/60 text-sm">
            © 2025 Savdogar. Milliy tajriba, Global texnologiya.
          </p>

          <div className="flex gap-8 text-sm font-medium">
            <a href="#" className="hover:text-primary transition-colors">Maxfiylik</a>
            <a href="#" className="hover:text-primary transition-colors">Yordam</a>
            <a href="#" className="hover:text-primary transition-colors">Kontakt</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: "Smart Scan: Avtomatlashtirish",
    desc: "Barcha xarid cheklari va hujjatlarni rasmga olib, bir zumda bazaga kiriting. Inson xatolariga yo'l qo'ymang va vaqtingizni tejang.",
    icon: Smartphone,
    color: "text-primary"
  },
  {
    title: "Biznes Bashoratchi: Kelajak",
    desc: "O'zgarishlar qanday foyda keltirishini oldindan biling. Tavakkal qilishni to'xtating va faqat aniq hisob-kitobga tayanib biznesni rivojlantiring.",
    icon: BrainCircuit,
    color: "text-secondary"
  },
  {
    title: "Avtonom Moliyachi: Nazorat",
    desc: "Xarajatlarni optimallashtirish va foydani ko'paytirish bo'yicha shaxsiy maslahatlar oling. Tizim sizning o'rningizga barcha hisob-kitoblarni yakunlaydi.",
    icon: BarChart3,
    color: "text-accent"
  }
];

