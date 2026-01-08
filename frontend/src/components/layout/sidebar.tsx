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
    Tag,
    FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
    { icon: LayoutDashboard, label: "Boshqaruv paneli", href: "/admin" },
    { icon: ShoppingCart, label: "POS Terminali", href: "/pos" },
    { icon: Tag, label: "Label Studio", href: "/admin/labels" },
    { icon: Receipt, label: "Fakturalar", href: "/admin/invoices" },
    { icon: Box, label: "Ombor", href: "/admin/inventory" },
    { icon: FileText, label: "Nakladnoy Skaner", href: "/admin/inventory/nakladnoy" },
    { icon: Users, label: "Mijozlar", href: "/admin/customers" },
    { icon: Settings, label: "Sozlamalar", href: "/admin/settings" },
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
                className="h-screen bg-white border-r border-gray-200 flex flex-col fixed md:relative z-40 shadow-sm"
            >
                {/* Toggle Button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-8 bg-white text-gray-700 p-1.5 rounded-full border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Logo */}
                <div className={cn("h-20 flex items-center px-6 border-b border-gray-200 transition-all", collapsed && "justify-center px-2")}>
                    <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-lg">S</span>
                    </div>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="ml-3"
                        >
                            <div className="font-bold text-lg whitespace-nowrap text-gray-900">Savdogar CRM</div>
                            <div className="text-xs text-gray-500 whitespace-nowrap">Universal savdo tizimi</div>
                        </motion.div>
                    )}
                </div>

                {/* Menu */}
                <div className="flex-1 py-4 px-3 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all group relative",
                                    isActive
                                        ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={cn("shrink-0", isActive ? "text-blue-600" : "text-gray-500")} />

                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={cn("font-medium whitespace-nowrap text-sm", isActive && "font-semibold")}
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* User Profile / Logout */}
                <div className="p-4 border-t border-gray-200 space-y-2">
                    {!collapsed && (
                        <div className="px-2 py-2 mb-2">
                            <p className="font-semibold text-xs truncate text-gray-500 mb-1">Foydalanuvchi</p>
                            <p className="font-medium text-gray-900 text-sm">{profile.full_name || "Manager"}</p>
                            <p className="text-xs text-gray-500">{profile.role || "Administrator"}</p>
                        </div>

                    )}
                    <button
                        onClick={handleLogout}
                        className={cn("flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-700", collapsed && "justify-center")}
                    >
                        <LogOut size={18} className="text-gray-500" />
                        {!collapsed && <span className="font-medium text-sm">Chiqish</span>}
                    </button>
                </div>

            </motion.div>
        </>
    );
}
