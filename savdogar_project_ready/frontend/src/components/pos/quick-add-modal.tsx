"use client";

import { useState } from "react";
import { usePosState } from "@/stores/pos-state";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, X } from "lucide-react";
import { usePosSound } from "@/hooks/use-pos-sound";

interface QuickAddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialBarcode: string;
}

export function QuickAddProductModal({ isOpen, onClose, initialBarcode }: QuickAddProductModalProps) {
    const { tenantId, businessType } = usePosState();
    const { playSuccess } = usePosSound();
    const queryClient = useQueryClient();

    const [name, setName] = useState("");
    const [price, setPrice] = useState("");

    const createMutation = useMutation({
        mutationFn: async () => {
            // Basic product structure
            const productData = {
                name,
                price: parseFloat(price),
                sku: initialBarcode,
                barcode: initialBarcode,
                stock_quantity: 100, // Default stock for quick add
                category_id: null,
                organization_id: 1, // hardcoded for demo or derived from tenant
                attributes: businessType === 'retail' ? { expiry_date: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0] } : {}
            };
            // In real app, we'd call the API properly. Here we simulate.
            console.log("Creating product:", productData);
            return new Promise(resolve => setTimeout(resolve, 800));
        },
        onSuccess: () => {
            playSuccess();
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Refresh list
            onClose();
            setName("");
            setPrice("");
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
                    <h2 className="text-xl font-bold text-white">Mahsulot Topilmadi: {initialBarcode}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-slate-400 text-sm">
                        Ushbu shtrix-kod bazada mavjud emas. Uni tezda qo'shing.
                    </p>

                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-slate-300">Mahsulot Nomi</label>
                        <input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Masalan: Sut, Non..."
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="price" className="text-sm font-medium text-slate-300">Narxi</label>
                        <input
                            id="price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                        />
                    </div>
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
