"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
    AlertCircle,
    Coffee,
    Check,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { getAuthHeaders, getApiBaseUrl } from "@/lib/api";

// Toast component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 2000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
        >
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border ${
                type === 'success' 
                    ? "bg-green-50 border-green-200 text-green-700" 
                    : "bg-red-50 border-red-200 text-red-700"
            }`}>
                {type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium text-sm">{message}</span>
            </div>
        </motion.div>
    );
}

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
    const [businessType, setBusinessType] = useState<string>("retail");
    
    // Standard product form
    const [newProduct, setNewProduct] = useState({
        name: "",
        base_price: "",
        cost_price: "",
        type: "simple",
    });
    
    // Cafe product form with sizes
    const [cafeProduct, setCafeProduct] = useState({
        name: "",
        hasSizes: true,
        prices: {
            small: "",
            medium: "",
            large: "",
        }
    });
    
    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // Track which product is being deleted
    const [deletingId, setDeletingId] = useState<number | null>(null);
    
    // Load business type
    useEffect(() => {
        const type = localStorage.getItem("business_type") || "retail";
        setBusinessType(type);
    }, []);
    
    const isCafeMode = businessType === "cafe" || businessType === "horeca" || businessType === "kitchen";

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
            setCafeProduct({ name: "", hasSizes: true, prices: { small: "", medium: "", large: "" } });
            setToast({ message: "Mahsulot qo'shildi ✓", type: 'success' });
        },
        onError: () => {
            setToast({ message: "Xatolik yuz berdi", type: 'error' });
        },
    });

    // Delete product mutation
    const deleteMutation = useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setToast({ message: "Mahsulot o'chirildi", type: 'success' });
            setDeletingId(null);
        },
        onError: () => {
            setToast({ message: "O'chirishda xatolik", type: 'error' });
            setDeletingId(null);
        },
    });
    
    const handleDelete = (id: number) => {
        setDeletingId(id);
        deleteMutation.mutate(id);
    };

    const handleAddProduct = () => {
        if (isCafeMode) {
            // Cafe mode: Create product with size variants
            if (!cafeProduct.name) return;
            
            const variants = [];
            
            if (cafeProduct.hasSizes) {
                // Add size variants
                if (cafeProduct.prices.small) {
                    variants.push({
                        sku: `${cafeProduct.name.toUpperCase().replace(/\s+/g, '-')}-S`,
                        price: parseFloat(cafeProduct.prices.small),
                        cost_price: parseFloat(cafeProduct.prices.small) * 0.6,
                        attributes: { size: "small", size_label: "Kichik" }
                    });
                }
                if (cafeProduct.prices.medium) {
                    variants.push({
                        sku: `${cafeProduct.name.toUpperCase().replace(/\s+/g, '-')}-M`,
                        price: parseFloat(cafeProduct.prices.medium),
                        cost_price: parseFloat(cafeProduct.prices.medium) * 0.6,
                        attributes: { size: "medium", size_label: "O'rtacha" }
                    });
                }
                if (cafeProduct.prices.large) {
                    variants.push({
                        sku: `${cafeProduct.name.toUpperCase().replace(/\s+/g, '-')}-L`,
                        price: parseFloat(cafeProduct.prices.large),
                        cost_price: parseFloat(cafeProduct.prices.large) * 0.6,
                        attributes: { size: "large", size_label: "Katta" }
                    });
                }
            }
            
            if (variants.length === 0) return;
            
            createMutation.mutate({
                name: cafeProduct.name,
                type: "variable",
                variants: variants,
            });
        } else {
            // Standard mode
            if (!newProduct.name || !newProduct.base_price) return;
            
            createMutation.mutate({
                name: newProduct.name,
                base_price: parseFloat(newProduct.base_price),
                cost_price: parseFloat(newProduct.cost_price) || parseFloat(newProduct.base_price),
                type: newProduct.type,
            });
        }
    };

    // Stats
    const totalProducts = products.length;
    const activeProducts = products.filter((p: any) => p.is_active).length;
    const lowStockProducts = products.filter((p: any) => {
        const variant = p.variants?.[0];
        return variant && variant.stock_quantity < (variant.min_stock_level || 10);
    }).length;

    return (
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <Toast 
                        message={toast.message} 
                        type={toast.type} 
                        onClose={() => setToast(null)} 
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Mahsulotlar</h1>
                    <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Mahsulotlarni boshqarish</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 sm:px-4 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Yangi</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-white p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-600">Jami</p>
                            <p className="text-base sm:text-xl font-bold text-gray-900">{totalProducts}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                            <Box className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-600">Faol</p>
                            <p className="text-base sm:text-xl font-bold text-gray-900">{activeProducts}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-600">Kam</p>
                            <p className="text-base sm:text-xl font-bold text-red-600">{lowStockProducts}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-2.5 sm:p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Qidirish..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                ) : products.length > 0 ? (
                    <div className="overflow-x-auto -mx-3 sm:mx-0">
                        <table className="w-full min-w-[500px] text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mahsulot</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Narxi</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qoldiq</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Amallar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {products.map((product: any) => {
                                    const variant = product.variants?.[0];
                                    const isLowStock = variant && variant.stock_quantity < (variant.min_stock_level || 10);
                                    
                                    return (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                                                        <Package className="w-4 h-4 text-gray-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {variant?.barcode_aliases?.[0] || variant?.sku || product.type}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <p className="font-medium text-gray-900 text-sm">
                                                    {formatCurrency(variant?.price || product.base_price || 0)}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <span className={`font-medium text-sm ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {variant?.stock_quantity?.toFixed(0) || 0}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-right hidden sm:table-cell">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                                        <Edit2 className="w-4 h-4 text-gray-600" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        disabled={deletingId === product.id}
                                                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        {deletingId === product.id ? (
                                                            <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4 text-red-600" />
                                                        )}
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
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                        <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500 mb-3">Mahsulotlar yo'q</p>
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Qo'shish
                        </button>
                    </div>
                )}
            </div>

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                        {isCafeMode ? (
                            // Cafe Mode: Product with sizes
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                        <Coffee className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Yangi ichimlik</h2>
                                        <p className="text-sm text-gray-500">O'lchamlar bilan</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    {/* Product Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ichimlik nomi *
                                        </label>
                                        <input
                                            type="text"
                                            value={cafeProduct.name}
                                            onChange={(e) => setCafeProduct(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Masalan: Cappuccino"
                                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    
                                    {/* Size Prices */}
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-gray-700">
                                            O'lchamlar va narxlar
                                        </label>
                                        
                                        {/* Small */}
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                S
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-700">Kichik</p>
                                            </div>
                                            <input
                                                type="number"
                                                value={cafeProduct.prices.small}
                                                onChange={(e) => setCafeProduct(prev => ({
                                                    ...prev,
                                                    prices: { ...prev.prices, small: e.target.value }
                                                }))}
                                                placeholder="15000"
                                                className="w-28 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-right"
                                            />
                                        </div>
                                        
                                        {/* Medium */}
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                M
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-700">O'rtacha</p>
                                            </div>
                                            <input
                                                type="number"
                                                value={cafeProduct.prices.medium}
                                                onChange={(e) => setCafeProduct(prev => ({
                                                    ...prev,
                                                    prices: { ...prev.prices, medium: e.target.value }
                                                }))}
                                                placeholder="20000"
                                                className="w-28 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-right"
                                            />
                                        </div>
                                        
                                        {/* Large */}
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                L
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-700">Katta</p>
                                            </div>
                                            <input
                                                type="number"
                                                value={cafeProduct.prices.large}
                                                onChange={(e) => setCafeProduct(prev => ({
                                                    ...prev,
                                                    prices: { ...prev.prices, large: e.target.value }
                                                }))}
                                                placeholder="25000"
                                                className="w-28 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-right"
                                            />
                                        </div>
                                    </div>
                                    
                                    <p className="text-xs text-gray-500">
                                        💡 Faqat kerakli o'lchamlarni to'ldiring. Bo'sh qoldirilgan o'lchamlar qo'shilmaydi.
                                    </p>
                                </div>

                                <div className="flex gap-2 mt-5">
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Bekor
                                    </button>
                                    <button
                                        onClick={handleAddProduct}
                                        disabled={createMutation.isPending || !cafeProduct.name || 
                                            (!cafeProduct.prices.small && !cafeProduct.prices.medium && !cafeProduct.prices.large)}
                                        className="flex-1 px-3 py-2.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {createMutation.isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Qo'shish
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : (
                            // Standard Mode
                            <>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Yangi mahsulot</h2>
                                
                                <div className="space-y-3 sm:space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mahsulot nomi *
                                        </label>
                                        <input
                                            type="text"
                                            value={newProduct.name}
                                            onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Masalan: Coca-Cola 1L"
                                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Sotish narxi *
                                            </label>
                                            <input
                                                type="number"
                                                value={newProduct.base_price}
                                                onChange={(e) => setNewProduct(prev => ({ ...prev, base_price: e.target.value }))}
                                                placeholder="15000"
                                                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 sm:gap-3 mt-5 sm:mt-6">
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Bekor
                                    </button>
                                    <button
                                        onClick={handleAddProduct}
                                        disabled={createMutation.isPending || !newProduct.name || !newProduct.base_price}
                                        className="flex-1 px-3 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {createMutation.isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            "Qo'shish"
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
