"use client";

import { useEffect, useRef, useState } from 'react';
import { usePosState } from '@/stores/pos-state';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { usePosSound } from '@/hooks/use-pos-sound';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { searchProductsByBarcode, searchProductsBySku, getProducts, searchSemantic } from '@/lib/api-pos';
import { Search, Plus, Minus, Trash2, ShoppingCart, Mic, MicOff } from 'lucide-react';
import { QuickAddProductModal } from '@/components/pos/quick-add-modal';
import { KeyboardGuide } from '@/components/pos/KeyboardGuide';
import { useVoiceCommand } from '@/hooks/use-voice-command';

export function ScannerView() {
  const {
    cart,
    searchQuery,
    setSearchQuery,
    setSearchFocused,
    addToCart,
    removeFromCart,
    incrementQuantity,
    decrementQuantity,
    getCartTotal,
    getServiceCharge,
    tenantId,
    businessType,
  } = usePosState();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { playBeep, playSuccess, playError } = usePosSound();

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [missingBarcode, setMissingBarcode] = useState("");

  // Auto-focus search on mount and blur
  useEffect(() => {
    const handleBlur = () => {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    };

    const input = searchInputRef.current;
    if (input) {
      input.addEventListener('blur', handleBlur);
      input.focus();
    }

    return () => {
      if (input) {
        input.removeEventListener('blur', handleBlur);
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' || e.key === 'F4') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'F8' && cart.length > 0) {
        e.preventDefault();
        playSuccess();
        // Here we would typically open the payment modal
        alert("To'lov oynasi ochilmoqda...");
      }
      if (e.key === 'F9') {
        e.preventDefault();
        alert("Chegirma kiritish rejimi (Tez orada)");
      }
      if (e.key === ' ' && cart.length > 0 && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        playSuccess();
        alert("To'lov oynasi ochilmoqda...");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, playSuccess]);

  const { isListening, startListening } = useVoiceCommand(async (text: string) => {
    // Basic NLP mantiqi (O'zbek tilida)
    const lowerText = text.toLowerCase();
    let quantity = 1;
    let searchTerm = text;

    // Sonlarni ajratib olish (masalan: "2 ta non")
    const numMatch = lowerText.match(/(\d+)/);
    if (numMatch) {
      quantity = parseInt(numMatch[1]);
      searchTerm = lowerText.replace(numMatch[0], '').replace('ta', '').trim();
    }

    if (searchTerm.includes("qo'sh") || searchTerm.includes("qosh")) {
      searchTerm = searchTerm.replace("qo'sh", "").replace("qosh", "").trim();
    }

    if (!tenantId) return;

    // Search for products
    let variant = await searchProductsByBarcode(searchTerm, tenantId);

    // If not found by barcode, try semantic search
    if (!variant) {
      const semanticResults = await searchSemantic(searchTerm);
      if (semanticResults && semanticResults.length > 0) {
        variant = semanticResults[0];
      }
    }

    if (variant) {
      playSuccess();
      addToCart(variant as any, quantity);
      setSearchQuery('');
    } else {
      playError();
      alert(`"${searchTerm}" topilmadi`);
    }
  });

  // Barcode scanner
  useBarcodeScanner({
    onScan: async (barcode) => {
      if (!tenantId) return;

      const variant = await searchProductsByBarcode(barcode, tenantId);
      if (variant) {
        playSuccess();
        addToCart(variant, 1);
        setSearchQuery('');
      } else {
        // Try SKU search
        const skuVariant = await searchProductsBySku(barcode, tenantId);
        if (skuVariant) {
          playSuccess();
          addToCart(skuVariant, 1);
          setSearchQuery('');
        } else {
          // Not found - Trigger Quick Add
          playError();
          setMissingBarcode(barcode);
          setShowQuickAdd(true);
        }
      }
    },
  });

  // Product search
  const { data: products = [] } = useQuery({
    queryKey: ['products', tenantId],
    queryFn: () => getProducts(tenantId!),
    enabled: !!tenantId,
  });

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.variants?.some((v: any) => v.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Global Search Bar - Always Focused */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={20} />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          onKeyDown={async (e) => {
            if (e.key === 'Enter' && searchQuery.trim() && tenantId) {
              const variant = await searchProductsByBarcode(searchQuery, tenantId) || await searchProductsBySku(searchQuery, tenantId);
              if (variant) {
                playSuccess();
                addToCart(variant as any, 1);
                setSearchQuery('');
              } else {
                const semantic = await searchSemantic(searchQuery);
                if (semantic && semantic.length > 0) {
                  playSuccess();
                  addToCart(semantic[0] as any);
                  setSearchQuery('');
                } else {
                  setMissingBarcode(searchQuery);
                  setShowQuickAdd(true);
                }
              }
            }
          }}
          placeholder="Mahsulot qidirish yoki barcode skanerlash (F2)"
          className="w-full pl-12 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <button
          onClick={startListening}
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-white'}`}
          title="Ovozli qidiruv"
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-auto">
        {/* Product List - High Density */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-4 overflow-auto border border-slate-800">
          <h3 className="text-lg font-semibold mb-4 text-white">Mahsulotlar</h3>
          <div className="space-y-2">
            {filteredProducts.map((product: any) =>
              product.variants?.map((variant: any) => (
                <div
                  key={variant.id}
                  onClick={() => {
                    playBeep();
                    addToCart(variant, 1);
                  }}
                  className="p-3 bg-slate-800/40 hover:bg-slate-700/60 rounded-lg cursor-pointer transition-colors border border-slate-700/50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white flex items-center gap-2">
                        {product.name}
                        {businessType === 'fashion' && (variant.attributes?.size) && (
                          <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 text-[10px] uppercase border border-pink-500/30">
                            {variant.attributes.size}
                          </span>
                        )}
                        {businessType === 'retail' && (variant.attributes?.expiry_date) && (
                          <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 text-[10px] border border-orange-500/30">
                            {variant.attributes.expiry_date}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-400">{variant.sku}</p>
                      <p className="text-sm text-slate-300">
                        {variant.price.toLocaleString()} so'm | Qty: {variant.stock_quantity}
                      </p>
                    </div>
                    <Plus className="text-blue-400" size={20} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cart - Compact */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-xl p-4 overflow-auto border border-slate-800 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ShoppingCart size={20} />
              Savat
            </h3>
            <span className="text-slate-400 text-sm">{cart.length} ta</span>
          </div>

          <div className="space-y-2 mb-4 flex-1 overflow-auto">
            {cart.map((item) => (
              <div
                key={item.variant_id}
                className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">
                      {item.variant.product?.name || item.variant.sku}
                    </p>
                    <p className="text-xs text-slate-400">{item.variant.sku}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.variant_id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decrementQuantity(item.variant_id)}
                      className="p-1 bg-slate-700/50 hover:bg-slate-600/50 rounded"
                    >
                      <Minus size={14} className="text-white" />
                    </button>
                    <span className="text-white font-medium w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => incrementQuantity(item.variant_id)}
                      className="p-1 bg-slate-700/50 hover:bg-slate-600/50 rounded"
                    >
                      <Plus size={14} className="text-white" />
                    </button>
                  </div>
                  <span className="text-white font-semibold">
                    {item.total.toLocaleString()} so'm
                  </span>
                </div>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-slate-700/50 pt-4 space-y-2">
              {getServiceCharge() > 0 && (
                <div className="flex justify-between items-center text-sm text-yellow-500/80">
                  <span>Xizmat haqi (10%)</span>
                  <span>{getServiceCharge().toLocaleString()} so'm</span>
                </div>
              )}
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 font-medium">Jami:</span>
                <span className="text-white text-2xl font-bold">
                  {getCartTotal().toLocaleString()} so'm
                </span>
              </div>
              <button
                onClick={() => playSuccess()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
              >
                To'lov (Space)
              </button>
            </div>
          )}
        </div>
      </div>

      <QuickAddProductModal
        isOpen={showQuickAdd}
        onClose={() => {
          setShowQuickAdd(false);
          setMissingBarcode("");
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }}
        initialBarcode={missingBarcode}
      />
      <KeyboardGuide />
    </div>
  );
}
