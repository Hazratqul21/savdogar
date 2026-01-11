"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { removeToken } from "@/lib/api";
import { usePermissions } from "@/hooks/usePermissions";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Warehouse,
    Users,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Receipt,
    BarChart3,
    UserPlus,
    Shield,
    Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

// Business types that DON'T need certain features
const EXCLUDED_FEATURES: Record<string, string[]> = {
    // Qahvaxona: ombor, mijozlar bazasi, jamoa kerak emas
    cafe: ["inventory", "customers", "team"],
    // Oshxona: ombor, mijozlar kerak emas
    kitchen: ["inventory", "customers"],
};

// Menu items with permission requirements
const MENU_ITEMS = [
    { 
        icon: LayoutDashboard, 
        label: "Dashboard", 
        href: "/dashboard", 
        permission: "dashboard",
        feature: "dashboard"
    },
    { 
        icon: ShoppingCart, 
        label: "POS Terminali", 
        href: "/pos", 
        permission: "pos",
        feature: "pos"
    },
    { 
        icon: Package, 
        label: "Mahsulotlar", 
        href: "/dashboard/products", 
        permission: "products",
        feature: "products"
    },
    { 
        icon: Warehouse, 
        label: "Ombor", 
        href: "/dashboard/inventory", 
        permission: "inventory",
        feature: "inventory"
    },
    { 
        icon: Receipt, 
        label: "Sotuvlar", 
        href: "/dashboard/sales", 
        permission: "reports",
        feature: "sales"
    },
    { 
        icon: Clock, 
        label: "Smena", 
        href: "/dashboard/shift", 
        permission: "pos",
        feature: "shift"
    },
    { 
        icon: Users, 
        label: "Mijozlar", 
        href: "/dashboard/customers", 
        permission: "customers",
        feature: "customers"
    },
    { 
        icon: BarChart3, 
        label: "Hisobotlar", 
        href: "/dashboard/reports", 
        permission: "reports",
        feature: "reports"
    },
    { 
        icon: UserPlus, 
        label: "Jamoa", 
        href: "/dashboard/team", 
        permission: "team",
        feature: "team"
    },
    { 
        icon: Settings, 
        label: "Sozlamalar", 
        href: "/dashboard/settings", 
        permission: "settings",
        feature: "settings"
    },
];

// Super Admin menu item (separate)
const ADMIN_ITEM = {
    icon: Shield,
    label: "Super Admin",
    href: "/admin",
    permission: "*",
    feature: "admin"
};

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(true);
    const [profile, setProfile] = useState<any>({});
    const [businessType, setBusinessType] = useState<string>("retail");
    const pathname = usePathname();
    const router = useRouter();
    const permissions = usePermissions();

    useEffect(() => {
        // Open on desktop by default
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            setCollapsed(false);
        }

        // Get business type from localStorage
        const storedBusinessType = localStorage.getItem("business_type");
        if (storedBusinessType) {
            setBusinessType(storedBusinessType);
        }

        // Fetch profile
        const fetchProfile = async () => {
            try {
                const { getSettings } = await import("@/lib/api");
                const data = await getSettings();
                setProfile(data.user || {});
                // Also update business type from API
                if (data.tenant?.business_type) {
                    setBusinessType(data.tenant.business_type);
                    localStorage.setItem("business_type", data.tenant.business_type);
                }
            } catch (e) {
                console.error("Failed to fetch profile:", e);
            }
        };
        fetchProfile();
    }, []);

    // Filter menu items based on permissions AND business type
    // Super admin sees ALL menu items regardless of business type
    const isSuperAdmin = permissions.role === "super_admin";
    const excludedFeatures = isSuperAdmin ? [] : (EXCLUDED_FEATURES[businessType] || []);
    const visibleMenuItems = MENU_ITEMS.filter(item => {
        // Check permission first
        if (!permissions.hasPermission(item.permission)) return false;
        // Check if feature is excluded for this business type (skip for super_admin)
        if (excludedFeatures.includes(item.feature)) return false;
        return true;
    });

    // Add super admin link if user is super_admin
    if (permissions.role === "super_admin") {
        visibleMenuItems.push(ADMIN_ITEM);
    }

    const handleLogout = () => {
        localStorage.removeItem("user_role");
        localStorage.removeItem("user_permissions");
        localStorage.removeItem("tenant_id");
        localStorage.removeItem("business_type");
        removeToken();
        router.push("/login");
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            super_admin: "Super Admin",
            owner: "Egasi",
            manager: "Menejer",
            cashier: "Kassir",
            warehouse_manager: "Omborchi"
        };
        return labels[role] || role;
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
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-lg">S</span>
                    </div>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="ml-3"
                        >
                            <div className="font-bold text-lg whitespace-nowrap text-gray-900">Savdogar</div>
                            <div className="text-xs text-gray-500 whitespace-nowrap">Savdo boshqaruv tizimi</div>
                        </motion.div>
                    )}
                </div>

                {/* Menu */}
                <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {visibleMenuItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all group relative",
                                    isActive
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <item.icon 
                                    size={20} 
                                    strokeWidth={isActive ? 2.5 : 2} 
                                    className={cn("shrink-0", isActive ? "text-blue-600" : "text-gray-500")} 
                                />

                                {!collapsed && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col"
                                    >
                                        <span className={cn("font-medium whitespace-nowrap text-sm", isActive && "font-semibold")}>
                                            {item.label}
                                        </span>
                                    </motion.div>
                                )}

                                {/* Tooltip for collapsed state */}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                        {item.label}
                                    </div>
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
                            <p className="font-medium text-gray-900 text-sm">{profile.full_name || profile.username || "Foydalanuvchi"}</p>
                            <p className="text-xs text-gray-500">{getRoleLabel(permissions.role)}</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center gap-3 w-full p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors text-gray-700", 
                            collapsed && "justify-center"
                        )}
                    >
                        <LogOut size={18} className="text-current" />
                        {!collapsed && <span className="font-medium text-sm">Chiqish</span>}
                    </button>
                </div>
            </motion.div>
        </>
    );
}
