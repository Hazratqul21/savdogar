"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    Clock,
    Coffee,
    Store,
    Menu,
    X,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

// Business types that DON'T need certain features
const EXCLUDED_FEATURES: Record<string, string[]> = {
    cafe: ["inventory", "customers", "team"],
    kitchen: ["inventory", "customers"],
    retail: ["modifiers"],
    wholesale: ["modifiers"],
    fashion: ["modifiers"],
    jewelry: ["modifiers"],
    tobacco: ["modifiers"],
    plumbing_hvac: ["modifiers"],
};

// Menu items with permission requirements
const MENU_ITEMS = [
    { 
        icon: LayoutDashboard, 
        label: "Dashboard", 
        description: "Asosiy ko'rsatkichlar",
        href: "/dashboard", 
        permission: "dashboard",
        feature: "dashboard"
    },
    { 
        icon: ShoppingCart, 
        label: "POS Terminali", 
        description: "Sotuv qilish",
        href: "/pos", 
        permission: "pos",
        feature: "pos",
        highlight: true
    },
    { 
        icon: Package, 
        label: "Mahsulotlar", 
        description: "Tovarlar boshqaruvi",
        href: "/dashboard/products", 
        permission: "products",
        feature: "products"
    },
    { 
        icon: Warehouse, 
        label: "Ombor", 
        description: "Inventar va zaxira",
        href: "/dashboard/inventory", 
        permission: "inventory",
        feature: "inventory"
    },
    { 
        icon: Receipt, 
        label: "Sotuvlar", 
        description: "Tranzaksiyalar tarixi",
        href: "/dashboard/sales", 
        permission: "reports",
        feature: "sales"
    },
    { 
        icon: Clock, 
        label: "Smena", 
        description: "Ish vaqti hisobi",
        href: "/dashboard/shift", 
        permission: "pos",
        feature: "shift"
    },
    { 
        icon: Users, 
        label: "Mijozlar", 
        description: "Mijozlar bazasi",
        href: "/dashboard/customers", 
        permission: "customers",
        feature: "customers"
    },
    { 
        icon: Coffee, 
        label: "Modifikatorlar", 
        description: "Qo'shimcha ingredientlar",
        href: "/dashboard/modifiers", 
        permission: "products",
        feature: "modifiers"
    },
    { 
        icon: BarChart3, 
        label: "Hisobotlar", 
        description: "Statistika va tahlil",
        href: "/dashboard/reports", 
        permission: "reports",
        feature: "reports"
    },
    { 
        icon: UserPlus, 
        label: "Jamoa", 
        description: "Xodimlar boshqaruvi",
        href: "/dashboard/team", 
        permission: "team",
        feature: "team"
    },
    { 
        icon: Settings, 
        label: "Sozlamalar", 
        description: "Tizim konfiguratsiyasi",
        href: "/dashboard/settings", 
        permission: "settings",
        feature: "settings"
    },
];

// Super Admin menu item
const ADMIN_ITEM = {
    icon: Shield,
    label: "Super Admin",
    description: "Admin paneli",
    href: "/admin",
    permission: "*",
    feature: "admin"
};

// Business type display names
const BUSINESS_TYPE_NAMES: Record<string, string> = {
    retail: "Chakana Savdo",
    fashion: "Kiyim-kechak",
    horeca: "Kafe/Restoran",
    wholesale: "Optom Savdo",
    jewelry: "Bijuteriya",
    cafe: "Qahvaxona",
    kitchen: "Oshxona",
    plumbing_hvac: "Santexnika",
    tobacco: "Tamaki"
};

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profile, setProfile] = useState<any>({});
    const [businessType, setBusinessType] = useState<string>("retail");
    const [tenantName, setTenantName] = useState<string>("");
    const pathname = usePathname();
    const router = useRouter();
    const permissions = usePermissions();

    useEffect(() => {
        // Collapsed by default on desktop, hidden on mobile
        if (typeof window !== 'undefined') {
            setCollapsed(window.innerWidth >= 768 && window.innerWidth < 1280);
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
                if (data.tenant?.business_type) {
                    setBusinessType(data.tenant.business_type);
                    localStorage.setItem("business_type", data.tenant.business_type);
                }
                if (data.tenant?.name) {
                    setTenantName(data.tenant.name);
                }
            } catch (e) {
                console.error("Failed to fetch profile:", e);
            }
        };
        fetchProfile();
    }, []);

    // Filter menu items
    const isSuperAdmin = permissions.role === "super_admin";
    const excludedFeatures = isSuperAdmin ? [] : (EXCLUDED_FEATURES[businessType] || []);
    const visibleMenuItems = MENU_ITEMS.filter(item => {
        if (!permissions.hasPermission(item.permission)) return false;
        if (excludedFeatures.includes(item.feature)) return false;
        return true;
    });

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

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            super_admin: "bg-purple-500/20 text-purple-400",
            owner: "bg-amber-500/20 text-amber-400",
            manager: "bg-blue-500/20 text-blue-400",
            cashier: "bg-emerald-500/20 text-emerald-400",
            warehouse_manager: "bg-orange-500/20 text-orange-400"
        };
        return colors[role] || "bg-gray-500/20 text-gray-400";
    };

    // Sidebar content (shared between mobile and desktop)
    const SidebarContent = () => (
        <>
            {/* Logo & Brand */}
            <div className={cn(
                "flex items-center h-16 px-4 border-b border-white/10",
                collapsed ? "justify-center" : "gap-3"
            )}>
                <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Store className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                </div>
                
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <h1 className="font-bold text-lg text-white whitespace-nowrap">
                                Savdo<span className="text-blue-400">gar</span>
                            </h1>
                            <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                {BUSINESS_TYPE_NAMES[businessType] || "POS System"}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Quick POS Button - When collapsed */}
            {collapsed && (
                <div className="px-3 py-4 border-b border-white/10">
                    <Link href="/pos">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
                        >
                            <Zap className="w-5 h-5 text-white" />
                        </motion.button>
                    </Link>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                <ul className="space-y-1">
                    {visibleMenuItems.map((item) => {
                        const isActive = pathname === item.href || 
                            (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        "nav-item group relative",
                                        isActive ? "nav-item-active" : "nav-item-inactive",
                                        collapsed && "justify-center px-3"
                                    )}
                                >
                                    <Icon 
                                        className={cn(
                                            "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                                            isActive ? "text-white" : "text-slate-400 group-hover:text-white",
                                            !collapsed && "group-hover:scale-110"
                                        )}
                                    />
                                    
                                    <AnimatePresence>
                                        {!collapsed && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className={cn(
                                                    "whitespace-nowrap",
                                                    isActive ? "text-white font-semibold" : "text-slate-300"
                                                )}
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>

                                    {/* Tooltip for collapsed state */}
                                    {collapsed && (
                                        <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                                            <div className="font-medium">{item.label}</div>
                                            {'description' in item && (
                                                <div className="text-xs text-slate-400 mt-0.5">{item.description}</div>
                                            )}
                                            {/* Tooltip arrow */}
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 rotate-45"></div>
                                        </div>
                                    )}

                                    {/* Active indicator */}
                                    {isActive && !collapsed && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white"
                                        />
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User Profile & Logout */}
            <div className="border-t border-white/10 p-4">
                {!collapsed && (
                    <div className="mb-4 px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-semibold text-sm">
                                {(profile.full_name || profile.username || "U").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {profile.full_name || profile.username || "Foydalanuvchi"}
                                </p>
                                <span className={cn(
                                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1",
                                    getRoleBadgeColor(permissions.role)
                                )}>
                                    {getRoleLabel(permissions.role)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl",
                        "text-slate-400 hover:text-red-400 hover:bg-red-500/10",
                        "transition-all duration-200",
                        collapsed && "justify-center px-3"
                    )}
                >
                    <LogOut className="w-5 h-5" />
                    {!collapsed && <span className="text-sm font-medium">Chiqish</span>}
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-xl bg-slate-900 text-white shadow-lg"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />
                )}
            </AnimatePresence>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.aside
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="md:hidden fixed inset-y-0 left-0 w-72 bg-slate-900 z-50 flex flex-col"
                    >
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <SidebarContent />
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: collapsed ? 72 : 260 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="hidden md:flex flex-col h-screen bg-slate-900 border-r border-white/5 relative"
            >
                {/* Collapse Toggle Button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-10"
                >
                    {collapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </button>

                <SidebarContent />
            </motion.aside>
        </>
    );
}
