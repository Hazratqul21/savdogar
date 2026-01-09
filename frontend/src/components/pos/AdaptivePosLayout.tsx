"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { usePosState, ProductVariant } from "@/stores/pos-state";
import { getTenantInfo, getProducts, searchProductsByBarcode, searchProductsBySku } from "@/lib/api-pos";
import { ProductCard } from "./ProductCard";
import { CartSidebar } from "./CartSidebar";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useToast } from "@/hooks/useToast";
import { ToastComponent } from "@/components/inventory/Toast";
import { ScanIndicator } from "@/components/pos/ScanIndicator";
import { MobileCartBar } from "./MobileCartBar";
import { MobileScannerButton } from "./MobileScannerButton";
import { QuickAddProductModal } from "./quick-add-modal";
import { soundManager } from "@/lib/sound-manager";

/**
 * Adaptive POS Layout
 * 
 * Layout: 65% Product Grid | 35% Cart Sidebar
 * 
 * Adaptive Behavior:
 * - RETAIL: Product grid, simple add +1 on click
 * - PLUMBING_HVAC: Product grid, dialog for "How many meters?" on click
 * - HORECA/CAFE: Table map view (to be implemented)
 */
export function AdaptivePosLayout() {
  const {
    businessType,
    tenantId,
    setBusinessType,
    setTenantId,
    addToCart,
    searchQuery,
    setSearchQuery,
  } = usePosState();

  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductVariant[]>([]);
  const { toasts, removeToast, error: showErrorToast } = useToast();
  
  // Scan indicator state
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState(false);
  
  // Add New Product Modal state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [missingBarcode, setMissingBarcode] = useState("");

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
        // Product not found: Open "Add New Product" modal (no error shown)
        setMissingBarcode(barcode);
        setShowQuickAdd(true);
        // No error sound, no toast - just silently open the modal
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

  // Fetch tenant info
  const { data: tenantInfo, isLoading: isLoadingTenant } = useQuery({
    queryKey: ["tenant-info"],
    queryFn: getTenantInfo,
    retry: 1,
  });

  // Fetch products
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products", tenantId],
    queryFn: () => getProducts(tenantId!),
    enabled: !!tenantId,
  });

  // Initialize tenant and business type
  useEffect(() => {
    if (tenantInfo) {
      setTenantId(tenantInfo.id);
      setBusinessType(tenantInfo.business_type as any);
      setIsLoading(false);
    }
  }, [tenantInfo, setTenantId, setBusinessType]);

  // Process products into variants
  useEffect(() => {
    if (productsData) {
      setProducts(productsData);
      
      // Flatten products to variants for display
      const variants: ProductVariant[] = [];
      productsData.forEach((product: any) => {
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach((variant: any) => {
            variants.push({
              ...variant,
              product: {
                id: product.id,
                name: product.name,
                tax_rate: product.tax_rate || 0,
              },
            });
          });
        }
      });
      
      setFilteredProducts(variants);
    }
  }, [productsData]);

  // Filter products by search query
  useEffect(() => {
    if (!productsData) return;

    // Build all variants from products
    const allVariants: ProductVariant[] = [];
    productsData.forEach((product: any) => {
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant: any) => {
          allVariants.push({
            ...variant,
            product: {
              id: product.id,
              name: product.name,
              tax_rate: product.tax_rate || 0,
            },
          });
        });
      }
    });

    // Apply search filter
    if (!searchQuery.trim()) {
      setFilteredProducts(allVariants);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allVariants.filter((variant) => {
      const productName = variant.product?.name?.toLowerCase() || "";
      const sku = variant.sku?.toLowerCase() || "";
      const barcode = variant.barcode_aliases?.some((b) =>
        b.toLowerCase().includes(query)
      );
      
      return (
        productName.includes(query) ||
        sku.includes(query) ||
        barcode
      );
    });
    
    setFilteredProducts(filtered);
  }, [searchQuery, productsData]);

  const handleAddToCart = (variant: ProductVariant, quantity: number) => {
    addToCart(variant, quantity);
  };

  const handlePay = () => {
    // TODO: Implement payment flow
    console.log("Pay clicked");
  };

  if (isLoading || isLoadingTenant) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading POS...</p>
        </div>
      </div>
    );
  }

  if (!businessType || !tenantId) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="p-6 max-w-md">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">Configuration Error</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Business type or tenant not configured. Please check your settings.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // For HORECA/CAFE, show table map (to be implemented)
  const isRestaurantMode = businessType === "horeca" || businessType === "cafe";

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Scan Indicator - Visual feedback for scans */}
      <ScanIndicator success={scanSuccess} error={scanError} />
      
      {/* Mobile Cart Bar with Scanner Button - Only on mobile */}
      <MobileCartBar onScan={handleBarcodeScan} />
      
      {/* Search Bar */}
      <div className="border-b border-border p-4 bg-card">
        <div className="relative max-w-2xl flex gap-3 items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            type="text"
            placeholder="Search products by name, SKU, or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg flex-1"
            autoFocus
          />
          
          {/* Mobile Scanner Button - Only on mobile */}
          <div className="md:hidden">
            <MobileScannerButton
              onScan={handleBarcodeScan}
              batchMode={true}
              className="h-12"
            />
          </div>
        </div>
      </div>

      {/* Main Content: 65% Product Grid | 35% Cart Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Product Grid (65%) */}
        <div className="flex-1 overflow-hidden" style={{ width: "65%" }}>
          {isLoadingProducts ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isRestaurantMode ? (
            // TODO: Implement table map view for restaurant mode
            <div className="h-full flex items-center justify-center">
              <Card className="p-6">
                <p className="text-muted-foreground">
                  Table map view for {businessType} mode coming soon...
                </p>
              </Card>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-4">
              {filteredProducts.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <Card className="p-6">
                    <p className="text-muted-foreground text-center">
                      {searchQuery ? "No products found" : "No products available"}
                    </p>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map((variant) => (
                    <ProductCard
                      key={variant.id}
                      variant={variant}
                      businessType={businessType}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Cart Sidebar (35%) */}
        <div className="w-[35%] border-l border-border">
          <CartSidebar onPay={handlePay} />
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-40 space-y-2">
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
    </div>
  );
}

