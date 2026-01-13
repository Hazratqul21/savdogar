"use client";

import { useState } from 'react';
import { usePosState, type ProductVariant } from '@/stores/pos-state';
import { useQuery } from '@tanstack/react-query';
import { getProducts, searchProductsByBarcode, searchProductsBySku } from '@/lib/api-pos';
import { 
  Plus, Minus, Trash2, ShoppingCart, Search, User, ChevronDown, Coffee,
  Package, X, CreditCard, Banknote, Smartphone, ChevronRight, Home, Grid3X3
} from 'lucide-react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useToast } from '@/hooks/useToast';
import { ToastComponent } from '@/components/inventory/Toast';
import { ScanIndicator } from '@/components/pos/ScanIndicator';
import { MobileCartBar } from '@/components/pos/MobileCartBar';
import { MobileScannerButton } from '@/components/pos/MobileScannerButton';
import { QuickAddProductModal } from '@/components/pos/quick-add-modal';
import { SizeSelectionModal } from '@/components/pos/SizeSelectionModal';
import { soundManager } from '@/lib/sound-manager';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Group products by name for cafe mode
interface ProductGroup {
  name: string;
  variants: ProductVariant[];
  minPrice: number;
  maxPrice: number;
}

export function VisualGridView() {
  const {
    cart,
    addToCart,
    removeFromCart,
    incrementQuantity,
    decrementQuantity,
    getCartTotal,
    clearCart,
    tenantId,
    businessType,
  } = usePosState();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barcha');
  const [customerName, setCustomerName] = useState('');
  const { toasts, removeToast, error: showErrorToast } = useToast();
  
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [missingBarcode, setMissingBarcode] = useState("");
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedProductGroup, setSelectedProductGroup] = useState<ProductGroup | null>(null);
  
  const isCafeMode = businessType === 'cafe' || businessType === 'horeca' || businessType === 'kitchen';

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
        soundManager.playError();
        setScanError(true);
        setTimeout(() => setScanError(false), 1000);
        showErrorToast('Tenant ID topilmadi');
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
      showErrorToast('Mahsulotni qidirishda xatolik');
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

  // For cafe mode: Group products by name
  const productGroups: ProductGroup[] = [];
  if (isCafeMode) {
    const groupMap = new Map<string, ProductVariant[]>();
    allVariants.forEach((variant) => {
      const name = variant.product?.name || variant.sku;
      if (!groupMap.has(name)) {
        groupMap.set(name, []);
      }
      groupMap.get(name)!.push(variant);
    });
    
    groupMap.forEach((variants, name) => {
      const prices = variants.map(v => v.price);
      productGroups.push({
        name,
        variants,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
      });
    });
  }

  // Filter
  const filteredVariants = allVariants.filter((variant) => {
    const matchesSearch = !searchQuery || 
      variant.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variant.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredGroups = productGroups.filter((group) => {
    return !searchQuery || group.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddToCart = (variant: ProductVariant) => {
    addToCart(variant, 1);
    soundManager.playBeep();
    setScanSuccess(true);
    setTimeout(() => setScanSuccess(false), 300);
  };

  const handleProductClick = (group: ProductGroup) => {
    if (group.variants.length === 1) {
      handleAddToCart(group.variants[0]);
    } else {
      setSelectedProductGroup(group);
      setShowSizeModal(true);
    }
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = getCartTotal();

  const formatCurrency = (value: number) => value.toLocaleString() + " so'm";

  return (
    <div className="h-full flex bg-slate-950 dark">
      <ScanIndicator success={scanSuccess} error={scanError} />
      <MobileCartBar onScan={handleBarcodeScan} />
      
      {/* Left: Products */}
      <div className="flex-1 flex flex-col border-r border-slate-800">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/dashboard"
              className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <Home className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">
                {isCafeMode ? '☕ Qahvaxona' : '📦 Mahsulotlar'}
              </h1>
              <p className="text-xs text-slate-500">{filteredVariants.length || filteredGroups.length} ta topildi</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Mahsulot qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                style={{ fontSize: '16px' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="md:hidden">
              <MobileScannerButton onScan={handleBarcodeScan} batchMode={true} className="h-12" />
            </div>
            
            <div className="relative hidden md:block">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none pl-4 pr-10 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option>Barcha</option>
                <option>Ichimliklar</option>
                <option>Taomlar</option>
                <option>Shirinliklar</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {isCafeMode ? (
              filteredGroups.map((group) => {
                const hasSizes = group.variants.length > 1;
                const priceText = hasSizes 
                  ? `${group.minPrice.toLocaleString()} - ${group.maxPrice.toLocaleString()}`
                  : group.minPrice.toLocaleString();
                const inCart = cart.find(item => 
                  group.variants.some(v => v.id === item.variant_id)
                );
                
                return (
                  <button
                    key={group.name}
                    onClick={() => handleProductClick(group)}
                    className={cn(
                      "bg-slate-800/80 rounded-2xl p-4 text-left",
                      "border-2 transition-all duration-200 active:scale-[0.98]",
                      "hover:bg-slate-700/80 hover:border-amber-500/50",
                      inCart ? "border-amber-500/50" : "border-slate-700"
                    )}
                  >
                    <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center">
                      <Coffee className="w-7 h-7 text-amber-400" />
                    </div>
                    
                    <h3 className="font-semibold text-white text-sm text-center mb-2 line-clamp-2">
                      {group.name}
                    </h3>
                    
                    {hasSizes && (
                      <div className="flex justify-center gap-1 mb-2">
                        {['S', 'M', 'L'].slice(0, Math.min(group.variants.length, 3)).map((size) => (
                          <span key={size} className="w-6 h-6 text-xs font-bold rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                            {size}
                          </span>
                        ))}
                        {group.variants.length > 3 && (
                          <span className="text-xs text-slate-500 self-center ml-1">+{group.variants.length - 3}</span>
                        )}
                      </div>
                    )}
                    
                    <p className="text-center font-bold text-amber-400 text-sm">
                      {priceText}
                      <span className="text-xs text-slate-500 ml-1 font-normal">so'm</span>
                    </p>
                  </button>
                );
              })
            ) : (
              filteredVariants.map((variant) => {
                const productName = variant.product?.name || 'Mahsulot';
                const inCart = cart.find(item => item.variant_id === variant.id);

                return (
                  <button
                    key={variant.id}
                    onClick={() => handleAddToCart(variant)}
                    className={cn(
                      "relative bg-slate-800/80 rounded-2xl p-4 text-left",
                      "border-2 transition-all duration-200 active:scale-[0.98]",
                      "hover:bg-slate-700/80 hover:border-blue-500/50",
                      inCart ? "border-blue-500/50" : "border-slate-700"
                    )}
                  >
                    {inCart && (
                      <div className="absolute -top-2 -right-2 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                        {inCart.quantity}
                      </div>
                    )}
                    
                    <div className="w-12 h-12 mx-auto mb-3 bg-slate-700 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-slate-400" />
                    </div>
                    
                    <h3 className="font-semibold text-white text-sm text-center mb-1 line-clamp-2">
                      {productName}
                    </h3>
                    <p className="text-xs text-slate-500 text-center mb-2 font-mono">
                      {variant.sku}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-blue-400 text-sm">
                        {variant.price.toLocaleString()}
                        <span className="text-xs text-slate-500 ml-0.5 font-normal">so'm</span>
                      </p>
                      {variant.stock_quantity !== undefined && (
                        <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">
                          {variant.stock_quantity}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="hidden md:flex w-96 flex-col bg-slate-900">
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

        {/* Customer Name */}
        <div className="px-5 py-4 border-b border-slate-800">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Mijoz ismi (ixtiyoriy)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                <ShoppingCart className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-500 font-medium">Savat bo'sh</p>
              <p className="text-xs text-slate-600 mt-1">Mahsulotni tanlang</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => {
                const productName = item.variant.product?.name || item.variant.sku;
                return (
                  <div
                    key={item.variant_id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 pr-2">
                        <p className="font-semibold text-white text-sm line-clamp-2">{productName}</p>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">{item.variant.sku}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.variant_id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => decrementQuantity(item.variant_id)}
                          className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => incrementQuantity(item.variant_id)}
                          className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="font-bold text-white">
                        {formatCurrency(item.total)}
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
          <div className="border-t border-slate-800 px-5 py-5 space-y-4">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-white">Jami:</span>
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(cartTotal)}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button className="flex flex-col items-center gap-1 p-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl transition-colors">
                <Banknote className="w-5 h-5" />
                <span className="text-xs font-medium">Naqd</span>
              </button>
              <button className="flex flex-col items-center gap-1 p-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-colors">
                <CreditCard className="w-5 h-5" />
                <span className="text-xs font-medium">Karta</span>
              </button>
              <button className="flex flex-col items-center gap-1 p-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl transition-colors">
                <Smartphone className="w-5 h-5" />
                <span className="text-xs font-medium">Click</span>
              </button>
            </div>
            
            <button className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30">
              TO'LOV
              <ChevronRight className="w-5 h-5" />
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

      {/* Add New Product Modal */}
      <QuickAddProductModal
        isOpen={showQuickAdd}
        onClose={() => {
          setShowQuickAdd(false);
          setMissingBarcode("");
        }}
        initialBarcode={missingBarcode}
      />

      {/* Size Selection Modal */}
      {selectedProductGroup && (
        <SizeSelectionModal
          isOpen={showSizeModal}
          onClose={() => {
            setShowSizeModal(false);
            setSelectedProductGroup(null);
          }}
          productName={selectedProductGroup.name}
          variants={selectedProductGroup.variants}
          onSelect={handleAddToCart}
        />
      )}
    </div>
  );
}
