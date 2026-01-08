"use client";

import { useState } from "react";
import { ShoppingCart, ChevronUp } from "lucide-react";
import { usePosState } from "@/stores/pos-state";
import { cn } from "@/lib/utils";
import { MobileCartDrawer } from "./MobileCartDrawer";

/**
 * Mobile Cart Bar - Sticky bottom bar for mobile POS
 * Shows cart summary and opens drawer on click
 * Only visible on mobile (< 768px)
 */
export function MobileCartBar() {
  const { cart, getCartTotal } = usePosState();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = getCartTotal();

  if (itemCount === 0) {
    return null; // Don't show if cart is empty
  }

  return (
    <>
      {/* Sticky Bottom Bar */}
      <button
        onClick={() => setDrawerOpen(true)}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "md:hidden", // Only on mobile
          "bg-blue-600 hover:bg-blue-700 text-white",
          "px-4 py-4 shadow-lg",
          "flex items-center justify-between",
          "transition-colors",
          "min-h-[60px]" // Thumb-friendly height
        )}
        aria-label="Open cart"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart className="h-6 w-6" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
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
        <ChevronUp className="h-6 w-6" />
      </button>

      {/* Cart Drawer */}
      <MobileCartDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
