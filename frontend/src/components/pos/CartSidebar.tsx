"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingCart, X, Plus, Minus, Trash2, CreditCard, Banknote, 
  Smartphone, ChevronRight, Tag, Percent, User, Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePosState, CartItem } from "@/stores/pos-state";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      console.log("Pay clicked", { cart, total });
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString() + " so'm";
  };

  return (
    <div className={cn("flex flex-col h-full bg-slate-900", className)}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-lg">Savat</h2>
              <p className="text-xs text-slate-500">{itemCount} ta mahsulot</p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <ScrollArea className="flex-1">
        <AnimatePresence mode="popLayout">
          {cart.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center py-16 px-6"
            >
              <div className="w-24 h-24 rounded-3xl bg-slate-800/50 flex items-center justify-center mb-6">
                <ShoppingCart className="w-12 h-12 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium text-lg">Savat bo'sh</p>
              <p className="text-slate-600 text-sm mt-1">Mahsulotni skanerlang yoki qidiring</p>
            </motion.div>
          ) : (
            <div className="p-4 space-y-3">
              {cart.map((item, index) => (
                <CartItemCard
                  key={item.variant_id}
                  item={item}
                  index={index}
                  onRemove={() => removeFromCart(item.variant_id)}
                  onIncrement={() => incrementQuantity(item.variant_id)}
                  onDecrement={() => decrementQuantity(item.variant_id)}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>

      {/* Footer */}
      {cart.length > 0 && (
        <div className="border-t border-slate-800 p-5 space-y-4">
          {/* Summary */}
          <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Jami</span>
              <span className="text-slate-300 font-medium">{formatCurrency(subtotal)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5" />
                  Chegirma
                </span>
                <span className="text-emerald-400 font-medium">-{formatCurrency(discount)}</span>
              </div>
            )}

            {tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Soliq</span>
                <span className="text-slate-300">{formatCurrency(tax)}</span>
              </div>
            )}

            {serviceCharge > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Xizmat haqi (10%)</span>
                <span className="text-slate-300">{formatCurrency(serviceCharge)}</span>
              </div>
            )}

            <div className="h-px bg-slate-700" />

            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-white">To'lov</span>
              <span className="text-2xl font-bold text-white">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment Method Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <PaymentMethodButton
              icon={<Banknote className="w-5 h-5" />}
              label="Naqd"
              color="emerald"
              onClick={handlePay}
            />
            <PaymentMethodButton
              icon={<CreditCard className="w-5 h-5" />}
              label="Karta"
              color="blue"
              onClick={handlePay}
            />
            <PaymentMethodButton
              icon={<Smartphone className="w-5 h-5" />}
              label="Click"
              color="purple"
              onClick={handlePay}
            />
          </div>

          {/* Main Pay Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handlePay}
            disabled={cart.length === 0}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-lg",
              "flex items-center justify-center gap-3",
              "bg-gradient-to-r from-blue-500 to-blue-600",
              "hover:from-blue-600 hover:to-blue-700",
              "text-white shadow-lg shadow-blue-500/30",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            )}
          >
            <Receipt className="w-5 h-5" />
            <span>TO'LOV QILISH</span>
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      )}
    </div>
  );
}

interface CartItemCardProps {
  item: CartItem;
  index: number;
  onRemove: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  formatCurrency: (value: number) => string;
}

function CartItemCard({
  item,
  index,
  onRemove,
  onIncrement,
  onDecrement,
  formatCurrency,
}: CartItemCardProps) {
  const productName = item.variant.product?.name || item.variant.sku;
  const price = item.final_price || item.unit_price;
  const total = item.total;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <h4 className="font-semibold text-white text-sm line-clamp-2 leading-snug">
            {productName}
          </h4>
          <p className="text-xs text-slate-500 mt-1 font-mono">{item.variant.sku}</p>
        </div>
        <button
          onClick={onRemove}
          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between">
        {/* Quantity Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onDecrement}
            className="w-9 h-9 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center transition-colors active:scale-95"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="w-12 h-9 flex items-center justify-center">
            <span className="text-white font-bold tabular-nums">{item.quantity}</span>
          </div>
          <button
            onClick={onIncrement}
            className="w-9 h-9 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Price */}
        <div className="text-right">
          <p className="text-xs text-slate-500">{formatCurrency(price)}</p>
          <p className="font-bold text-white text-lg">{formatCurrency(total)}</p>
        </div>
      </div>
    </motion.div>
  );
}

interface PaymentMethodButtonProps {
  icon: React.ReactNode;
  label: string;
  color: 'emerald' | 'blue' | 'purple' | 'orange';
  onClick?: () => void;
}

function PaymentMethodButton({ icon, label, color, onClick }: PaymentMethodButtonProps) {
  const colorClasses = {
    emerald: "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400",
    blue: "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400",
    purple: "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400",
    orange: "bg-orange-500/20 hover:bg-orange-500/30 text-orange-400",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all active:scale-95",
        colorClasses[color]
      )}
    >
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}
