"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePosState } from '@/stores/pos-state';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { usePosSound } from '@/hooks/use-pos-sound';
import { useQuery } from '@tanstack/react-query';
import { searchProductsByBarcode, searchProductsBySku, searchSemantic } from '@/lib/api-pos';
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, Mic, MicOff, Camera, 
  CreditCard, Banknote, Smartphone, QrCode, X, ChevronRight,
  Clock, User, Hash, ArrowRight, Percent, Tag, Package,
  Keyboard, Zap, Home
} from 'lucide-react';
import { QuickAddProductModal } from '@/components/pos/quick-add-modal';
import { KeyboardGuide } from '@/components/pos/KeyboardGuide';
import { useVoiceCommand } from '@/hooks/use-voice-command';
import { MobileCartBar } from '@/components/pos/MobileCartBar';
import { MobileScannerButton } from '@/components/pos/MobileScannerButton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { ToastComponent } from '@/components/inventory/Toast';
import { ScanIndicator } from '@/components/pos/ScanIndicator';
import { soundManager } from '@/lib/sound-manager';
import Link from 'next/link';

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
    getCartSubtotal,
    getCartDiscount,
    clearCart,
    tenantId,
    businessType,
  } = usePosState();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { playBeep, playSuccess, playError } = usePosSound();
  const { toasts, removeToast, error: showErrorToast } = useToast();

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [missingBarcode, setMissingBarcode] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-focus search
  useEffect(() => {
    const handleBlur = () => {
      setTimeout(() => {
        if (!showQuickAdd && !showPaymentModal) {
          searchInputRef.current?.focus();
        }
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
  }, [showQuickAdd, showPaymentModal]);

  // HID Barcode Scanner
  useBarcodeScanner({
    onScan: async (barcode) => {
      await handleBarcodeScan(barcode);
    },
    enabled: true,
    maxGap: 50,
    ignoreInputFocus: true,
  });

  const handleBarcodeScan = async (barcode: string) => {
    try {
      if (!tenantId) {
        playError();
        setScanError(true);
        showErrorToast('Tenant ID not set');
        return;
      }

      let variant = await searchProductsByBarcode(barcode, tenantId);

      if (!variant) {
        variant = await searchProductsBySku(barcode, tenantId);
      }

      if (variant) {
        addToCart(variant, 1);
        setScanSuccess(true);
        setTimeout(() => setScanSuccess(false), 1000);
        soundManager.playBeep();
      } else {
        const { searchGlobalCatalogByBarcode } = await import('@/lib/supabase');
        const globalProduct = await searchGlobalCatalogByBarcode(barcode);
        
        setMissingBarcode(barcode);
        setShowQuickAdd(true);
        
        if (globalProduct) {
          sessionStorage.setItem('global_catalog_data', JSON.stringify({
            found: true,
            ...globalProduct
          }));
        } else {
          sessionStorage.removeItem('global_catalog_data');
        }
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
      setScanError(true);
      setTimeout(() => setScanError(false), 1000);
      soundManager.playError();
      playError();
      showErrorToast('Mahsulotni qidirishda xatolik');
    }
  };

  const { isListening, startListening, stopListening } = useVoiceCommand(async (command) => {
    if (command.toLowerCase().includes('search')) {
      const query = command.replace(/search|find/gi, '').trim();
      setSearchQuery(query);
    }
  });

  const handleMobileCameraScan = async (barcode: string) => {
    await handleBarcodeScan(barcode);
  };

  const { data: searchResults = [] } = useQuery({
    queryKey: ['semantic-search', searchQuery],
    queryFn: () => searchSemantic(searchQuery),
    enabled: searchQuery.length > 2,
  });

  const cartTotal = getCartTotal();
  const cartSubtotal = getCartSubtotal();
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatCurrency = (value: number) => {
    return value.toLocaleString() + " so'm";
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 dark">
      {/* Scan Indicator */}
      <ScanIndicator success={scanSuccess} error={scanError} />
      
      {/* Mobile Cart Bar */}
      <MobileCartBar onScan={handleMobileCameraScan} />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Back to Dashboard */}
              <Link 
                href="/dashboard"
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <Home className="w-4 h-4" />
              </Link>

              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 h-5 w-5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Barcode skanerlang yoki mahsulot nomi kiriting..."
                  className={cn(
                    "w-full pl-12 pr-4 py-3.5 bg-slate-800 border-2 border-slate-700 rounded-xl",
                    "text-white placeholder-slate-500 text-base",
                    "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                    "transition-all duration-200"
                  )}
                  style={{ fontSize: '16px' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Mobile Scanner */}
              <MobileScannerButton
                onScan={handleMobileCameraScan}
                batchMode={true}
              />

              {/* Voice Search */}
              <button
                onClick={isListening ? stopListening : startListening}
                className={cn(
                  "hidden md:flex p-3.5 rounded-xl transition-all",
                  isListening
                    ? "bg-red-500 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                )}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              {/* Time Display */}
              <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800 text-slate-400">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-sm">
                  {currentTime.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {searchQuery.length > 2 && searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {searchResults.map((variant) => {
                  const productName = variant.product?.name || variant.sku;
                  const inCart = cart.find(item => item.variant_id === variant.id);
                  
                  return (
                    <button
                      key={variant.id}
                      onClick={() => {
                        addToCart(variant, 1);
                        playSuccess();
                        setScanSuccess(true);
                        setTimeout(() => setScanSuccess(false), 300);
                      }}
                      className={cn(
                        "relative bg-slate-800/80 border-2 rounded-2xl p-5 text-left",
                        "hover:bg-slate-700/80 hover:border-slate-600 active:scale-[0.98]",
                        "transition-all duration-200",
                        inCart ? "border-blue-500/50" : "border-slate-700"
                      )}
                    >
                      {inCart && (
                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                          {inCart.quantity}
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                          <Package className="w-6 h-6 text-slate-400" />
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          {variant.sku}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">
                        {productName}
                      </h3>
                      
                      {variant.stock_quantity !== undefined && (
                        <p className="text-xs text-slate-500 mb-3">
                          Qoldiq: {variant.stock_quantity} dona
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-white">
                          {formatCurrency(variant.price)}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                          <Plus className="w-5 h-5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 rounded-3xl bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
                    <QrCode className="w-12 h-12 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Barcode skanerlang
                  </h3>
                  <p className="text-slate-400 mb-6">
                    USB skaner yoki mobil kamera orqali mahsulot qo'shing
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                      <Keyboard className="w-4 h-4" />
                      F1-F12 tezkor tugmalar
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                      <Zap className="w-4 h-4" />
                      ESC - tozalash
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Keys Bar (Desktop) */}
          <div className="hidden lg:flex bg-slate-900 border-t border-slate-800 px-4 py-3 gap-2 overflow-x-auto">
            {['F1', 'F2', 'F3', 'F4', 'F5', 'F6'].map((key) => (
              <button
                key={key}
                className="flex-shrink-0 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-sm font-medium transition-colors"
              >
                {key}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={() => clearCart()}
              disabled={cart.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Tozalash (ESC)
            </button>
          </div>
        </div>

        {/* Right Panel - Cart (Desktop) */}
        <div className="hidden md:flex w-[380px] lg:w-[420px] flex-col bg-slate-900 border-l border-slate-800">
          {/* Cart Header */}
          <div className="px-5 py-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Savat</h2>
                  <p className="text-xs text-slate-500">{cartItemCount} ta mahsulot</p>
                </div>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="h-full flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-10 h-10 text-slate-600" />
                  </div>
                  <p className="text-slate-500 font-medium">Savat bo'sh</p>
                  <p className="text-xs text-slate-600 mt-1">Mahsulotni skanerlang</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {cart.map((item, index) => {
                  const productName = item.variant.product?.name || item.variant.sku;
                  return (
                    <div
                      key={item.variant_id}
                      className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0 pr-3">
                          <h4 className="font-medium text-white text-sm line-clamp-2">
                            {productName}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5 font-mono">
                            {item.variant.sku}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.variant_id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => decrementQuantity(item.variant_id)}
                            className="w-9 h-9 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center text-white font-bold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => incrementQuantity(item.variant_id)}
                            className="w-9 h-9 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-400">
                            {formatCurrency(item.unit_price)}
                          </p>
                          <p className="font-bold text-white">
                            {formatCurrency(item.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          <div className="border-t border-slate-800 p-5 space-y-4">
            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Jami</span>
                <span className="text-slate-300">{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Chegirma</span>
                <span className="text-emerald-400">-{formatCurrency(getCartDiscount())}</span>
              </div>
              <div className="h-px bg-slate-700 my-3" />
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-white">To'lov</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(cartTotal)}</span>
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={cart.length === 0}
                className="flex flex-col items-center gap-1 p-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition-colors disabled:opacity-50"
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs font-medium">Naqd</span>
              </button>
              <button
                disabled={cart.length === 0}
                className="flex flex-col items-center gap-1 p-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-colors disabled:opacity-50"
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs font-medium">Karta</span>
              </button>
              <button
                disabled={cart.length === 0}
                className="flex flex-col items-center gap-1 p-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl transition-colors disabled:opacity-50"
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs font-medium">Click</span>
              </button>
            </div>

            {/* Main Pay Button */}
            <button
              disabled={cart.length === 0}
              className={cn(
                "w-full py-4 rounded-xl font-bold text-lg",
                "flex items-center justify-center gap-3",
                "transition-all duration-200",
                cart.length > 0
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              )}
            >
              <span>TO'LOV</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
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

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
