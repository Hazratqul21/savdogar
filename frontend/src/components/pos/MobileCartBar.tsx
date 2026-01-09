"use client";

import { useState } from "react";
import { ShoppingCart, ChevronUp } from "lucide-react";
import { usePosState } from "@/stores/pos-state";
import { cn } from "@/lib/utils";
import { MobileCartDrawer } from "./MobileCartDrawer";
import { MobileScannerButton } from "./MobileScannerButton";

interface MobileCartBarProps {
  /**
   * Callback when a barcode is scanned via camera
   */
  onScan?: (barcode: string) => void;
}

/**
 * Mobile Cart Bar - Sticky bottom bar for mobile POS
 * Shows cart summary, scanner button, and opens drawer on click
 * Only visible on mobile (< 768px)
 */
export function MobileCartBar({ onScan }: MobileCartBarProps = {}) {
  const { cart, getCartTotal } = usePosState();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = getCartTotal();

  // Don't show if cart is empty and no scanner callback
  if (itemCount === 0 && !onScan) {
    return null;
  }

  return (
    <>
      {/* Sticky Bottom Bar */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "md:hidden", // Only on mobile
          "bg-gradient-to-t from-blue-600 to-blue-700 shadow-lg",
          "px-3 py-2",
          "flex items-center gap-2",
          "min-h-[60px]" // Thumb-friendly height
        )}
      >
        {/* Scanner Button - Always visible on mobile if callback provided */}
        {onScan && (
          <div className="flex-shrink-0">
            <MobileScannerButton
              onScan={onScan}
              batchMode={true}
              className="h-12 w-12 p-0 rounded-lg"
            />
          </div>
        )}

        {/* Cart Summary Button */}
        {itemCount > 0 && (
          <button
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "flex-1 bg-white/10 hover:bg-white/20 text-white",
              "px-4 py-3 rounded-lg",
              "flex items-center justify-between",
              "transition-colors",
              "backdrop-blur-sm"
            )}
            aria-label="Open cart"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">
                  {itemCount} {itemCount === 1 ? "mahsulot" : "mahsulot"}
                </div>
                <div className="text-lg font-bold">
                  {total.toLocaleString()} so'm
                </div>
              </div>
            </div>
            <ChevronUp className="h-6 w-6 flex-shrink-0" />
          </button>
        )}

        {/* Scanner Button (full width if cart is empty) */}
        {itemCount === 0 && onScan && (
          <div className="flex-1">
            <MobileScannerButton
              onScan={onScan}
              batchMode={true}
              className="w-full h-12"
            />
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      <MobileCartDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
