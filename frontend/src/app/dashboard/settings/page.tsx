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
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        Tizim Sozlamalari
                    </h1>
                    <p className="text-muted-foreground mt-2">Profil va biznesingizni mukammallashtiring.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-glow hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" /> : <Save size={18} />}
                    Saqlash
                </button>
            </header>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Tabs */}
                <aside className="w-full md:w-64 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group",
                                activeTab === tab.id
                                    ? "bg-accent text-accent-foreground shadow-md"
                                    : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <tab.icon size={20} className={cn(activeTab === tab.id && "text-primary")} />
                            <span className="font-medium">{tab.label}</span>
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="active-tab-indicator"
                                    className="absolute left-0 w-1 h-6 bg-primary rounded-full"
                                />
                            )}
                        </button>
                    ))}
                </aside>

                {/* Main Content Area */}
                <main className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="glass-card p-6 rounded-3xl border border-white/10"
                        >
                            {activeTab === "profile" && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <User size={22} className="text-primary" /> Shaxsiy Ma'lumotlar
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium opacity-70">To'liq ism</label>
                                            <input
                                                type="text"
                                                value={profile.fullName}
                                                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                                className="w-full bg-accent/30 border border-border/50 rounded-xl px-4 py-3 focus:ring-2 ring-primary/20 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium opacity-70">Email</label>
                                            <input
                                                type="email"
                                                value={profile.email}
                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                className="w-full bg-accent/30 border border-border/50 rounded-xl px-4 py-3 focus:ring-2 ring-primary/20 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium opacity-70">Telefon raqam</label>
                                            <input
                                                type="text"
                                                value={profile.phone}
                                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                className="w-full bg-accent/30 border border-border/50 rounded-xl px-4 py-3 focus:ring-2 ring-primary/20 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium opacity-70">Lavozim</label>
                                            <input
                                                type="text"
                                                disabled
                                                value={profile.role}
                                                className="w-full bg-accent/10 border border-border/50 rounded-xl px-4 py-3 text-muted-foreground outline-none cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "business" && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Building2 size={22} className="text-primary" /> Savdo Nuqtasi Sozlamalari
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium opacity-70">Do'kon nomi</label>
                                            <input
                                                type="text"
                                                value={business.name}
                                                onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                                                className="w-full bg-accent/30 border border-border/50 rounded-xl px-4 py-3 focus:ring-2 ring-primary/20 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium opacity-70">Faoliyat turi</label>
                                            <select
                                                value={business.type}
                                                onChange={(e) => setBusiness({ ...business, type: e.target.value })}
                                                className="w-full bg-accent/30 border border-border/50 rounded-xl px-4 py-3 focus:ring-2 ring-primary/20 outline-none"
                                            >
                                                {businessTypes.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium opacity-70">Dollar kursi (1 USD - UZS)</label>
                                            <div className="relative">
                                                <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
                                                <input
                                                    type="number"
                                                    value={business.usdRate}
                                                    onChange={(e) => setBusiness({ ...business, usdRate: Number(e.target.value) })}
                                                    className="w-full bg-accent/30 border border-border/50 rounded-xl pl-10 pr-4 py-3 focus:ring-2 ring-primary/20 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium opacity-70">Minimal foyda marjasi (%)</label>
                                            <input
                                                type="number"
                                                value={business.marginGuard}
                                                onChange={(e) => setBusiness({ ...business, marginGuard: Number(e.target.value) })}
                                                className="w-full bg-accent/30 border border-border/50 rounded-xl px-4 py-3 focus:ring-2 ring-primary/20 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                            <div className="flex gap-3">
                                                <div className="bg-primary/20 p-2 rounded-xl text-primary">
                                                    <Cpu size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-bold">Neural Singularity Mode</p>
                                                    <p className="text-xs text-muted-foreground">AI orqali avtonom boshqaruvni yoqish.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setBusiness({ ...business, aiMode: !business.aiMode })}
                                                className={cn(
                                                    "w-12 h-6 rounded-full transition-all relative",
                                                    business.aiMode ? "bg-primary" : "bg-muted"
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
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Palette size={22} className="text-primary" /> Interfeys sozlamalari
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-2xl border border-primary text-center bg-primary/5">
                                                <div className="w-full h-12 bg-card border border-border rounded mb-2" />
                                                <p className="text-sm font-medium">Ultra Glass (Default)</p>
                                            </div>
                                            <div className="p-4 rounded-2xl border border-border text-center opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer">
                                                <div className="w-full h-12 bg-card-foreground/10 border border-border rounded mb-2" />
                                                <p className="text-sm font-medium">Dark Minimal</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium opacity-70 flex items-center gap-2">
                                                <Globe size={16} /> Tizim tili
                                            </label>
                                            <select className="w-full bg-accent/30 border border-border/50 rounded-xl px-4 py-3 outline-none">
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
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <ShieldCheck size={22} className="text-primary" /> Xavfsizlik va Kirish
                                    </h3>
                                    <div className="space-y-4">
                                        <button className="w-full flex items-center justify-between p-4 bg-accent/20 rounded-2xl hover:bg-accent/30 transition-all">
                                            <div className="text-left">
                                                <p className="font-bold">Parol o'zgartirish</p>
                                                <p className="text-xs text-muted-foreground">Oxirgi marta 2 oy oldin o'zgartirilgan.</p>
                                            </div>
                                            <ChevronRight size={20} />
                                        </button>
                                        <div className="p-4 bg-destructive/10 rounded-2xl border border-destructive/20">
                                            <p className="font-bold text-destructive">Ikki bosqichli autentifikatsiya (2FA)</p>
                                            <p className="text-xs text-destructive opacity-70">Ushbu funksiya hozircha mavjud emas.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "notifications" && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Bell size={22} className="text-primary" /> Xabarnomalar
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-accent/20 rounded-2xl">
                                            <div className="flex gap-3">
                                                <Bell size={20} className="text-primary" />
                                                <p className="font-medium">Sotuv xabarnomalari</p>
                                            </div>
                                            <button className="w-10 h-5 bg-primary rounded-full relative">
                                                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-accent/20 rounded-2xl">
                                            <div className="flex gap-3">
                                                <Smartphone size={20} className="text-primary" />
                                                <p className="font-medium">Telegram orqali ogohlantirish</p>
                                            </div>
                                            <button className="w-10 h-5 bg-muted rounded-full relative">
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

function ChevronRight({ size }: { size: number }) {
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
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}
