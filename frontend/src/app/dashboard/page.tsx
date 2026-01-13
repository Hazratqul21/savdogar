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
    Clock,
    Zap,
    Target,
    Banknote,
    CreditCard,
    Wallet,
    MoreHorizontal,
    ExternalLink,
    PieChart
} from "lucide-react";
import Link from "next/link";
import { usePermissions } from "@/hooks/usePermissions";
import { getAuthHeaders, getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

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
    if (value >= 1000000000) {
        return `${(value / 1000000000).toFixed(1)} mlrd`;
    }
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)} mln`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toLocaleString();
}

function formatFullCurrency(value: number): string {
    return `${value.toLocaleString()} so'm`;
}

// Business type labels
const BUSINESS_TYPE_LABELS: Record<string, string> = {
    retail: "Chakana Savdo",
    fashion: "Kiyim-kechak",
    horeca: "Kafe / Restoran",
    wholesale: "Optom Savdo",
    jewelry: "Bijuteriya",
    plumbing_hvac: "Santexnika",
    tobacco: "Tamaki",
    cafe: "Qahvaxona",
    kitchen: "Oshxona"
};

// Payment method icons
const PAYMENT_ICONS: Record<string, any> = {
    cash: Banknote,
    card: CreditCard,
    transfer: Wallet,
    debt: Clock,
    payme: Wallet,
    click: Wallet,
};

export default function DashboardPage() {
    const [businessType, setBusinessType] = useState<string>("retail");
    const [tenantName, setTenantName] = useState<string>("");
    const [currentTime, setCurrentTime] = useState(new Date());
    const router = useRouter();
    const permissions = usePermissions();

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Fetch dashboard stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: getDashboardStats,
        retry: 1,
        staleTime: 30000,
    });

    // Fetch recent sales
    const { data: recentSales = [] } = useQuery({
        queryKey: ["recent-sales"],
        queryFn: getRecentSales,
        retry: 1,
    });

    // Fetch expiring products
    const { data: expiringData } = useQuery({
        queryKey: ["expiring-products"],
        queryFn: getExpiringProducts,
        retry: 1,
        enabled: businessType === "retail" || businessType === "grocery",
    });

    useEffect(() => {
        const type = localStorage.getItem("business_type") || "retail";
        setBusinessType(type);

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
        { 
            icon: ShoppingCart, 
            label: "Yangi Sotuv", 
            description: "POS terminali",
            href: "/pos", 
            permission: "pos",
            color: "from-blue-500 to-blue-600",
            shadowColor: "shadow-blue-500/25"
        },
        { 
            icon: Package, 
            label: "Mahsulotlar", 
            description: "Tovar qo'shish",
            href: "/dashboard/products", 
            permission: "products",
            color: "from-purple-500 to-purple-600",
            shadowColor: "shadow-purple-500/25"
        },
        { 
            icon: Users, 
            label: "Mijozlar", 
            description: "Bazani ko'rish",
            href: "/dashboard/customers", 
            permission: "customers",
            color: "from-emerald-500 to-emerald-600",
            shadowColor: "shadow-emerald-500/25"
        },
        { 
            icon: BarChart3, 
            label: "Hisobotlar", 
            description: "Tahlil va statistika",
            href: "/dashboard/reports", 
            permission: "reports",
            color: "from-amber-500 to-amber-600",
            shadowColor: "shadow-amber-500/25"
        },
    ].filter(action => permissions.hasPermission(action.permission));

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Xayrli tong";
        if (hour < 17) return "Xayrli kun";
        return "Xayrli kech";
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
            {/* Header */}
            <header className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                            {getGreeting()}{tenantName ? `, ${tenantName}` : ""}! 👋
                        </h1>
                        <p className="text-muted-foreground mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                                {BUSINESS_TYPE_LABELS[businessType] || businessType}
                            </span>
                            <span className="text-sm">
                                {currentTime.toLocaleDateString('uz-UZ', { 
                                    weekday: 'long', 
                                    year: 'numeric',
                                    month: 'long', 
                                    day: 'numeric' 
                                })}
                            </span>
                        </p>
                    </div>
                    
                    {/* Quick POS Button */}
                    <Link href="/pos">
                        <button className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/25">
                            <Zap className="w-5 h-5" />
                            <span>POS Terminali</span>
                        </button>
                    </Link>
                </div>
            </header>

            {/* Stats Grid */}
            {statsLoading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Ma'lumotlar yuklanmoqda...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Main Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatsCard 
                            title="Bugungi Savdo" 
                            value={formatCurrency(stats?.today_sales || 0)}
                            suffix="so'm"
                            icon={<DollarSign className="w-5 h-5" />}
                            iconBg="bg-emerald-500/10"
                            iconColor="text-emerald-500"
                            trend={stats?.today_sales > 0 ? { value: "+12%", up: true } : undefined}
                        />
                        <StatsCard 
                            title="Tranzaksiyalar" 
                            value={(stats?.today_transactions || 0).toString()}
                            suffix="ta"
                            icon={<Receipt className="w-5 h-5" />}
                            iconBg="bg-blue-500/10"
                            iconColor="text-blue-500"
                        />
                        <StatsCard 
                            title="Mahsulotlar" 
                            value={(stats?.total_products || 0).toString()}
                            suffix="ta"
                            icon={<Package className="w-5 h-5" />}
                            iconBg="bg-purple-500/10"
                            iconColor="text-purple-500"
                        />
                        <StatsCard 
                            title="Kam Qolgan" 
                            value={(stats?.low_stock_products || 0).toString()}
                            suffix="ta"
                            icon={<AlertCircle className="w-5 h-5" />}
                            iconBg="bg-red-500/10"
                            iconColor="text-red-500"
                            alert={stats?.low_stock_products > 0}
                        />
                    </div>

                    {/* Expiry Alert */}
                    {(businessType === "retail" || businessType === "grocery") && 
                     expiringData?.summary?.total_items > 0 && (
                        <div className="mb-8">
                            <div className="bg-gradient-to-r from-orange-500/10 via-red-500/5 to-orange-500/10 border border-orange-500/20 rounded-2xl p-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                                        <AlertTriangle className="w-6 h-6 text-orange-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-foreground text-lg">
                                            Muddati yaqinlashayotgan mahsulotlar
                                        </h3>
                                        <p className="text-muted-foreground mt-1">
                                            {expiringData.summary.expired_count > 0 && (
                                                <span className="font-semibold text-red-500">
                                                    {expiringData.summary.expired_count} ta muddati o'tgan, 
                                                </span>
                                            )}
                                            {" "}{expiringData.summary.expiring_soon_count} ta mahsulot 7 kun ichida eskiradi
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {expiringData.items.slice(0, 3).map((item: any) => (
                                                <span 
                                                    key={item.variant_id}
                                                    className={cn(
                                                        "badge flex items-center gap-1.5",
                                                        item.status === "expired" 
                                                            ? "badge-error" 
                                                            : "badge-warning"
                                                    )}
                                                >
                                                    <Clock className="w-3 h-3" />
                                                    {item.product_name} - {item.days_until_expiry < 0 ? "O'tgan" : `${item.days_until_expiry} kun`}
                                                </span>
                                            ))}
                                            {expiringData.items.length > 3 && (
                                                <Link 
                                                    href="/dashboard/inventory?tab=expiring"
                                                    className="badge badge-neutral flex items-center gap-1.5 hover:bg-muted/80"
                                                >
                                                    +{expiringData.items.length - 3} ta ko'proq
                                                    <ArrowRight className="w-3 h-3" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent Sales */}
                        <div className="lg:col-span-2">
                            <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                                <div className="flex items-center justify-between p-5 border-b border-border">
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">
                                            So'nggi Sotuvlar
                                        </h2>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            Oxirgi 5 ta tranzaksiya
                                        </p>
                                    </div>
                                    <Link 
                                        href="/dashboard/sales" 
                                        className="btn-ghost flex items-center gap-2 text-sm"
                                    >
                                        Barchasi
                                        <ExternalLink className="w-4 h-4" />
                                    </Link>
                                </div>
                                
                                {recentSales.length > 0 ? (
                                    <div className="divide-y divide-border">
                                        {recentSales.slice(0, 5).map((sale: any, index: number) => {
                                            const PaymentIcon = PAYMENT_ICONS[sale.payment_method] || Wallet;
                                            return (
                                                <div 
                                                    key={sale.id} 
                                                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                                                        <Receipt className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-foreground">
                                                            #{sale.receipt_number || sale.id}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {new Date(sale.created_at).toLocaleString('uz-UZ', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="font-semibold text-foreground">
                                                            {formatFullCurrency(sale.total_amount)}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 justify-end mt-1">
                                                            <PaymentIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                                            <span className="text-xs text-muted-foreground capitalize">
                                                                {sale.payment_method === 'cash' ? 'Naqd' : 
                                                                 sale.payment_method === 'card' ? 'Karta' : 
                                                                 sale.payment_method === 'debt' ? 'Nasiya' : 
                                                                 sale.payment_method}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                                            <Receipt className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">
                                            Hali sotuvlar yo'q
                                        </p>
                                        <Link 
                                            href="/pos" 
                                            className="inline-flex items-center gap-2 mt-4 text-primary hover:underline text-sm font-medium"
                                        >
                                            Sotuv qilish
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Quick Actions */}
                            <div className="bg-card rounded-2xl border border-border shadow-card p-5">
                                <h2 className="text-lg font-semibold text-foreground mb-4">
                                    Tezkor Amallar
                                </h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {quickActions.map((action) => (
                                        <Link
                                            key={action.href}
                                            href={action.href}
                                            className="group"
                                        >
                                            <div className={cn(
                                                "p-4 rounded-xl border border-border",
                                                "hover:border-primary/30 hover:shadow-lg transition-all duration-300",
                                                action.shadowColor && `hover:${action.shadowColor}`
                                            )}>
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                                                    "bg-gradient-to-br",
                                                    action.color,
                                                    "shadow-lg",
                                                    action.shadowColor
                                                )}>
                                                    <action.icon className="w-5 h-5 text-white" />
                                                </div>
                                                <h3 className="font-medium text-foreground text-sm">
                                                    {action.label}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {action.description}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Monthly Revenue Card */}
                            <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-primary/25">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                        <Target className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">
                                        {new Date().toLocaleString('uz-UZ', { month: 'long' })}
                                    </span>
                                </div>
                                <p className="text-white/80 text-sm font-medium">Oylik Savdo</p>
                                <p className="text-3xl font-bold mt-1">
                                    {formatCurrency(stats?.monthly_sales || 0)}
                                    <span className="text-lg font-normal text-white/70 ml-1">so'm</span>
                                </p>
                                <div className="mt-4 pt-4 border-t border-white/20">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-white/70">O'rtacha kunlik</span>
                                        <span className="font-semibold">
                                            {formatCurrency((stats?.monthly_sales || 0) / new Date().getDate())} so'm
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

interface StatsCardProps {
    title: string;
    value: string;
    suffix?: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    trend?: { value: string; up: boolean };
    alert?: boolean;
}

function StatsCard({ title, value, suffix, icon, iconBg, iconColor, trend, alert }: StatsCardProps) {
    return (
        <div className={cn(
            "stats-card",
            alert && "border-red-500/30 bg-red-500/5"
        )}>
            <div className="flex items-start justify-between mb-4">
                <div className={cn("stats-card-icon", iconBg)}>
                    <div className={iconColor}>{icon}</div>
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full",
                        trend.up 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : "bg-red-500/10 text-red-500"
                    )}>
                        {trend.up ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        {trend.value}
                    </div>
                )}
            </div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className={cn(
                "text-2xl md:text-3xl font-bold mt-1",
                alert ? "text-red-500" : "text-foreground"
            )}>
                {value}
                {suffix && (
                    <span className="text-base font-normal text-muted-foreground ml-1">
                        {suffix}
                    </span>
                )}
            </p>
        </div>
    );
}
