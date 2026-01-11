"use client";

import { useState, useEffect, useRef } from "react";
import { usePosState } from "@/stores/pos-state";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, X, Download, FileText } from "lucide-react";
import { usePosSound } from "@/hooks/use-pos-sound";
import { getAuthHeaders } from "@/lib/api";
import { contributeToGlobalCatalogRPC, type GlobalCatalogProduct } from "@/lib/supabase";
import { InvoiceScannerModal } from "./InvoiceScannerModal";
import { BulkImportTable } from "./BulkImportTable";
import { parseInvoice, type ParsedInvoiceItem } from "@/lib/api";

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
    const [category, setCategory] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [description, setDescription] = useState("");
    const [isImportedFromGlobal, setIsImportedFromGlobal] = useState(false);
    
    // Invoice Scanner state
    const [showInvoiceScanner, setShowInvoiceScanner] = useState(false);
    const [bulkImportItems, setBulkImportItems] = useState<ParsedInvoiceItem[]>([]);
    const [showBulkImport, setShowBulkImport] = useState(false);

    // Reset form and pre-fill from global catalog when modal opens
    useEffect(() => {
        if (isOpen && initialBarcode) {
            // Check if we have global catalog data stored in sessionStorage
            const globalDataStr = sessionStorage.getItem('global_catalog_data');
            
            if (globalDataStr) {
                try {
                    const storedData = JSON.parse(globalDataStr);
                    
                    // Handle both formats: { found: true, ...data } or direct GlobalCatalogProduct
                    const globalData: GlobalCatalogProduct = storedData.found 
                        ? { ...storedData, barcode: storedData.barcode || initialBarcode }
                        : storedData;
                    
                    // Pre-fill form with global catalog data
                    if ((storedData.found || globalData.name) && globalData.barcode === initialBarcode) {
                        setName(globalData.name || "");
                        setCategory(globalData.category || "");
                        setImageUrl(globalData.image_url || "");
                        setDescription(globalData.description || "");
                        setIsImportedFromGlobal(true);
                        
                        // Focus name field (user can still edit)
                        setTimeout(() => {
                            nameInputRef.current?.focus();
                            nameInputRef.current?.select(); // Select text so user can immediately overwrite
                        }, 100);
                        
                        // Clear the stored data
                        sessionStorage.removeItem('global_catalog_data');
                        return;
                    }
                } catch (error) {
                    console.warn('Failed to parse global catalog data:', error);
                    sessionStorage.removeItem('global_catalog_data');
                }
            }
            
            // No global data: Reset form fields for manual entry
            setName("");
            setPrice("");
            setCategory("");
            setImageUrl("");
            setDescription("");
            setIsImportedFromGlobal(false);
            
            // Focus name field after a short delay
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
            // Use VARIABLE type to explicitly control variant creation with barcode
            // Include description and category from global catalog if available
            const productData = {
                name,
                type: "VARIABLE", // Use VARIABLE type to explicitly create variant with barcode
                base_price: parseFloat(price),
                cost_price: parseFloat(price), // Use same as selling price for quick add
                tax_rate: 0.0,
                description: description || null, // Use description from global catalog if available
                category_id: null, // TODO: Map category name to category_id if needed
                // Variant will be created with barcode in barcode_aliases
                variants: [{
                    sku: initialBarcode, // Use barcode as SKU for easy identification
                    price: parseFloat(price),
                    cost_price: parseFloat(price),
                    stock_quantity: 0, // Default to 0, user can update later
                    barcode_aliases: [initialBarcode], // CRITICAL: Add barcode to aliases for scanning
                    attributes: {
                        ...(businessType === 'retail' 
                            ? { expiry_date: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0] } 
                            : {}),
                        // Store additional metadata from global catalog
                        ...(category ? { global_category: category } : {}),
                        ...(imageUrl ? { global_image_url: imageUrl } : {}),
                    },
                    is_active: true,
                }]
            };

            // Use the same API base URL logic as other API calls
            const apiBaseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
                ? 'http://localhost:8000'
                : process.env.NEXT_PUBLIC_API_URL || '';
            
            const response = await fetch(`${apiBaseUrl}/api/v1/v2/products`, {
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
        onSuccess: async (createdProduct) => {
            // Step 1: Product created locally - play success sound
            playSuccess();
            
            // Step 2: Contribute to global catalog (dual-write) - don't block on this
            // Uses Supabase RPC function upsert_global_catalog (handles UUID automatically)
            contributeToGlobalCatalogRPC(
                initialBarcode,
                name,
                category || undefined,
                imageUrl || undefined,
                description || undefined,
            ).catch((error) => {
                // Log but don't show error - local save succeeded
                console.warn('Failed to contribute to global catalog:', error);
            });
            
            // Step 3: Refresh product lists
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
            
            // Step 4: Close modal and reset form
            onClose();
            setName("");
            setPrice("");
            setCategory("");
            setImageUrl("");
            setDescription("");
            setIsImportedFromGlobal(false);
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

    // Handle bulk import from invoice scanner
    const handleBulkImport = async (items: ParsedInvoiceItem[]) => {
        if (items.length === 0 || !tenantId) return;

        try {
            // Create products one by one (TODO: Optimize with batch API if available)
            const results = await Promise.all(
                items.map(async (item) => {
                    const productData = {
                        name: item.product_name,
                        type: "VARIABLE",
                        base_price: item.price,
                        cost_price: item.price,
                        tax_rate: 0.0,
                        description: null,
                        category_id: null,
                        variants: [{
                            sku: `${item.product_name.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`,
                            price: item.price,
                            cost_price: item.price,
                            stock_quantity: item.quantity,
                            barcode_aliases: [],
                            attributes: {
                                ...(businessType === 'retail' 
                                    ? { expiry_date: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0] } 
                                    : {}),
                            },
                            is_active: true,
                        }]
                    };

                    const apiBaseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
                        ? 'http://localhost:8000'
                        : process.env.NEXT_PUBLIC_API_URL || '';

                    const response = await fetch(`${apiBaseUrl}/api/v1/v2/products`, {
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
                })
            );

            // Refresh products
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['products', tenantId] });

            // Close modals
            setShowBulkImport(false);
            setBulkImportItems([]);
            onClose();

            playSuccess();
        } catch (error) {
            console.error("Bulk import failed:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Invoice Scanner Modal */}
            {showInvoiceScanner && (
                <InvoiceScannerModal
                    isOpen={showInvoiceScanner}
                    onClose={() => {
                        setShowInvoiceScanner(false);
                        // If items were parsed, show bulk import table
                        if (bulkImportItems.length > 0) {
                            setShowBulkImport(true);
                        }
                    }}
                    onProductsParsed={(items) => {
                        setBulkImportItems(items);
                        setShowInvoiceScanner(false);
                        setShowBulkImport(true);
                    }}
                />
            )}

            {/* Bulk Import Modal */}
            {showBulkImport && bulkImportItems.length > 0 && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white">Bulk Import - {bulkImportItems.length} ta mahsulot</h2>
                            <button 
                                onClick={() => {
                                    setShowBulkImport(false);
                                    setBulkImportItems([]);
                                }} 
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <BulkImportTable
                                items={bulkImportItems}
                                tenantId={tenantId!}
                                onItemsChange={setBulkImportItems}
                                onImport={handleBulkImport}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Add Product Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white">Yangi Mahsulot Qo'shish</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Import Badge */}
                    {isImportedFromGlobal && (
                        <div className="bg-blue-500/10 border border-blue-500/50 text-blue-400 text-sm p-3 rounded-lg flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            <span className="font-medium">Global Import</span>
                            <span className="text-xs opacity-75">(Mahsulot global kataloglardan import qilindi)</span>
                        </div>
                    )}
                    
                    <p className="text-slate-400 text-sm">
                        {isImportedFromGlobal 
                            ? "Mahsulot global kataloglardan import qilindi. Ma'lumotlarni tekshiring va narxni kiriting."
                            : "Ushbu shtrix-kod bazada mavjud emas. Yangi mahsulot qo'shing."
                        }
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

                    {/* Category Field (optional) - Show if from global catalog or user can add */}
                    {(isImportedFromGlobal || category) && (
                        <div className="space-y-2">
                            <label htmlFor="category" className="text-sm font-medium text-slate-300">
                                Kategoriya {isImportedFromGlobal && "(Global kataloglardan)"}
                            </label>
                            <input
                                id="category"
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="Masalan: Ichimliklar, Oziq-ovqat..."
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                            />
                        </div>
                    )}

                    {/* Image URL Field (optional) - Show if from global catalog */}
                    {imageUrl && (
                        <div className="space-y-2">
                            <label htmlFor="image_url" className="text-sm font-medium text-slate-300">
                                Rasm {isImportedFromGlobal && "(Global kataloglardan)"}
                            </label>
                            <input
                                id="image_url"
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                            />
                            <img 
                                src={imageUrl} 
                                alt="Product preview" 
                                className="w-full h-32 object-contain bg-slate-800 rounded-lg mt-2 border border-slate-600"
                                onError={(e) => {
                                    // Hide image on error, show placeholder
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    {/* Description Field (optional) - Show if from global catalog */}
                    {description && (
                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-medium text-slate-300">
                                Tavsif {isImportedFromGlobal && "(Global kataloglardan)"}
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Mahsulot haqida qo'shimcha ma'lumot..."
                                rows={3}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500 resize-none"
                            />
                        </div>
                    )}

                    {/* Error Message */}
                    {createMutation.isError && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg">
                            {createMutation.error instanceof Error 
                                ? createMutation.error.message 
                                : "Mahsulot yaratishda xatolik yuz berdi"}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex justify-between items-center">
                    {/* Invoice Scanner Button */}
                    <button
                        onClick={() => setShowInvoiceScanner(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <FileText size={18} />
                        📸 Scan Invoice
                    </button>
                    
                    <div className="flex gap-3">
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
            </div>
        </>
    );
}
