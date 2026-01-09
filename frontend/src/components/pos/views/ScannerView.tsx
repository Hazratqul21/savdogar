"use client";

import { useEffect, useRef, useState } from 'react';
import { usePosState } from '@/stores/pos-state';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { usePosSound } from '@/hooks/use-pos-sound';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { searchProductsByBarcode, searchProductsBySku, getProducts, searchSemantic } from '@/lib/api-pos';
import { Search, Plus, Minus, Trash2, ShoppingCart, Mic, MicOff, Camera } from 'lucide-react';
import { QuickAddProductModal } from '@/components/pos/quick-add-modal';
import { KeyboardGuide } from '@/components/pos/KeyboardGuide';
import { useVoiceCommand } from '@/hooks/use-voice-command';
import { MobileCartBar } from '@/components/pos/MobileCartBar';
import { MobileScannerButton } from '@/components/pos/MobileScannerButton';
import { CartSidebar } from '@/components/pos/CartSidebar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { ToastComponent } from '@/components/inventory/Toast';
import { ScanIndicator } from '@/components/pos/ScanIndicator';
import { soundManager } from '@/lib/sound-manager';

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
  const { toasts, removeToast, error: showErrorToast } = useToast();

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [missingBarcode, setMissingBarcode] = useState("");
  
  // Scan indicator state
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState(false);


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

  // HID Barcode Scanner: Listen for USB scanner input
  useBarcodeScanner({
    onScan: async (barcode) => {
      await handleBarcodeScan(barcode);
    },
    enabled: true,
    maxGap: 50, // 50ms max gap for rapid input detection
    ignoreInputFocus: true, // Don't intercept when user is typing in input fields
  });

  /**
   * Handle barcode scan: Search and add to cart
   */
  const handleBarcodeScan = async (barcode: string) => {
    try {
      if (!tenantId) {
        playError();
        setScanError(true);
        showErrorToast('Tenant ID not set. Please select a business first.');
        return;
      }

      // Step 1: Search by barcode
      let variant = await searchProductsByBarcode(barcode, tenantId);

      // Step 2: If not found, try SKU search
      if (!variant) {
        variant = await searchProductsBySku(barcode, tenantId);
      }

      // Step 3: Handle result
      if (variant) {
        // Found: Auto-add to cart (increment quantity if already exists)
        addToCart(variant, 1);
        
        // Visual feedback: Green flash
        setScanSuccess(true);
        setTimeout(() => setScanSuccess(false), 1000);
        
        // Audio feedback: Success beep
        soundManager.playBeep();
        
        // Optional: Play success sound
        playSuccess();
      } else {
        // Not found: Visual feedback: Red flash
        setScanError(true);
        setTimeout(() => setScanError(false), 1000);
        
        // Audio feedback: Error buzzer
        soundManager.playError();
        playError();
        
        // Show toast notification
        const truncatedBarcode = barcode.length > 8 
          ? `${barcode.substring(0, 8)}...` 
          : barcode;
        showErrorToast(`Product not found: ${truncatedBarcode}`);
        
        // Show quick-add modal for missing products
        setMissingBarcode(barcode);
        setShowQuickAdd(true);
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
      
      // Error feedback
      setScanError(true);
      setTimeout(() => setScanError(false), 1000);
      soundManager.playError();
      playError();
      showErrorToast('Error: Failed to search for product');
    }
  };

  // Voice commands
  const { isListening, startListening, stopListening } = useVoiceCommand({
    onCommand: async (command) => {
      if (command.toLowerCase().includes('search')) {
        const query = command.replace(/search|find/gi, '').trim();
        setSearchQuery(query);
      }
    },
  });

  /**
   * Handle mobile camera scan (same logic as USB scanner)
   * This function is called by MobileScannerButton component
   */
  const handleMobileCameraScan = async (barcode: string) => {
    // Use the same handleBarcodeScan function for consistency
    await handleBarcodeScan(barcode);
  };

  // Semantic search
  const { data: searchResults = [] } = useQuery({
    queryKey: ['semantic-search', searchQuery],
    queryFn: () => searchSemantic(searchQuery),
    enabled: searchQuery.length > 2,
  });

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Scan Indicator - Visual feedback for scans */}
      <ScanIndicator success={scanSuccess} error={scanError} />
      
      {/* Mobile Cart Bar - Only on mobile (with scanner button) */}
      <MobileCartBar onScan={handleMobileCameraScan} />

      {/* Header - Search Bar */}
      <div className="bg-slate-900 border-b border-slate-700 p-4">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Mahsulot qidirish yoki barcode skanerlash..."
              className={cn(
                "w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg",
                "text-white placeholder-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                "text-base md:text-sm" // 16px+ on mobile to prevent iOS zoom
              )}
              style={{ fontSize: '16px' }} // Ensure 16px on mobile
            />
          </div>

          {/* Mobile Camera Scanner Button */}
          <MobileScannerButton
            onScan={handleMobileCameraScan}
            batchMode={true} // Keep camera open for batch scanning
          />

          {/* Voice Search Button */}
          <button
            onClick={isListening ? stopListening : startListening}
            className={cn(
              "px-4 py-3 rounded-lg transition-colors",
              isListening
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-slate-800 hover:bg-slate-700 text-gray-300",
              "min-h-[44px]" // Thumb-friendly
            )}
            aria-label={isListening ? "Stop listening" : "Start voice search"}
          >
            {isListening ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Product List / Search Results */}
        <div className={cn(
          "flex-1 overflow-y-auto p-4",
          "md:pr-0" // Remove padding on desktop when sidebar is visible
        )}>
          {searchQuery.length > 2 && searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {searchResults.map((variant) => (
                <div
                  key={variant.id}
                  onClick={() => {
                    addToCart(variant, 1);
                    playSuccess();
                  }}
                  className={cn(
                    "bg-slate-800 border border-slate-700 rounded-lg p-4",
                    "cursor-pointer hover:bg-slate-700 transition-colors",
                    "min-h-[120px] flex flex-col justify-between"
                  )}
                >
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      {variant.product?.name || variant.sku}
                    </h3>
                    <p className="text-sm text-gray-400">{variant.sku}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-white">
                      {variant.price.toLocaleString()} so'm
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(variant, 1);
                        playSuccess();
                      }}
                      className={cn(
                        "px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg",
                        "min-h-[44px] min-w-[44px]" // Thumb-friendly
                      )}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Mahsulot qidirish yoki barcode skanerlash</p>
                <p className="text-sm mt-2">Mobilda: Kamera tugmasini bosing</p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Cart Sidebar - Hidden on mobile */}
        <div className="hidden md:block w-96 flex-shrink-0">
          <CartSidebar />
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
