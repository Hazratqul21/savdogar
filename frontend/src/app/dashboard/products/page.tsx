"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    Package, 
    Plus, 
    Search, 
    Filter,
    Edit2,
    Trash2,
    MoreVertical,
    Loader2,
    Barcode,
    DollarSign,
    Box,
    AlertCircle
} from "lucide-react";
import { getAuthHeaders, getApiBaseUrl } from "@/lib/api";

// API functions
async function getProducts(search?: string) {
    const apiUrl = getApiBaseUrl();
    let url = `${apiUrl}/api/v1/v2/products?limit=100`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to fetch products");
    return response.json();
}

async function createProduct(data: any) {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/v1/v2/products`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create product");
    return response.json();
}

async function deleteProduct(id: number) {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/v1/v2/products/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete product");
    return response.json();
}

// Format currency
function formatCurrency(value: number): string {
    return value.toLocaleString('uz-UZ') + " so'm";
}

export default function ProductsPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: "",
        base_price: "",
        cost_price: "",
        type: "simple",
    });

    // Fetch products
    const { data: products = [], isLoading } = useQuery({
        queryKey: ["products", searchQuery],
        queryFn: () => getProducts(searchQuery),
        retry: 1,
    });

    // Create product mutation
    const createMutation = useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setShowAddModal(false);
            setNewProduct({ name: "", base_price: "", cost_price: "", type: "simple" });
        },
    });

    // Delete product mutation
    const deleteMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });

    const handleAddProduct = () => {
        if (!newProduct.name || !newProduct.base_price) return;
        
        createMutation.mutate({
            name: newProduct.name,
            base_price: parseFloat(newProduct.base_price),
            cost_price: parseFloat(newProduct.cost_price) || parseFloat(newProduct.base_price),
            type: newProduct.type,
        });
    };

    // Stats
    const totalProducts = products.length;
    const activeProducts = products.filter((p: any) => p.is_active).length;
    const lowStockProducts = products.filter((p: any) => {
        const variant = p.variants?.[0];
        return variant && variant.stock_quantity < (variant.min_stock_level || 10);
    }).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mahsulotlar</h1>
                    <p className="text-gray-600 mt-1">Mahsulotlarni boshqarish va qo'shish</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Yangi mahsulot
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Jami mahsulotlar</p>
                            <p className="text-xl font-bold text-gray-900">{totalProducts}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Box className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Faol mahsulotlar</p>
                            <p className="text-xl font-bold text-gray-900">{activeProducts}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Kam qolgan</p>
                            <p className="text-xl font-bold text-red-600">{lowStockProducts}</p>
                        </div>
                    </div>
                </div>
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
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Filter className="w-4 h-4" />
                        Filtr
                    </button>
                </div>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : products.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mahsulot</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shtrix kod</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Narxi</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qoldiq</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {products.map((product: any) => {
                                    const variant = product.variants?.[0];
                                    const isLowStock = variant && variant.stock_quantity < (variant.min_stock_level || 10);
                                    
                                    return (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{product.name}</p>
                                                        <p className="text-sm text-gray-500">{product.type}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Barcode className="w-4 h-4" />
                                                    <span className="text-sm font-mono">
                                                        {variant?.barcode_aliases?.[0] || variant?.sku || "-"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <p className="font-medium text-gray-900">
                                                    {formatCurrency(variant?.price || product.base_price || 0)}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Kelish: {formatCurrency(variant?.cost_price || product.cost_price || 0)}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {variant?.stock_quantity?.toFixed(0) || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    product.is_active 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {product.is_active ? 'Faol' : 'Nofaol'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                                        <Edit2 className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteMutation.mutate(product.id)}
                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
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
                        <Package className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-4">Hali mahsulotlar yo'q</p>
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Birinchi mahsulotni qo'shing
                        </button>
                    </div>
                )}
            </div>

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Yangi mahsulot</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mahsulot nomi *
                                </label>
                                <input
                                    type="text"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Masalan: Coca-Cola 1L"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sotish narxi *
                                    </label>
                                    <input
                                        type="number"
                                        value={newProduct.base_price}
                                        onChange={(e) => setNewProduct(prev => ({ ...prev, base_price: e.target.value }))}
                                        placeholder="15000"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Kelish narxi
                                    </label>
                                    <input
                                        type="number"
                                        value={newProduct.cost_price}
                                        onChange={(e) => setNewProduct(prev => ({ ...prev, cost_price: e.target.value }))}
                                        placeholder="12000"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleAddProduct}
                                disabled={createMutation.isPending || !newProduct.name || !newProduct.base_price}
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
