"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
    Receipt, 
    Search,
    Calendar,
    Filter,
    Download,
    Loader2,
    Eye,
    Printer,
    RotateCcw,
    DollarSign,
    CreditCard,
    Banknote,
    X
} from "lucide-react";
import { getAuthHeaders, getApiBaseUrl } from "@/lib/api";

// API functions
async function getSales(startDate?: string, endDate?: string) {
    const apiUrl = getApiBaseUrl();
    let url = `${apiUrl}/api/v1/v2/sales/?limit=100`;
    
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to fetch sales");
    return response.json();
}

async function getSaleDetails(saleId: number) {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/v1/v2/sales/${saleId}`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch sale details");
    return response.json();
}

// Format currency
function formatCurrency(value: number): string {
    return value.toLocaleString('uz-UZ') + " so'm";
}

// Payment method labels
const PAYMENT_LABELS: Record<string, { label: string; icon: any; color: string }> = {
    cash: { label: "Naqd", icon: Banknote, color: "text-green-600 bg-green-100" },
    card: { label: "Karta", icon: CreditCard, color: "text-blue-600 bg-blue-100" },
    transfer: { label: "O'tkazma", icon: DollarSign, color: "text-purple-600 bg-purple-100" },
    debt: { label: "Nasiya", icon: RotateCcw, color: "text-orange-600 bg-orange-100" },
    payme: { label: "Payme", icon: CreditCard, color: "text-cyan-600 bg-cyan-100" },
    click: { label: "Click", icon: CreditCard, color: "text-blue-600 bg-blue-100" },
};

// Sale status labels
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    completed: { label: "Yakunlangan", color: "bg-green-100 text-green-700" },
    pending: { label: "Kutilmoqda", color: "bg-yellow-100 text-yellow-700" },
    cancelled: { label: "Bekor qilingan", color: "bg-red-100 text-red-700" },
    refunded: { label: "Qaytarilgan", color: "bg-gray-100 text-gray-700" },
};

export default function SalesPage() {
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);

    // Fetch sales
    const { data: sales = [], isLoading } = useQuery({
        queryKey: ["sales-history", dateRange.start, dateRange.end],
        queryFn: () => getSales(dateRange.start, dateRange.end),
        retry: 1,
    });

    // Filter sales
    const filteredSales = sales.filter((sale: any) => {
        if (!searchQuery) return true;
        const receiptNumber = sale.receipt_number?.toLowerCase() || "";
        const customerName = sale.customer?.name?.toLowerCase() || "";
        return receiptNumber.includes(searchQuery.toLowerCase()) || 
               customerName.includes(searchQuery.toLowerCase());
    });

    // Calculate totals
    const totalAmount = filteredSales.reduce((sum: number, sale: any) => sum + (sale.total_amount || 0), 0);
    const totalTransactions = filteredSales.length;

    const handleViewDetails = (sale: any) => {
        setSelectedSale(sale);
        setShowDetails(true);
    };

    return (
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Sotuvlar</h1>
                    <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Sotuvlar tarixi</p>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 sm:px-4 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-white p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-600">Savdo</p>
                            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Receipt className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Tranzaksiyalar</p>
                            <p className="text-xl font-bold text-gray-900">{totalTransactions}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">O'rtacha chek</p>
                            <p className="text-xl font-bold text-gray-900">
                                {formatCurrency(totalTransactions > 0 ? totalAmount / totalTransactions : 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Chek raqami yoki mijoz..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <span className="text-gray-400">—</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : filteredSales.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chek</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sana</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mijoz</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To'lov</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Summa</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredSales.map((sale: any) => {
                                    const paymentInfo = PAYMENT_LABELS[sale.payment_method] || PAYMENT_LABELS.cash;
                                    const statusInfo = STATUS_LABELS[sale.status] || STATUS_LABELS.completed;
                                    const PaymentIcon = paymentInfo.icon;
                                    
                                    return (
                                        <tr key={sale.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                <span className="font-mono font-medium text-gray-900">
                                                    #{sale.receipt_number || sale.id}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div>
                                                    <p className="text-sm text-gray-900">
                                                        {new Date(sale.created_at).toLocaleDateString('uz-UZ')}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(sale.created_at).toLocaleTimeString('uz-UZ')}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-gray-600">
                                                    {sale.customer?.name || "Anonim"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${paymentInfo.color}`}>
                                                    <PaymentIcon className="w-3 h-3" />
                                                    {paymentInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="font-semibold text-gray-900">
                                                    {formatCurrency(sale.total_amount)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`px-2 py-1 text-xs rounded-full ${statusInfo.color}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button 
                                                        onClick={() => handleViewDetails(sale)}
                                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                                        title="Ko'rish"
                                                    >
                                                        <Eye className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="Chop etish">
                                                        <Printer className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Receipt className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500">Bu davrda sotuvlar topilmadi</p>
                    </div>
                )}
            </div>

            {/* Sale Details Modal */}
            {showDetails && selectedSale && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Chek #{selectedSale.receipt_number || selectedSale.id}
                            </h2>
                            <button 
                                onClick={() => setShowDetails(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Sana</p>
                                    <p className="font-medium">
                                        {new Date(selectedSale.created_at).toLocaleString('uz-UZ')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">To'lov usuli</p>
                                    <p className="font-medium">
                                        {PAYMENT_LABELS[selectedSale.payment_method]?.label || selectedSale.payment_method}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Mijoz</p>
                                    <p className="font-medium">{selectedSale.customer?.name || "Anonim"}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Status</p>
                                    <p className="font-medium">
                                        {STATUS_LABELS[selectedSale.status]?.label || selectedSale.status}
                                    </p>
                                </div>
                            </div>

                            {selectedSale.items?.length > 0 && (
                                <div className="border-t pt-4">
                                    <h3 className="font-medium mb-3">Mahsulotlar</h3>
                                    <div className="space-y-2">
                                        {selectedSale.items.map((item: any, index: number) => (
                                            <div key={index} className="flex justify-between text-sm">
                                                <span>{item.variant?.product?.name || "Mahsulot"} x{item.quantity}</span>
                                                <span className="font-medium">{formatCurrency(item.total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="border-t pt-4">
                                <div className="flex justify-between text-lg font-semibold">
                                    <span>Jami:</span>
                                    <span className="text-blue-600">{formatCurrency(selectedSale.total_amount)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 p-4 border-t">
                            <button
                                onClick={() => setShowDetails(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Yopish
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                <Printer className="w-4 h-4" />
                                Chop etish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
