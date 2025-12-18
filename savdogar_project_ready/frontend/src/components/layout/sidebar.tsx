"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { removeToken } from "@/lib/api";
import {
    LayoutDashboard,
    ShoppingCart,
    Box,
    Users,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Receipt,
    Tag
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
    { icon: LayoutDashboard, label: "Boshqaruv paneli", href: "/dashboard" },
    { icon: ShoppingCart, label: "POS Terminali", href: "/dashboard/pos" },
    { icon: Tag, label: "Label Studio", href: "/dashboard/labels" },
    { icon: Receipt, label: "Fakturalar", href: "/dashboard/invoices" },
    { icon: Box, label: "Ombor", href: "/dashboard/inventory" },
    { icon: Users, label: "Mijozlar", href: "/dashboard/customers" },
    { icon: Settings, label: "Sozlamalar", href: "/dashboard/settings" },
];

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(true); // Default collapsed for mobile/desktop initially
    const [profile, setProfile] = useState<any>({});

    useEffect(() => {
        // Open on desktop by default
        if (window.innerWidth >= 768) {
            setCollapsed(false);
        }

        // Fetch profile
        const fetchProfile = async () => {
            try {
                const { getSettings } = await import("@/lib/api");
                const data = await getSettings();
                setProfile(data.user);
            } catch (e) { }
        };
        fetchProfile();
    }, []);


    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        removeToken();
        router.push("/login");
    };

    return (
        <>
            {/* Mobile Overlay */}
            {!collapsed && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setCollapsed(true)}
                />
            )}

            <motion.div
                animate={{
                    width: collapsed ? 80 : 280,
                    x: (typeof window !== 'undefined' && window.innerWidth < 768 && collapsed) ? -80 : 0
                }}
                className="h-screen bg-card border-r border-border flex flex-col fixed md:relative z-40"
            >
                {/* Toggle Button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-8 bg-primary text-primary-foreground p-1 rounded-full border border-border shadow-lg"
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Logo */}
                <div className={cn("h-16 flex items-center px-6 border-b border-border transition-all", collapsed && "justify-center px-2")}>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-lg">S</span>
                    </div>
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="ml-3 font-bold text-lg whitespace-nowrap"
                        >
                            Savdogar
                        </motion.span>
                    )}
                </div>

                {/* Menu */}
                <div className="flex-1 py-6 px-3 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative overflow-hidden",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-glow"
                                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />

                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="font-medium whitespace-nowrap"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}

                                {/* Hover Effect */}
                                {!isActive && (
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* User Profile / Logout */}
                <div className="p-4 border-t border-border space-y-2">
                    {!collapsed && (
                        <div className="px-2 py-1 mb-2">
                            <p className="font-bold text-sm truncate uppercase tracking-wider opacity-50">Foydalanuvchi</p>
                            <p className="font-medium text-primary uppercase">{profile.full_name || "Manager"}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{profile.role || "Administrator"}</p>
                        </div>

                    )}
                    <button
                        onClick={handleLogout}
                        className={cn("flex items-center gap-3 w-full p-2 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground", collapsed && "justify-center")}
                    >
                        <LogOut size={20} />
                        {!collapsed && <span className="font-medium">Chiqish</span>}
                    </button>
                </div>

            </motion.div>
        </>
    );
}
