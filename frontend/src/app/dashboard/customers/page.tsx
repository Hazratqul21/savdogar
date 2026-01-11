"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    Users, 
    Plus, 
    Search,
    Phone,
    CreditCard,
    DollarSign,
    Loader2,
    Edit2,
    Trash2,
    User,
    Crown,
    Building2,
    X
} from "lucide-react";
import { getAuthHeaders, getApiBaseUrl } from "@/lib/api";

// API functions
async function getCustomers(search?: string) {
    const apiUrl = getApiBaseUrl();
    let url = `${apiUrl}/api/v1/v2/customers?limit=100`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to fetch customers");
    return response.json();
}

async function createCustomer(data: any) {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/v1/v2/customers`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create customer");
    return response.json();
}

// Format currency
function formatCurrency(value: number): string {
    return value.toLocaleString('uz-UZ') + " so'm";
}

// Price tier labels
const TIER_LABELS: Record<string, { label: string; icon: any; color: string }> = {
    retail: { label: "Oddiy", icon: User, color: "bg-gray-100 text-gray-700" },
    vip: { label: "VIP", icon: Crown, color: "bg-yellow-100 text-yellow-700" },
    wholesaler: { label: "Optom", icon: Building2, color: "bg-blue-100 text-blue-700" },
};

export default function CustomersPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: "",
        phone: "",
        price_tier: "retail",
        credit_limit: "",
    });

    // Fetch customers
    const { data: customers = [], isLoading } = useQuery({
        queryKey: ["customers", searchQuery],
        queryFn: () => getCustomers(searchQuery),
        retry: 1,
    });

    // Create customer mutation
    const createMutation = useMutation({
        mutationFn: createCustomer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            setShowAddModal(false);
            setNewCustomer({ name: "", phone: "", price_tier: "retail", credit_limit: "" });
        },
    });

    const handleAddCustomer = () => {
        if (!newCustomer.name) return;
        
        createMutation.mutate({
            name: newCustomer.name,
            phone: newCustomer.phone || null,
            price_tier: newCustomer.price_tier,
            credit_limit: parseFloat(newCustomer.credit_limit) || 0,
            max_debt_allowed: parseFloat(newCustomer.credit_limit) || 0,
        });
    };

    // Stats
    const totalCustomers = customers.length;
    const vipCustomers = customers.filter((c: any) => c.price_tier === 'vip').length;
    const totalDebt = customers.reduce((sum: number, c: any) => sum + Math.abs(Math.min(c.balance || 0, 0)), 0);

    return (
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Mijozlar</h1>
                    <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Mijozlar bazasi</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 sm:px-4 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Yangi</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-white p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Jami mijozlar</p>
                            <p className="text-xl font-bold text-gray-900">{totalCustomers}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Crown className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">VIP mijozlar</p>
                            <p className="text-xl font-bold text-gray-900">{vipCustomers}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <CreditCard className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Jami qarz</p>
                            <p className="text-xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Mijoz qidirish (ism yoki telefon)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Customers List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : customers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mijoz</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Turi</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balans</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kredit limiti</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {customers.map((customer: any) => {
                                    const tierInfo = TIER_LABELS[customer.price_tier] || TIER_LABELS.retail;
                                    const TierIcon = tierInfo.icon;
                                    const balance = customer.balance || 0;
                                    const isDebt = balance < 0;
                                    
                                    return (
                                        <tr key={customer.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <User className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{customer.name}</p>
                                                        <p className="text-sm text-gray-500">ID: {customer.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {customer.phone ? (
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Phone className="w-4 h-4" />
                                                        <span>{customer.phone}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${tierInfo.color}`}>
                                                    <TierIcon className="w-3 h-3" />
                                                    {tierInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className={`font-semibold ${isDebt ? 'text-red-600' : 'text-green-600'}`}>
                                                    {isDebt ? '-' : '+'}{formatCurrency(Math.abs(balance))}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right text-gray-600">
                                                {formatCurrency(customer.credit_limit || customer.max_debt_allowed || 0)}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                                                        <Edit2 className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    <button className="p-2 hover:bg-red-50 rounded-lg">
                                                        <Trash2 className="w-4 h-4 text-red-600" />
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
                        <Users className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-4">Hali mijozlar yo'q</p>
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Birinchi mijozni qo'shing
                        </button>
                    </div>
                )}
            </div>

            {/* Add Customer Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-900">Yangi mijoz</h2>
                            <button 
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ism *
                                </label>
                                <input
                                    type="text"
                                    value={newCustomer.name}
                                    onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Mijoz ismi"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Telefon
                                </label>
                                <input
                                    type="tel"
                                    value={newCustomer.phone}
                                    onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="+998 90 123 45 67"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mijoz turi
                                </label>
                                <select
                                    value={newCustomer.price_tier}
                                    onChange={(e) => setNewCustomer(prev => ({ ...prev, price_tier: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="retail">Oddiy</option>
                                    <option value="vip">VIP</option>
                                    <option value="wholesaler">Optom</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kredit limiti (so'm)
                                </label>
                                <input
                                    type="number"
                                    value={newCustomer.credit_limit}
                                    onChange={(e) => setNewCustomer(prev => ({ ...prev, credit_limit: e.target.value }))}
                                    placeholder="1000000"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 p-4 border-t">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleAddCustomer}
                                disabled={createMutation.isPending || !newCustomer.name}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {createMutation.isPending ? "Saqlanmoqda..." : "Qo'shish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
