"use client";

import { useState } from 'react';
import { usePosState, type ProductVariant } from '@/stores/pos-state';
import { useQuery } from '@tanstack/react-query';
import { getProducts, searchProductsByBarcode, searchProductsBySku } from '@/lib/api-pos';
import { Plus, Minus, Trash2, ShoppingCart, Search, User, ChevronDown } from 'lucide-react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useToast } from '@/hooks/useToast';
import { ToastComponent } from '@/components/inventory/Toast';
import { ScanIndicator } from '@/components/pos/ScanIndicator';
import { MobileCartBar } from '@/components/pos/MobileCartBar';
import { MobileScannerButton } from '@/components/pos/MobileScannerButton';
import { soundManager } from '@/lib/sound-manager';

export function VisualGridView() {
  const {
    cart,
    addToCart,
    removeFromCart,
    incrementQuantity,
    decrementQuantity,
    getCartTotal,
    tenantId,
  } = usePosState();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barcha kategoriyalar');
  const [customerName, setCustomerName] = useState('');
  const { toasts, removeToast, error: showErrorToast } = useToast();
  
  // Scan indicator state
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState(false);

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
   * Used by both USB scanner and mobile camera scanner
   */
  const handleBarcodeScan = async (barcode: string) => {
    try {
      if (!tenantId) {
        soundManager.playError();
        setScanError(true);
        setTimeout(() => setScanError(false), 1000);
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
      } else {
        // Not found: Visual feedback: Red flash
        setScanError(true);
        setTimeout(() => setScanError(false), 1000);
        
        // Audio feedback: Error buzzer
        soundManager.playError();
        
        // Show toast notification
        const truncatedBarcode = barcode.length > 8 
          ? `${barcode.substring(0, 8)}...` 
          : barcode;
        showErrorToast(`Product not found: ${truncatedBarcode}`);
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
      
      // Error feedback
      setScanError(true);
      setTimeout(() => setScanError(false), 1000);
      soundManager.playError();
      showErrorToast('Error: Failed to search for product');
    }
  };

  const { data: products = [] } = useQuery({
    queryKey: ['products', tenantId],
    queryFn: () => getProducts(tenantId!),
    enabled: !!tenantId,
  });

  // Flatten products to variants
  const allVariants: ProductVariant[] = [];
  products.forEach((product: any) => {
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant: ProductVariant) => {
        allVariants.push(variant);
      });
    }
  });

  // Filter products
  const filteredVariants = allVariants.filter((variant) => {
    const matchesSearch = !searchQuery || 
      variant.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variant.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleAddToCart = (variant: ProductVariant) => {
    addToCart(variant, 1);
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-full flex bg-white">
      {/* Scan Indicator - Visual feedback for scans */}
      <ScanIndicator success={scanSuccess} error={scanError} />
      
      {/* Mobile Cart Bar with Scanner Button - Only on mobile */}
      <MobileCartBar onScan={handleBarcodeScan} />
      
      {/* Left: Products List */}
      <div className="flex-1 flex flex-col border-r border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Mahsulotlar</h2>
          
          {/* Search and Category */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Mahsulotlarni qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Mobile Scanner Button - Only on mobile */}
            <div className="md:hidden">
              <MobileScannerButton
                onScan={handleBarcodeScan}
                batchMode={true}
                className="h-10"
              />
            </div>
            
            <div className="relative hidden md:block">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
              >
                <option>Barcha kategoriyalar</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4">
            {filteredVariants.map((variant) => {
              const productName = variant.product?.name || 'Mahsulot';
              const productCode = variant.sku || '';
              const price = variant.price || 0;
              const stock = variant.stock_quantity || 0;
              const unit = variant.attributes?.unit || 'kg';

              return (
                <div
                  key={variant.id}
                  onClick={() => handleAddToCart(variant)}
                  className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
                >
                  <div className="mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{productName}</h3>
                    <p className="text-xs text-gray-500">{productCode}</p>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-lg font-bold text-gray-900">
                      {price.toLocaleString()} so'm
                    </p>
                    <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {stock} {unit}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-96 flex flex-col bg-white border-l border-gray-200">
        {/* Cart Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Savat ({cartItemCount})
          </h2>
        </div>

        {/* Customer Name */}
        <div className="px-6 py-4 border-b border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Mijoz ismi (Ixtiyoriy)</p>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Mehmon mijoz"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="text-gray-300 mb-4" size={64} />
              <p className="text-gray-500 font-medium">Savat bo'sh</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => {
                const productName = item.variant.product?.name || item.variant.sku;
                return (
                  <div
                    key={item.variant_id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm mb-1">{productName}</p>
                        <p className="text-xs text-gray-500">{item.variant.sku}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.variant_id)}
                        className="text-red-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => decrementQuantity(item.variant_id)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          <Minus size={14} className="text-gray-600" />
                        </button>
                        <span className="font-semibold text-gray-900 w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => incrementQuantity(item.variant_id)}
                          className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        >
                          <Plus size={14} className="text-gray-600" />
                        </button>
                      </div>
                      <span className="font-bold text-gray-900">
                        {item.total.toLocaleString()} so'm
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Total & Payment */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Jami:</span>
              <span className="text-2xl font-bold text-gray-900">
                {getCartTotal().toLocaleString()} so'm
              </span>
            </div>
            <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors">
              To'lov
            </button>
          </div>
        )}
      </div>

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
