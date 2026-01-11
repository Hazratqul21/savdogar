"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Building2,
    ShieldCheck,
    Palette,
    Save,
    Globe,
    DollarSign,
    Cpu,
    Bell,
    Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
    getSettings,
    updateProfile as apiUpdateProfile,
    updateTenant as apiUpdateTenant
} from "@/lib/api";

// Mock data integration (later replace with real fetch)
const businessTypes = [
    { value: 'retail', label: 'Chakana savdo' },
    { value: 'fashion', label: 'Fashion / Kiyim-kechak' },
    { value: 'horeca', label: 'Kafe / Restoran' },
    { value: 'wholesale', label: 'Ulgurji savdo' },
    { value: 'jewelry', label: 'Zargarlik' },
    { value: 'cafe', label: 'Qahvaxona' },
    { value: 'kitchen', label: 'Oshxona' },
    { value: 'tobacco', label: 'Tamaki va Alkogol mahsulotlari' },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Form States
    const [profile, setProfile] = useState({
        fullName: "",
        email: "",
        phone: "",
        role: "",
        user_settings: {} as any
    });

    const [business, setBusiness] = useState({
        name: "",
        address: "",
        phone: "",
        type: "retail",
        currency: "UZS",
        usdRate: 12800,
        marginGuard: 5,
        aiMode: true,
        config: {} as any
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getSettings();
                setProfile({
                    fullName: data.user.full_name || "",
                    email: data.user.email || "",
                    phone: data.user.phone_number || "",
                    role: data.user.role || "",
                    user_settings: data.user.user_settings || {}
                });
                setBusiness({
                    name: data.tenant.name || "",
                    address: data.tenant.address || "",
                    phone: data.tenant.phone || "",
                    type: data.tenant.business_type || "retail",
                    currency: data.tenant.base_currency || "UZS",
                    usdRate: data.tenant.usd_to_uzs_rate || 12800,
                    marginGuard: data.tenant.min_margin_percent || 5,
                    aiMode: data.tenant.config?.ai_mode !== false,
                    config: data.tenant.config || {}
                });
            } catch (err) {
                console.error(err);
            } finally {
                setFetching(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await apiUpdateProfile({
                full_name: profile.fullName,
                email: profile.email,
                phone_number: profile.phone,
                user_settings: profile.user_settings
            });
            await apiUpdateTenant({
                name: business.name,
                usd_to_uzs_rate: business.usdRate,
                min_margin_percent: business.marginGuard,
                config: { ...business.config, ai_mode: business.aiMode }
            });
            alert("Muvaffaqiyatli saqlandi!");
        } catch (err) {
            alert("Saqlashda xatolik yuz berdi.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full" />
            </div>
        );
    }

    const tabs = [
        { id: "profile", label: "Profil", icon: User },
        { id: "business", label: "Biznes", icon: Building2 },
        { id: "security", label: "Xavfsizlik", icon: ShieldCheck },
        { id: "interface", label: "Interfeys", icon: Palette },
        { id: "notifications", label: "Xabarnomalar", icon: Bell },
    ];


    return (
        <div className="space-y-4 sm:space-y-6">
            <header className="flex items-center justify-between gap-2">
                <div>
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                        Sozlamalar
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Profil va biznes sozlamalari</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-2 sm:px-4 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {loading ? <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" /> : <Save size={16} />}
                    <span className="hidden sm:inline">Saqlash</span>
                </button>
            </header>

            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                {/* Sidebar Tabs - Horizontal scroll on mobile */}
                <aside className="w-full md:w-56 overflow-x-auto">
                    <div className="flex md:flex-col gap-1.5 min-w-max md:min-w-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg transition-all whitespace-nowrap text-sm",
                                    activeTab === tab.id
                                        ? "bg-blue-50 text-blue-600"
                                        : "hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                                )}
                            >
                                <tab.icon size={18} className={cn(activeTab === tab.id ? "text-blue-600" : "text-gray-500")} />
                                <span className={cn("font-medium", activeTab === tab.id && "font-semibold")}>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white p-6 rounded-lg border border-gray-200"
                        >
                            {activeTab === "profile" && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                                        <User size={22} className="text-blue-600" /> Shaxsiy Ma'lumotlar
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">To'liq ism</label>
                                            <input
                                                type="text"
                                                value={profile.fullName}
                                                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Email</label>
                                            <input
                                                type="email"
                                                value={profile.email}
                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Telefon raqam</label>
                                            <input
                                                type="text"
                                                value={profile.phone}
                                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Lavozim</label>
                                            <input
                                                type="text"
                                                disabled
                                                value={profile.role}
                                                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-500 outline-none cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "business" && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                                        <Building2 size={22} className="text-blue-600" /> Savdo Nuqtasi Sozlamalari
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Do'kon nomi</label>
                                            <input
                                                type="text"
                                                value={business.name}
                                                onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Faoliyat turi</label>
                                            <select
                                                value={business.type}
                                                onChange={(e) => setBusiness({ ...business, type: e.target.value })}
                                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                                            >
                                                {businessTypes.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Manzil</label>
                                            <input
                                                type="text"
                                                value={business.address}
                                                onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                                                placeholder="Toshkent sh., Chilonzor tumani"
                                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Telefon</label>
                                            <input
                                                type="tel"
                                                value={business.phone}
                                                onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                                                placeholder="+998 90 123 45 67"
                                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Dollar kursi (1 USD - UZS)</label>
                                            <div className="relative">
                                                <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="number"
                                                    value={business.usdRate}
                                                    onChange={(e) => setBusiness({ ...business, usdRate: Number(e.target.value) })}
                                                    className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Minimal foyda marjasi (%)</label>
                                            <input
                                                type="number"
                                                value={business.marginGuard}
                                                onChange={(e) => setBusiness({ ...business, marginGuard: Number(e.target.value) })}
                                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-200 space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex gap-3">
                                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                                    <Cpu size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">AI Rejimi</p>
                                                    <p className="text-xs text-gray-600">AI orqali avtonom boshqaruvni yoqish.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setBusiness({ ...business, aiMode: !business.aiMode })}
                                                className={cn(
                                                    "w-12 h-6 rounded-full transition-all relative",
                                                    business.aiMode ? "bg-blue-600" : "bg-gray-300"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                                                    business.aiMode ? "right-1" : "left-1"
                                                )} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "interface" && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                                        <Palette size={22} className="text-blue-600" /> Interfeys sozlamalari
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-lg border-2 border-blue-600 text-center bg-blue-50">
                                                <div className="w-full h-12 bg-white border border-gray-200 rounded mb-2" />
                                                <p className="text-sm font-medium text-gray-900">Oq Dizayn (Default)</p>
                                            </div>
                                            <div className="p-4 rounded-lg border border-gray-200 text-center opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer">
                                                <div className="w-full h-12 bg-gray-100 border border-gray-200 rounded mb-2" />
                                                <p className="text-sm font-medium text-gray-700">Qorong'u Dizayn</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                <Globe size={16} /> Tizim tili
                                            </label>
                                            <select className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900">
                                                <option>O'zbekcha</option>
                                                <option>Русский</option>
                                                <option>English</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "security" && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                                        <ShieldCheck size={22} className="text-blue-600" /> Xavfsizlik va Kirish
                                    </h3>
                                    <div className="space-y-4">
                                        <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-gray-200">
                                            <div className="text-left">
                                                <p className="font-semibold text-gray-900">Parol o'zgartirish</p>
                                                <p className="text-xs text-gray-600">Oxirgi marta 2 oy oldin o'zgartirilgan.</p>
                                            </div>
                                            <ChevronRight size={20} className="text-gray-400" />
                                        </button>
                                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                            <p className="font-semibold text-red-700">Ikki bosqichli autentifikatsiya (2FA)</p>
                                            <p className="text-xs text-red-600">Ushbu funksiya hozircha mavjud emas.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "notifications" && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                                        <Bell size={22} className="text-blue-600" /> Xabarnomalar
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex gap-3">
                                                <Bell size={20} className="text-blue-600" />
                                                <p className="font-medium text-gray-900">Sotuv xabarnomalari</p>
                                            </div>
                                            <button className="w-10 h-5 bg-blue-600 rounded-full relative">
                                                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex gap-3">
                                                <Smartphone size={20} className="text-blue-600" />
                                                <p className="font-medium text-gray-900">Telegram orqali ogohlantirish</p>
                                            </div>
                                            <button className="w-10 h-5 bg-gray-300 rounded-full relative">
                                                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

function ChevronRight({ size, className }: { size: number; className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}
