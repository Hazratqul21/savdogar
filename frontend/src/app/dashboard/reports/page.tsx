"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
    BarChart3, 
    TrendingUp, 
    Download, 
    Calendar,
    DollarSign,
    Package,
    Users,
    Receipt,
    Loader2,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { getAuthHeaders, getApiBaseUrl } from "@/lib/api";

// API functions
async function getSalesReport(startDate?: string, endDate?: string) {
    const apiUrl = getApiBaseUrl();
    let url = `${apiUrl}/api/v1/reports/sales`;
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to fetch sales report");
    return response.json();
}

async function getInventoryReport() {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/v1/reports/inventory`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch inventory report");
    return response.json();
}

async function getTopProducts() {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/v1/reports/top-products?limit=10`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) return [];
    return response.json();
}

// Format currency
function formatCurrency(value: number): string {
    return value.toLocaleString('uz-UZ') + " so'm";
}

type ReportTab = "sales" | "inventory" | "financial";

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<ReportTab>("sales");
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // Start of month
        end: new Date().toISOString().split('T')[0] // Today
    });

    // Fetch reports
    const { data: salesReport, isLoading: salesLoading } = useQuery({
        queryKey: ["sales-report", dateRange.start, dateRange.end],
        queryFn: () => getSalesReport(dateRange.start, dateRange.end),
        retry: 1,
    });

    const { data: inventoryReport, isLoading: inventoryLoading } = useQuery({
        queryKey: ["inventory-report"],
        queryFn: getInventoryReport,
        retry: 1,
    });

    const { data: topProducts = [] } = useQuery({
        queryKey: ["top-products"],
        queryFn: getTopProducts,
        retry: 1,
    });

    const tabs = [
        { id: "sales" as ReportTab, label: "Savdo hisoboti", icon: TrendingUp },
        { id: "inventory" as ReportTab, label: "Ombor hisoboti", icon: Package },
        { id: "financial" as ReportTab, label: "Moliyaviy", icon: DollarSign },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Hisobotlar</h1>
                    <p className="text-gray-600 mt-1">Biznesingiz statistikasi va tahlillari</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Download className="w-4 h-4" />
                    Excel yuklab olish
                </button>
            </div>

            {/* Date Range Picker */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600">Davr:</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-400">—</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => {
                                const today = new Date();
                                setDateRange({
                                    start: today.toISOString().split('T')[0],
                                    end: today.toISOString().split('T')[0]
                                });
                            }}
                            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Bugun
                        </button>
                        <button 
                            onClick={() => {
                                const today = new Date();
                                const weekAgo = new Date(today.setDate(today.getDate() - 7));
                                setDateRange({
                                    start: weekAgo.toISOString().split('T')[0],
                                    end: new Date().toISOString().split('T')[0]
                                });
                            }}
                            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Hafta
                        </button>
                        <button 
                            onClick={() => {
                                const today = new Date();
                                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                                setDateRange({
                                    start: monthStart.toISOString().split('T')[0],
                                    end: today.toISOString().split('T')[0]
                                });
                            }}
                            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Oy
                        </button>
                    </div>
                </div>
            </div>

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
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "sales" && (
                <div className="space-y-6">
                    {/* Sales Stats */}
                    {salesLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <StatCard
                                    title="Jami savdo"
                                    value={formatCurrency(salesReport?.total_sales || 0)}
                                    icon={<DollarSign className="w-5 h-5" />}
                                    iconBg="bg-green-100"
                                    iconColor="text-green-600"
                                />
                                <StatCard
                                    title="Tranzaksiyalar soni"
                                    value={salesReport?.total_transactions?.toString() || "0"}
                                    icon={<Receipt className="w-5 h-5" />}
                                    iconBg="bg-blue-100"
                                    iconColor="text-blue-600"
                                />
                                <StatCard
                                    title="O'rtacha chek"
                                    value={formatCurrency(salesReport?.average_sale || 0)}
                                    icon={<BarChart3 className="w-5 h-5" />}
                                    iconBg="bg-purple-100"
                                    iconColor="text-purple-600"
                                />
                            </div>

                            {/* Sales Table */}
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b border-gray-100">
                                    <h3 className="font-semibold text-gray-900">Sotuvlar ro'yxati</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sana</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To'lov usuli</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {salesReport?.sales?.slice(0, 20).map((sale: any) => (
                                                <tr key={sale.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-900">#{sale.id}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {new Date(sale.created_at).toLocaleString('uz-UZ')}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                                                            {sale.payment_method === 'cash' ? 'Naqd' : 
                                                             sale.payment_method === 'card' ? 'Karta' : 
                                                             sale.payment_method}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                                        {formatCurrency(sale.total_amount)}
                                                    </td>
                                                </tr>
                                            )) || (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                                        Bu davrda sotuvlar topilmadi
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === "inventory" && (
                <div className="space-y-6">
                    {inventoryLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                    icon={<DollarSign className="w-5 h-5" />}
                                    iconBg="bg-green-100"
                                    iconColor="text-green-600"
                                />
                                <StatCard
                                    title="Kam qolgan"
                                    value={inventoryReport?.low_stock_count?.toString() || "0"}
                                    icon={<Package className="w-5 h-5" />}
                                    iconBg="bg-red-100"
                                    iconColor="text-red-600"
                                    alert={inventoryReport?.low_stock_count > 0}
                                />
                            </div>

                            {/* Low Stock Table */}
                            {inventoryReport?.low_stock?.length > 0 && (
                                <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
                                    <div className="p-4 border-b border-red-100 bg-red-50">
                                        <h3 className="font-semibold text-red-800">Kam qolgan mahsulotlar</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mahsulot</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qoldiq</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Min. daraja</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {inventoryReport.low_stock.map((item: any) => (
                                                    <tr key={item.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                                                        <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                                                            {item.stock_quantity}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                                                            {item.min_stock || 10}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {activeTab === "financial" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <StatCard
                            title="Jami daromad"
                            value={formatCurrency(salesReport?.total_sales || 0)}
                            icon={<ArrowUpRight className="w-5 h-5" />}
                            iconBg="bg-green-100"
                            iconColor="text-green-600"
                        />
                        <StatCard
                            title="Ombor qiymati"
                            value={formatCurrency(inventoryReport?.total_value || 0)}
                            icon={<Package className="w-5 h-5" />}
                            iconBg="bg-blue-100"
                            iconColor="text-blue-600"
                        />
                    </div>

                    {/* Top Products */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900">Eng ko'p sotilgan mahsulotlar</h3>
                        </div>
                        <div className="p-4">
                            {topProducts.length > 0 ? (
                                <div className="space-y-3">
                                    {topProducts.map((product: any, index: number) => (
                                        <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                                                    {index + 1}
                                                </span>
                                                <span className="font-medium text-gray-900">{product.name}</span>
                                            </div>
                                            <span className="text-gray-600">{product.sold_count} dona</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">
                                    Ma'lumotlar yig'ilmoqda...
                                </p>
                            )}
                        </div>
                    </div>
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
        <div className={`bg-white p-6 rounded-xl border ${alert ? 'border-red-200' : 'border-gray-200'}`}>
            <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl ${iconBg}`}>
                    <div className={iconColor}>{icon}</div>
                </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
            <p className={`text-2xl font-bold ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
        </div>
    );
}
