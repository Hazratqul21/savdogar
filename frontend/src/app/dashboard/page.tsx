"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    ShoppingBag,
    Scissors,
    Gem,
    Coffee,
    TrendingUp,
    Users,
    Package,
    AlertCircle,
    Printer
} from "lucide-react";
import Link from "next/link";
import { DemoDataSeeder } from "@/components/settings/demo-seeder";
import { usePOSStore } from "@/stores/pos-store"; // We'll assume we can store/get business type here or fetching
// import { useAuth } from "@/hooks/use-auth"; // If available

// Mocking fetching business type from user profile (locally stored or context)
const getUserBusinessType = () => {
    // In real app, fetching from API /user/me
    if (typeof window !== 'undefined') {
        return localStorage.getItem("business_type") || "retail"; // Default
    }
    return "retail";
};

export default function DashboardPage() {
    const [businessType, setBusinessType] = useState<string>("retail");

    useEffect(() => {
        // Simulating fetch
        const type = getUserBusinessType();
        setBusinessType(type);
    }, []);

    const renderRetailDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Bugungi Savdo" value="12,450,000 UZS" icon={<TrendingUp className="text-green-500" />} />
            <StatsCard title="Mijozlar" value="145" icon={<Users className="text-blue-500" />} />
            <StatsCard title="Kam qolgan tovarlar" value="12" icon={<AlertCircle className="text-red-500" />} />
            <StatsCard title="Yaroqlilik muddati" value="5 ta ogohlantirish" icon={<Package className="text-orange-500" />} />
        </div>
    );

    const renderFashionDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Bugungi Savdo" value="8,200,000 UZS" icon={<TrendingUp className="text-purple-500" />} />
            <StatsCard title="Trenddagi Modellar" value="Oversize T-Shirt" icon={<Scissors className="text-pink-500" />} />
            <StatsCard title="Eng ko'p sotilgan o'lcham" value="L (Large)" icon={<Users className="text-blue-500" />} />
            <StatsCard title="Mavsumiy tovarlar" value="Qishki kolleksiya" icon={<Package className="text-indigo-500" />} />
        </div>
    );

    const renderJewelryDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Bugungi Savdo" value="25,000,000 UZS" icon={<TrendingUp className="text-amber-500" />} />
            <StatsCard title="Oltin kursi (1gr)" value="850,000 UZS" icon={<Gem className="text-yellow-400" />} />
            <StatsCard title="Sotilgan to'plamlar" value="3 ta" icon={<Users className="text-blue-500" />} />
            <StatsCard title="Ombordagi qoldiq" value="142 dona" icon={<Package className="text-slate-400" />} />
        </div>
    );

    const renderHorecaDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Bugungi Savdo" value="5,600,000 UZS" icon={<TrendingUp className="text-orange-500" />} />
            <StatsCard title="Buyurtmalar" value="48 ta" icon={<Coffee className="text-brown-500" />} />
            <StatsCard title="Band stollar" value="5 / 12" icon={<Users className="text-blue-500" />} />
            <StatsCard title="Oshxona yuki" value="O'rta" icon={<AlertCircle className="text-green-500" />} />
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Xush kelibsiz
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Sizning faoliyat turi: <span className="font-semibold text-primary capitalize">{businessType === 'retail' ? 'Oziq-ovqat' : businessType === 'fashion' ? 'Kiyim-kechak' : businessType === 'jewelry' ? 'Bijuteriya' : 'Kafe/Restoran'}</span>
                    </p>
                </div>
                <div className="px-4 py-2 rounded-full glass bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                    {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Onboarding / Seed Data for new users */}
                <DemoDataSeeder />

                {businessType === 'retail' && renderRetailDashboard()}
                {businessType === 'fashion' && renderFashionDashboard()}
                {businessType === 'jewelry' && renderJewelryDashboard()}
                {businessType === 'horeca' && renderHorecaDashboard()}
            </motion.div>

            {/* Common Section: Recent Sales / Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
                    <h2 className="text-lg font-bold mb-4">So'nggi savdolar</h2>
                    <div className="h-64 flex items-center justify-center text-muted-foreground bg-white/5 rounded-xl border border-dashed border-white/10">
                        Grafik yoki jadval joyi (Tez orada)
                    </div>
                </div>
                <div className="glass-card p-6 rounded-2xl">
                    <h2 className="text-lg font-bold mb-4">Tezkor amallar</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <ActionButton icon={<ShoppingBag />} label="Yangi Savdo" href="/dashboard/pos" />
                        <ActionButton icon={<Printer />} label="Etiketkalar" href="/dashboard/labels" />
                        <ActionButton icon={<Users />} label="Mijozlar" href="#" />
                        <ActionButton icon={<TrendingUp />} label="Hisobot" href="#" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="glass-card p-6 rounded-2xl hover:bg-white/5 transition-colors group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-white/5 group-hover:bg-primary/10 transition-colors">
                    {icon}
                </div>
                {/* <span className="text-xs text-green-400 font-medium">+12%</span> */}
            </div>
            <h3 className="text-muted-foreground text-sm font-medium mb-1">{title}</h3>
            <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">{value}</p>
        </div>
    );
}

function ActionButton({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
    return (
        <Link href={href} className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 hover:bg-primary/20 hover:scale-105 transition-all border border-white/10 group cursor-pointer">
            <div className="mb-2 text-muted-foreground group-hover:text-primary transition-colors">
                {icon}
            </div>
            <span className="text-xs font-medium text-center">{label}</span>
        </Link>
    );
}
