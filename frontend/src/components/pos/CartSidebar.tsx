"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, Plus, Minus, Trash2, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePosState, CartItem } from "@/stores/pos-state";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CartSidebarProps {
  className?: string;
  onPay?: () => void;
}

export function CartSidebar({ className, onPay }: CartSidebarProps) {
  const {
    cart,
    removeFromCart,
    incrementQuantity,
    decrementQuantity,
    getCartSubtotal,
    getCartTax,
    getCartDiscount,
    getCartTotal,
    getServiceCharge,
    businessType,
    clearCart,
  } = usePosState();

  const subtotal = getCartSubtotal();
  const tax = getCartTax();
  const discount = getCartDiscount();
  const serviceCharge = getServiceCharge();
  const total = getCartTotal();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePay = () => {
    if (onPay) {
      onPay();
    } else {
      // Default pay handler - you can extend this
      console.log("Pay clicked", { cart, total });
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-white border-l border-gray-200", className)}>
      {/* Header */}
      <CardHeader className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <ShoppingCart className="h-5 w-5" />
            Savat ({itemCount})
          </CardTitle>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-gray-600 hover:text-red-600"
            >
              Tozalash
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Cart Items */}
      <ScrollArea className="flex-1 px-4 bg-white">
        <AnimatePresence mode="popLayout">
          {cart.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center py-12"
            >
              <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Savat bo'sh</p>
            </motion.div>
          ) : (
            <div className="space-y-3 py-4">
              {cart.map((item) => (
                <CartItemCard
                  key={item.variant_id}
                  item={item}
                  onRemove={() => removeFromCart(item.variant_id)}
                  onIncrement={() => incrementQuantity(item.variant_id)}
                  onDecrement={() => decrementQuantity(item.variant_id)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>

      {/* Footer with Totals and Pay Button */}
      <div className="border-t border-gray-200 p-4 space-y-4 bg-white">
        {/* Totals */}
        <Card className="bg-gray-50 border border-gray-200">
          <CardContent className="pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Jami:</span>
              <span className="font-medium text-gray-900">{subtotal.toLocaleString()} so'm</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Chegirma</span>
                <span>-{discount.toLocaleString()} so'm</span>
              </div>
            )}

            {tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Soliq</span>
                <span className="text-gray-900">{tax.toLocaleString()} so'm</span>
              </div>
            )}

            {serviceCharge > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Xizmat haqi (10%)</span>
                <span className="text-gray-900">{serviceCharge.toLocaleString()} so'm</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span className="text-gray-900">Jami:</span>
              <span className="text-gray-900">{total.toLocaleString()} so'm</span>
            </div>
          </CardContent>
        </Card>

        {/* Pay Button */}
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
          onClick={handlePay}
          disabled={cart.length === 0}
        >
          <CreditCard className="h-5 w-5 mr-2" />
          To'lov {total.toLocaleString()} so'm
        </Button>
      </div>
    </div>
  );
}

interface CartItemCardProps {
  item: CartItem;
  onRemove: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

function CartItemCard({
  item,
  onRemove,
  onIncrement,
  onDecrement,
}: CartItemCardProps) {
  const productName = item.variant.product?.name || item.variant.sku;
  const price = item.final_price || item.unit_price;
  const total = item.total;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden bg-white border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">{productName}</h4>
              <p className="text-xs text-gray-500">
                {price.toLocaleString()} so'm
              </p>
            </div>

            {/* Remove Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-gray-500 hover:text-red-600"
              onClick={onRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-gray-300 hover:bg-gray-50"
                onClick={onDecrement}
              >
                <Minus className="h-3 w-3 text-gray-600" />
              </Button>
              <span className="font-semibold w-8 text-center text-gray-900">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-gray-300 hover:bg-gray-50"
                onClick={onIncrement}
              >
                <Plus className="h-3 w-3 text-gray-600" />
              </Button>
            </div>

            <span className="font-bold text-gray-900">
              {total.toLocaleString()} so'm
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}





