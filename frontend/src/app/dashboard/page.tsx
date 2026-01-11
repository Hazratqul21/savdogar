"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
    TrendingUp,
    TrendingDown,
    Users,
    Package,
    AlertCircle,
    ShoppingCart,
    BarChart3,
    ArrowRight,
    Loader2,
    DollarSign,
    Receipt,
    AlertTriangle,
    Clock
} from "lucide-react";
import Link from "next/link";
import { usePermissions } from "@/hooks/usePermissions";
import { getAuthHeaders, getApiBaseUrl } from "@/lib/api";

// API functions
async function getDashboardStats() {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/v1/dashboard/stats`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
    }
    return response.json();
}

async function getRecentSales() {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/v1/v2/sales?limit=5`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        return [];
    }
    return response.json();
}

async function getExpiringProducts() {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/v1/v2/products/expiring?days=7`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        return { summary: { expired_count: 0, expiring_soon_count: 0, total_items: 0 }, items: [] };
    }
    return response.json();
}

// Format currency
function formatCurrency(value: number): string {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M so'm`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}K so'm`;
    }
    return `${value.toLocaleString()} so'm`;
}

// Business type labels
const BUSINESS_TYPE_LABELS: Record<string, string> = {
    retail: "Oziq-ovqat do'koni",
    fashion: "Kiyim-kechak",
    horeca: "Kafe / Restoran",
    wholesale: "Optom savdo",
    jewelry: "Bijuteriya",
    plumbing_hvac: "Santexnika",
    tobacco: "Tamaki do'koni",
    cafe: "Qahvaxona",
    kitchen: "Oshxona"
};

export default function DashboardPage() {
    const [businessType, setBusinessType] = useState<string>("retail");
    const [tenantName, setTenantName] = useState<string>("");
    const router = useRouter();
    const permissions = usePermissions();

    // Fetch dashboard stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: getDashboardStats,
        retry: 1,
        staleTime: 30000, // 30 seconds
    });

    // Fetch recent sales
    const { data: recentSales = [] } = useQuery({
        queryKey: ["recent-sales"],
        queryFn: getRecentSales,
        retry: 1,
    });

    // Fetch expiring products (only for retail/grocery business types)
    const { data: expiringData } = useQuery({
        queryKey: ["expiring-products"],
        queryFn: getExpiringProducts,
        retry: 1,
        enabled: businessType === "retail" || businessType === "grocery",
    });

    useEffect(() => {
        // Load business type from localStorage
        const type = localStorage.getItem("business_type") || "retail";
        setBusinessType(type);

        // Fetch tenant info
        const fetchTenantInfo = async () => {
            try {
                const { getSettings } = await import("@/lib/api");
                const data = await getSettings();
                
                if (data.tenant?.business_type) {
                    localStorage.setItem("business_type", data.tenant.business_type);
                    setBusinessType(data.tenant.business_type);
                }
                if (data.tenant?.name) {
                    setTenantName(data.tenant.name);
                }
                
                // Redirect cashiers to POS
                if (data.user?.role === 'cashier') {
                    router.replace('/pos');
                    return;
                }
            } catch (e) {
                console.error("Failed to fetch tenant info:", e);
            }
        };
        fetchTenantInfo();
    }, [router]);

    // Quick actions based on permissions
    const quickActions = [
        { icon: ShoppingCart, label: "Yangi Savdo", href: "/pos", permission: "pos" },
        { icon: Package, label: "Mahsulotlar", href: "/dashboard/products", permission: "products" },
        { icon: Users, label: "Mijozlar", href: "/dashboard/customers", permission: "customers" },
        { icon: BarChart3, label: "Hisobotlar", href: "/dashboard/reports", permission: "reports" },
    ].filter(action => permissions.hasPermission(action.permission));

    return (
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                        Xush kelibsiz{tenantName ? `, ${tenantName}` : ""}!
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                        <span className="font-medium text-blue-600">
                            {BUSINESS_TYPE_LABELS[businessType] || businessType}
                        </span>
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                    <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium">
                        {new Date().toLocaleDateString('uz-UZ', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                        })}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                    <StatsCard 
                        title="Bugungi Savdo" 
                        value={formatCurrency(stats?.today_sales || 0)}
                        icon={<DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />}
                        iconBg="bg-green-100"
                        iconColor="text-green-600"
                        trend={stats?.today_sales > 0 ? "+12%" : undefined}
                        trendUp={true}
                    />
                    <StatsCard 
                        title="Tranzaksiyalar" 
                        value={stats?.today_transactions?.toString() || "0"}
                        icon={<Receipt className="w-4 h-4 sm:w-5 sm:h-5" />}
                        iconBg="bg-blue-100"
                        iconColor="text-blue-600"
                    />
                    <StatsCard 
                        title="Mahsulotlar" 
                        value={stats?.total_products?.toString() || "0"}
                        icon={<Package className="w-4 h-4 sm:w-5 sm:h-5" />}
                        iconBg="bg-purple-100"
                        iconColor="text-purple-600"
                    />
                    <StatsCard 
                        title="Kam qolgan" 
                        value={stats?.low_stock_products?.toString() || "0"}
                        icon={<AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
                        iconBg="bg-red-100"
                        iconColor="text-red-600"
                        alert={stats?.low_stock_products > 0}
                    />
                </div>
            )}

            {/* Expiry Alert - Only for retail/grocery */}
            {(businessType === "retail" || businessType === "grocery") && expiringData?.summary?.total_items > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-orange-800">Muddati yaqinlashayotgan mahsulotlar</h3>
                            <p className="text-sm text-orange-700 mt-1">
                                {expiringData.summary.expired_count > 0 && (
                                    <span className="font-bold text-red-600">{expiringData.summary.expired_count} ta muddati o'tgan, </span>
                                )}
                                {expiringData.summary.expiring_soon_count} ta mahsulot 7 kun ichida eskiradi
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {expiringData.items.slice(0, 3).map((item: any) => (
                                    <span 
                                        key={item.variant_id}
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                            item.status === "expired" 
                                                ? "bg-red-100 text-red-700" 
                                                : "bg-orange-100 text-orange-700"
                                        }`}
                                    >
                                        <Clock className="w-3 h-3" />
                                        {item.product_name} - {item.days_until_expiry < 0 ? "Muddati o'tgan" : `${item.days_until_expiry} kun`}
                                    </span>
                                ))}
                                {expiringData.items.length > 3 && (
                                    <Link 
                                        href="/dashboard/inventory?tab=expiring"
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    >
                                        +{expiringData.items.length - 3} ta ko'proq
                                        <ArrowRight className="w-3 h-3" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {/* Recent Sales */}
                <div className="lg:col-span-2 bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100">
                        <h2 className="text-sm sm:text-base font-semibold text-gray-900">So'nggi sotuvlar</h2>
                        <Link 
                            href="/dashboard/sales" 
                            className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            Barchasi <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentSales.length > 0 ? (
                            recentSales.slice(0, 5).map((sale: any) => (
                                <div key={sale.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            #{sale.receipt_number || sale.id}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(sale.created_at).toLocaleDateString('uz-UZ')}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {formatCurrency(sale.total_amount)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {sale.payment_method === 'cash' ? 'Naqd' : 
                                             sale.payment_method === 'card' ? 'Karta' : 
                                             sale.payment_method}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 sm:p-8 text-center text-gray-500">
                                <Receipt className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
                                <p className="text-sm">Hali sotuvlar yo'q</p>
                                <Link 
                                    href="/pos" 
                                    className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                                >
                                    Sotuv qilish
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4">
                    <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Tezkor amallar</h2>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {quickActions.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-all group"
                            >
                                <div className="p-2 sm:p-3 rounded-full bg-white border border-gray-200 group-hover:border-blue-200 group-hover:bg-blue-100 transition-all mb-1.5 sm:mb-2">
                                    <action.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-blue-600" />
                                </div>
                                <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-blue-700 text-center">
                                    {action.label}
                                </span>
                            </Link>
                        ))}
                    </div>

                    {/* Monthly Summary */}
                    <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                        <h3 className="text-sm font-medium text-gray-800 mb-1">Oylik savdo</h3>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">
                            {formatCurrency(stats?.monthly_sales || 0)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                            {new Date().toLocaleString('uz-UZ', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface StatsCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    trend?: string;
    trendUp?: boolean;
    alert?: boolean;
}

function StatsCard({ title, value, icon, iconBg, iconColor, trend, trendUp, alert }: StatsCardProps) {
    return (
        <div className={`bg-white p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border ${alert ? 'border-red-200 bg-red-50/50' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${iconBg}`}>
                    <div className={iconColor}>{icon}</div>
                </div>
                {trend && (
                    <div className={`hidden sm:flex items-center gap-1 text-xs sm:text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                        {trendUp ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />}
                        {trend}
                    </div>
                )}
            </div>
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 truncate">{title}</h3>
            <p className={`text-lg sm:text-xl md:text-2xl font-bold ${alert ? 'text-red-600' : 'text-gray-900'} truncate`}>{value}</p>
        </div>
    );
}
