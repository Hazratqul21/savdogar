"use client";

import { useState, useEffect, useRef } from "react";
import { usePosState } from "@/stores/pos-state";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, X } from "lucide-react";
import { usePosSound } from "@/hooks/use-pos-sound";
import { getAuthHeaders } from "@/lib/api";

interface QuickAddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialBarcode: string;
}

export function QuickAddProductModal({ isOpen, onClose, initialBarcode }: QuickAddProductModalProps) {
    const { tenantId, businessType } = usePosState();
    const { playSuccess } = usePosSound();
    const queryClient = useQueryClient();
    const nameInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState("");
    const [price, setPrice] = useState("");

    // Reset form and focus name field when modal opens
    useEffect(() => {
        if (isOpen && initialBarcode) {
            // Reset form fields
            setName("");
            setPrice("");
            
            // Focus name field after a short delay (to ensure modal is fully rendered)
            setTimeout(() => {
                nameInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, initialBarcode]);

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!name || !price || !initialBarcode) {
                throw new Error("Name, price, and barcode are required");
            }

            // Create product using products_v2 API (with variant and barcode_aliases)
            const productData = {
                name,
                type: "SIMPLE", // Simple product for quick add
                base_price: parseFloat(price),
                cost_price: parseFloat(price), // Use same as selling price for quick add
                tax_rate: 0.0,
                description: null,
                category_id: null,
                // Variant will be auto-created with barcode in barcode_aliases
                variants: [{
                    sku: initialBarcode, // Use barcode as SKU
                    price: parseFloat(price),
                    cost_price: parseFloat(price),
                    stock_quantity: 0, // Default to 0, user can update later
                    barcode_aliases: [initialBarcode], // Add barcode to aliases
                    attributes: businessType === 'retail' 
                        ? { expiry_date: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0] } 
                        : {},
                    is_active: true,
                }]
            };

            // Use the same API base URL logic as other API calls
            const apiBaseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
                ? 'http://localhost:8000'
                : process.env.NEXT_PUBLIC_API_URL || '';
            
            const response = await fetch(`${apiBaseUrl}/api/v1/products_v2`, {
                method: "POST",
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(productData),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: "Failed to create product" }));
                throw new Error(error.detail || "Failed to create product");
            }

            return response.json();
        },
        onSuccess: () => {
            playSuccess();
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Refresh product list
            queryClient.invalidateQueries({ queryKey: ['products', tenantId] }); // Refresh specific tenant products
            onClose();
            setName("");
            setPrice("");
        },
        onError: (error: Error) => {
            console.error("Failed to create product:", error);
            // Error will be shown by UI
        }
    });

    const handleSave = () => {
        if (!name || !price) return;
        createMutation.mutate();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white">Yangi Mahsulot Qo'shish</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-slate-400 text-sm">
                        Ushbu shtrix-kod bazada mavjud emas. Yangi mahsulot qo'shing.
                    </p>

                    {/* Barcode Field - Auto-filled and read-only */}
                    <div className="space-y-2">
                        <label htmlFor="barcode" className="text-sm font-medium text-slate-300">
                            Shtrix-kod (Avtomatik)
                        </label>
                        <input
                            id="barcode"
                            type="text"
                            value={initialBarcode}
                            readOnly
                            disabled
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
                        />
                    </div>

                    {/* Name Field - Focused automatically */}
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-slate-300">
                            Mahsulot Nomi <span className="text-red-400">*</span>
                        </label>
                        <input
                            ref={nameInputRef}
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Masalan: Sut, Non..."
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                            onKeyDown={(e) => {
                                // Allow Enter key to submit
                                if (e.key === 'Enter' && name && price) {
                                    handleSave();
                                }
                            }}
                        />
                    </div>

                    {/* Price Field */}
                    <div className="space-y-2">
                        <label htmlFor="price" className="text-sm font-medium text-slate-300">
                            Narxi <span className="text-red-400">*</span>
                        </label>
                        <input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                            onKeyDown={(e) => {
                                // Allow Enter key to submit
                                if (e.key === 'Enter' && name && price) {
                                    handleSave();
                                }
                            }}
                        />
                    </div>

                    {/* Error Message */}
                    {createMutation.isError && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg">
                            {createMutation.error instanceof Error 
                                ? createMutation.error.message 
                                : "Mahsulot yaratishda xatolik yuz berdi"}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
                    >
                        Bekor qilish
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={createMutation.isPending || !name || !price}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {createMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Saqlash
                    </button>
                </div>
            </div>
        </div>
    );
}
