"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2, XCircle, Package, DollarSign } from "lucide-react";
import { getAuthHeaders, getApiBaseUrl } from "@/lib/api";
import { searchGlobalCatalogByBarcode, contributeToGlobalCatalogRPC, type GlobalCatalogProduct } from "@/lib/supabase";

interface BarcodeAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    barcode: string;
    businessType?: string;
}

async function createProduct(data: any) {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/v1/v2/products`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || "Failed to create product");
    }
    return response.json();
}

export function BarcodeAddModal({ isOpen, onClose, barcode, businessType = "retail" }: BarcodeAddModalProps) {
    const queryClient = useQueryClient();
    const nameInputRef = useRef<HTMLInputElement>(null);
    
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [costPrice, setCostPrice] = useState("");
    const [category, setCategory] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isImportedFromGlobal, setIsImportedFromGlobal] = useState(false);

    // Load global catalog data when modal opens
    useEffect(() => {
        if (isOpen && barcode) {
            setIsLoading(true);
            setError(null);
            
            // Check sessionStorage for global catalog data
            const globalDataStr = sessionStorage.getItem('global_catalog_data');
            
            if (globalDataStr) {
                try {
                    const storedData = JSON.parse(globalDataStr);
                    const globalData: GlobalCatalogProduct = storedData.found 
                        ? { ...storedData, barcode: storedData.barcode || barcode }
                        : storedData;
                    
                    if (globalData.name) {
                        setName(globalData.name);
                        setIsImportedFromGlobal(true);
                    }
                    if (globalData.category) setCategory(globalData.category);
                    if (globalData.image_url) setImageUrl(globalData.image_url);
                    if (globalData.description) setDescription(globalData.description);
                } catch (e) {
                    console.warn("Failed to parse global catalog data:", e);
                }
            } else {
                // Try to fetch from global catalog
                searchGlobalCatalogByBarcode(barcode).then((globalProduct) => {
                    if (globalProduct) {
                        setName(globalProduct.name || "");
                        if (globalProduct.category) setCategory(globalProduct.category);
                        if (globalProduct.image_url) setImageUrl(globalProduct.image_url);
                        if (globalProduct.description) setDescription(globalProduct.description);
                        setIsImportedFromGlobal(true);
                    }
                }).catch((e) => {
                    console.warn("Global catalog search failed:", e);
                });
            }
            
            setIsLoading(false);
            
            // Focus on price input
            setTimeout(() => {
                const priceInput = document.querySelector('input[type="number"]') as HTMLInputElement;
                priceInput?.focus();
            }, 100);
        }
    }, [isOpen, barcode]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setName("");
            setPrice("");
            setCostPrice("");
            setCategory("");
            setImageUrl("");
            setDescription("");
            setError(null);
            setIsImportedFromGlobal(false);
        }
    }, [isOpen]);

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!name.trim() || !price) {
                throw new Error("Mahsulot nomi va narxini kiriting");
            }

            const productData = {
                name: name.trim(),
                type: "simple",
                base_price: parseFloat(price),
                cost_price: costPrice ? parseFloat(costPrice) : parseFloat(price) * 0.7,
                product_metadata: {
                    ...(category && { category }),
                    ...(imageUrl && { image_url: imageUrl }),
                    ...(description && { description }),
                },
                variants: [{
                    sku: `${name.trim().toUpperCase().replace(/\s+/g, '-')}-${barcode.slice(-4)}`,
                    price: parseFloat(price),
                    cost_price: costPrice ? parseFloat(costPrice) : parseFloat(price) * 0.7,
                    stock_quantity: 0,
                    barcode_aliases: [barcode],
                    attributes: {},
                    is_active: true,
                }],
            };

            // 1. Create product
            const result = await createProduct(productData);

            // 2. Contribute to global catalog
            if (barcode && name) {
                try {
                    await contributeToGlobalCatalogRPC(
                        barcode,
                        name,
                        category || undefined,
                        imageUrl || undefined,
                        description || undefined
                    );
                } catch (e) {
                    console.warn("Global catalog contribution failed:", e);
                }
            }

            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            onClose();
        },
        onError: (error: Error) => {
            setError(error.message);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Barcode orqali qo'shish</h2>
                                <p className="text-xs text-gray-500">Barcode: {barcode}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        {isImportedFromGlobal && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-green-700 text-sm">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Global katalogdan topildi</span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-red-700 text-sm">
                                    <XCircle className="w-4 h-4" />
                                    <span>{error}</span>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mahsulot nomi *
                            </label>
                            <input
                                ref={nameInputRef}
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Mahsulot nomi"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sotish narxi * <DollarSign className="w-3 h-3 inline" />
                                </label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0"
                                    step="0.01"
                                    min="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tannarx (ixtiyoriy)
                                </label>
                                <input
                                    type="number"
                                    value={costPrice}
                                    onChange={(e) => setCostPrice(e.target.value)}
                                    placeholder="Avtomatik"
                                    step="0.01"
                                    min="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kategoriya (ixtiyoriy)
                            </label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="Kategoriya"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rasm URL (ixtiyoriy)
                            </label>
                            <input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tavsif (ixtiyoriy)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Mahsulot tavsifi"
                                rows={2}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="submit"
                                disabled={createMutation.isPending || isLoading}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Qo'shilmoqda...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Qo'shish
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
