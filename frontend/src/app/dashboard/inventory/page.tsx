"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
    Warehouse, 
    Package, 
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Search,
    Filter,
    Upload,
    Download,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3
} from "lucide-react";
import Link from "next/link";
import { getAuthHeaders, getApiBaseUrl } from "@/lib/api";

// API functions
async function getInventoryReport() {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/v1/reports/inventory`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch inventory");
    return response.json();
}

async function getProducts() {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/v1/v2/products?limit=100`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Inventory: Failed to fetch products:", response.status, errorText);
        throw new Error("Failed to fetch products");
    }
    const data = await response.json();
    console.log("✅ Inventory: Products fetched:", data?.length || 0, "products");
    return data;
}

// Format currency
function formatCurrency(value: number): string {
    return value.toLocaleString('uz-UZ') + " so'm";
}

type ViewTab = "all" | "low_stock" | "movements";

export default function InventoryPage() {
    const [activeTab, setActiveTab] = useState<ViewTab>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch inventory data
    const { data: inventoryReport, isLoading: reportLoading } = useQuery({
        queryKey: ["inventory-report"],
        queryFn: getInventoryReport,
        retry: 1,
    });

    // Fetch products for inventory list
    const { data: products = [], isLoading: productsLoading } = useQuery({
        queryKey: ["products-inventory"],
        queryFn: getProducts,
        retry: 1,
    });

    const isLoading = reportLoading || productsLoading;

    // Filter products
    const filteredProducts = products.filter((product: any) => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (activeTab === "low_stock") {
            const variant = product.variants?.[0];
            const isLowStock = variant && variant.stock_quantity < (variant.min_stock_level || 10);
            return matchesSearch && isLowStock;
        }
        
        return matchesSearch;
    });

    const tabs = [
        { id: "all" as ViewTab, label: "Barcha mahsulotlar", count: products.length },
        { id: "low_stock" as ViewTab, label: "Kam qolganlar", count: inventoryReport?.low_stock_count || 0 },
        { id: "movements" as ViewTab, label: "Harakatlar", count: 0 },
    ];

    return (
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Ombor</h1>
                    <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Qoldiqlar va harakatlar</p>
                </div>
                <div className="flex gap-1.5 sm:gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-2 sm:px-4 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Jami mahsulotlar"
                        value={inventoryReport?.total_products?.toString() || "0"}
                        icon={<Package className="w-5 h-5" />}
                        iconBg="bg-blue-100"
                        iconColor="text-blue-600"
                    />
                    <StatCard
                        title="Ombor qiymati"
                        value={formatCurrency(inventoryReport?.total_value || 0)}
                        icon={<Warehouse className="w-5 h-5" />}
                        iconBg="bg-green-100"
                        iconColor="text-green-600"
                    />
                    <StatCard
                        title="Kam qolganlar"
                        value={inventoryReport?.low_stock_count?.toString() || "0"}
                        icon={<AlertTriangle className="w-5 h-5" />}
                        iconBg="bg-red-100"
                        iconColor="text-red-600"
                        alert={inventoryReport?.low_stock_count > 0}
                    />
                    <StatCard
                        title="Kutilayotgan kirim"
                        value="0"
                        icon={<TrendingUp className="w-5 h-5" />}
                        iconBg="bg-purple-100"
                        iconColor="text-purple-600"
                    />
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.id 
                                ? "border-blue-600 text-blue-600" 
                                : "border-transparent text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                                activeTab === tab.id 
                                    ? "bg-blue-100 text-blue-600" 
                                    : "bg-gray-100 text-gray-600"
                            }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Mahsulot qidirish..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            {activeTab === "movements" ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Ombor harakatlari</h3>
                    <p className="text-gray-500">
                        Bu yerda kirim va chiqim harakatlari ko'rsatiladi
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : filteredProducts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mahsulot</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qoldiq</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Min. daraja</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qiymat</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredProducts.map((product: any) => {
                                        const variant = product.variants?.[0];
                                        const stockQty = variant?.stock_quantity || 0;
                                        const minLevel = variant?.min_stock_level || 10;
                                        const isLowStock = stockQty < minLevel;
                                        const value = stockQty * (variant?.cost_price || 0);
                                        
                                        return (
                                            <tr key={product.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                            <Package className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{product.name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-sm font-mono text-gray-600">
                                                        {variant?.sku || "-"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {stockQty.toFixed(0)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right text-gray-600">
                                                    {minLevel}
                                                </td>
                                                <td className="px-4 py-4 text-right font-medium text-gray-900">
                                                    {formatCurrency(value)}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {isLowStock ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            Kam
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                                            Yetarli
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Warehouse className="w-16 h-16 text-gray-300 mb-4" />
                            <p className="text-gray-500">
                                {activeTab === "low_stock" 
                                    ? "Kam qolgan mahsulotlar yo'q" 
                                    : "Mahsulotlar topilmadi"}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    alert?: boolean;
}

function StatCard({ title, value, icon, iconBg, iconColor, alert }: StatCardProps) {
    return (
        <div className={`bg-white p-4 rounded-xl border ${alert ? 'border-red-200' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${iconBg}`}>
                    <div className={iconColor}>{icon}</div>
                </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
            <p className={`text-xl font-bold ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
        </div>
    );
}
