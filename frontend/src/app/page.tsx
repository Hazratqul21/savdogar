"use client";

import { ArrowRight, Smartphone, BrainCircuit, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Savdogar Logo"
              className="w-10 h-10 object-contain rounded-xl"
            />
            <span className="text-2xl font-bold tracking-tight flex items-center">
              <span className="text-gray-900">Savdo</span>
              <span className="text-blue-600 ml-1">gar</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 font-medium text-sm">
            {['Xususiyatlar', 'Qanday ishlaydi', 'Narxlar', 'Mijozlarimiz'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-blue-600 transition-colors text-gray-700">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="px-5 py-2 hover:bg-gray-100 rounded-lg transition-all font-semibold text-gray-700">
              Kirish
            </Link>
            <Link href="/signup" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all">
              Boshlash
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight text-gray-900">
            Biznesingiz uchun <br />
            <span className="text-blue-600">Universal Savdo Tizimi</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 font-normal">
            Savdogar — bu shunchaki kassa emas, bu sizning biznesingizni boshqaradigan,
            daromadni oshiradigan va eng muhim qarorlarni qabul qilishda yordam beradigan intellektual tizimdir.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
              Bepul boshlash <ArrowRight size={20} />
            </Link>
            <button className="w-full sm:w-auto px-10 py-4 bg-white border border-gray-300 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-all">
              Demo ko'rish
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Asosiy Xususiyatlar</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Har bir funksiya — sizning biznesingizni rivojlantirish uchun.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-lg p-8 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-6 bg-blue-50 text-blue-600">
                  <f.icon size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto text-center">
          <div className="inline-block bg-gray-50 rounded-lg p-12 md:p-16 border border-gray-200">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight text-gray-900">
              Biznesingizni <br /> <span className="text-blue-600">Keyingi Darajaga</span> Olib Chiqing
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Savdogar — bu kelajak. Hozirdan boshlang va raqobatdan oldinda bo'ling.
            </p>
            <Link href="/signup" className="inline-flex px-12 py-5 bg-blue-600 text-white rounded-lg font-semibold text-xl hover:bg-blue-700 transition-all">
              TEZKOR BOSHLASH
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-tight flex items-center">
              <span className="text-gray-900">Savdo</span>
              <span className="text-blue-600 ml-1">gar</span>
            </span>
          </div>
          <p className="text-gray-600 text-sm">
            © 2025 Savdogar. Milliy tajriba, Global texnologiya.
          </p>

          <div className="flex gap-8 text-sm font-medium">
            <a href="#" className="hover:text-blue-600 transition-colors text-gray-700">Maxfiylik</a>
            <a href="#" className="hover:text-blue-600 transition-colors text-gray-700">Yordam</a>
            <a href="#" className="hover:text-blue-600 transition-colors text-gray-700">Kontakt</a>
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
  },
  {
    title: "Biznes Bashoratchi: Kelajak",
    desc: "O'zgarishlar qanday foyda keltirishini oldindan biling. Tavakkal qilishni to'xtating va faqat aniq hisob-kitobga tayanib biznesni rivojlantiring.",
    icon: BrainCircuit,
  },
  {
    title: "Avtonom Moliyachi: Nazorat",
    desc: "Xarajatlarni optimallashtirish va foydani ko'paytirish bo'yicha shaxsiy maslahatlar oling. Tizim sizning o'rningizga barcha hisob-kitoblarni yakunlaydi.",
    icon: BarChart3,
  }
];
