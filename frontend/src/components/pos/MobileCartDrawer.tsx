"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePosState } from "@/stores/pos-state";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, Trash2, X } from "lucide-react";
import { useCheckout } from "@/hooks/useCheckout";
import { cn } from "@/lib/utils";

interface MobileCartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Mobile Cart Drawer - Bottom sheet for mobile cart
 * Contains cart items and checkout button
 */
export function MobileCartDrawer({ open, onOpenChange }: MobileCartDrawerProps) {
  const {
    cart,
    removeFromCart,
    incrementQuantity,
    decrementQuantity,
    getCartSubtotal,
    getCartTax,
    getCartDiscount,
    getCartTotal,
    clearCart,
  } = usePosState();

  const { handleCheckout, isProcessing, AgeVerificationModal } = useCheckout();

  const subtotal = getCartSubtotal();
  const tax = getCartTax();
  const discount = getCartDiscount();
  const total = getCartTotal();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckoutClick = async () => {
    await handleCheckout();
    if (!isProcessing) {
      onOpenChange(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold">
                Savat ({itemCount})
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-9 w-9"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4">
            <div className="py-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Savat bo'sh
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={`${item.variant_id}-${item.quantity}`}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {item.variant?.product?.name || item.variant?.sku || "Mahsulot"}
                      </h4>
                      {item.variant?.sku && (
                        <p className="text-sm text-gray-500 mt-1">
                          SKU: {item.variant.sku}
                        </p>
                      )}
                      <p className="text-lg font-bold text-gray-900 mt-2">
                        {(item.unit_price * item.quantity).toLocaleString()} so'm
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => decrementQuantity(item.variant_id)}
                        className="h-9 w-9"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-lg font-semibold w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => incrementQuantity(item.variant_id)}
                        className="h-9 w-9"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.variant_id)}
                        className="h-9 w-9 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Totals & Checkout */}
          {cart.length > 0 && (
            <div className="border-t bg-white p-4 space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Jami:</span>
                  <span className="font-semibold">{subtotal.toLocaleString()} so'm</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Chegirma:</span>
                    <span>-{discount.toLocaleString()} so'm</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Soliq:</span>
                    <span>{tax.toLocaleString()} so'm</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>TO'LOV:</span>
                  <span>{total.toLocaleString()} so'm</span>
                </div>
              </div>

              <Button
                onClick={handleCheckoutClick}
                disabled={isProcessing || cart.length === 0}
                className={cn(
                  "w-full h-12 text-lg font-semibold",
                  "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {isProcessing ? "Jarayonda..." : "To'lov"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Age Verification Modal */}
      {AgeVerificationModal}
    </>
  );
}
