"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, CreditCard, Banknote, Smartphone, QrCode, User, Check,
  Printer, Download, Share2, Receipt, ChevronRight, Loader2,
  CheckCircle2, AlertCircle, Clock, Hash, Store, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePosState, type PaymentMethod, type CartItem } from "@/stores/pos-state";
import { checkout, type CheckoutRequest } from "@/lib/api-pos";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (sale: any) => void;
}

type CheckoutStep = "payment" | "processing" | "success" | "error";

export function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const {
    cart,
    selectedCustomer,
    paymentMethod,
    setPaymentMethod,
    getCartTotal,
    getCartSubtotal,
    getCartTax,
    getCartDiscount,
    getServiceCharge,
    businessType,
    clearCart,
  } = usePosState();

  const [step, setStep] = useState<CheckoutStep>("payment");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(paymentMethod);
  const [cashReceived, setCashReceived] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saleResult, setSaleResult] = useState<any>(null);

  const total = getCartTotal();
  const subtotal = getCartSubtotal();
  const tax = getCartTax();
  const discount = getCartDiscount();
  const serviceCharge = getServiceCharge();
  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const change = cashReceivedNum - total;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("payment");
      setSelectedPayment(paymentMethod);
      setCashReceived("");
      setNotes("");
      setError(null);
      setSaleResult(null);
    }
  }, [isOpen, paymentMethod]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("uz-UZ") + " so'm";
  };

  const handleCheckout = async () => {
    setStep("processing");
    setIsProcessing(true);
    setError(null);

    try {
      const request: CheckoutRequest = {
        items: cart.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
          discount_percent: item.discount_percent,
        })),
        customer_id: selectedCustomer?.id,
        payment_method: selectedPayment,
        notes: notes || undefined,
        metadata: {
          cash_received: selectedPayment === "cash" ? cashReceivedNum : undefined,
          change: selectedPayment === "cash" ? change : undefined,
        },
      };

      const result = await checkout(request);
      setSaleResult(result);
      setStep("success");

      // Clear cart after successful checkout
      setTimeout(() => {
        clearCart();
        onSuccess?.(result);
      }, 100);
    } catch (err: any) {
      setError(err.message || "Checkout xatosi yuz berdi");
      setStep("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewSale = () => {
    clearCart();
    onClose();
  };

  const paymentMethods: { id: PaymentMethod; label: string; icon: any; color: string }[] = [
    { id: "cash", label: "Naqd pul", icon: Banknote, color: "emerald" },
    { id: "card", label: "Karta", icon: CreditCard, color: "blue" },
    { id: "transfer", label: "O'tkazma", icon: Smartphone, color: "purple" },
    { id: "click", label: "Click", icon: Smartphone, color: "cyan" },
    { id: "payme", label: "Payme", icon: QrCode, color: "sky" },
    { id: "debt", label: "Nasiya", icon: Clock, color: "orange" },
  ];

  const quickCashAmounts = [
    total,
    Math.ceil(total / 1000) * 1000,
    Math.ceil(total / 5000) * 5000,
    Math.ceil(total / 10000) * 10000,
    50000,
    100000,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v >= total).slice(0, 4);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && step !== "processing" && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                step === "success" ? "bg-emerald-500/20" : "bg-blue-500/20"
              )}>
                {step === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : step === "error" ? (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <Receipt className="w-5 h-5 text-blue-400" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {step === "success" ? "Sotuv yakunlandi!" : 
                   step === "error" ? "Xatolik" :
                   step === "processing" ? "Jarayonda..." : "To'lov"}
                </h2>
                <p className="text-sm text-slate-500">
                  {step === "success" && saleResult?.receipt_number
                    ? `Chek: ${saleResult.receipt_number}`
                    : `${cart.length} ta mahsulot`}
                </p>
              </div>
            </div>
            {step !== "processing" && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Payment Selection Step */}
              {step === "payment" && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Order Summary */}
                  <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Jami ({cart.length} ta)</span>
                      <span className="text-slate-300">{formatCurrency(subtotal)}</span>
                    </div>
                    {tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Soliq</span>
                        <span className="text-slate-300">{formatCurrency(tax)}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Chegirma</span>
                        <span className="text-emerald-400">-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    {serviceCharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Xizmat haqi (10%)</span>
                        <span className="text-slate-300">{formatCurrency(serviceCharge)}</span>
                      </div>
                    )}
                    <div className="h-px bg-slate-700" />
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-white">To'lov summasi</span>
                      <span className="text-2xl font-bold text-white">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  {/* Customer */}
                  {selectedCustomer && (
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{selectedCustomer.name}</p>
                        <p className="text-sm text-slate-500">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                  )}

                  {/* Payment Methods */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-3">To'lov usuli</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        const isSelected = selectedPayment === method.id;
                        const colorMap: Record<string, string> = {
                          emerald: isSelected ? "bg-emerald-500/30 border-emerald-500 text-emerald-400" : "bg-emerald-500/10 border-transparent text-emerald-400/70",
                          blue: isSelected ? "bg-blue-500/30 border-blue-500 text-blue-400" : "bg-blue-500/10 border-transparent text-blue-400/70",
                          purple: isSelected ? "bg-purple-500/30 border-purple-500 text-purple-400" : "bg-purple-500/10 border-transparent text-purple-400/70",
                          cyan: isSelected ? "bg-cyan-500/30 border-cyan-500 text-cyan-400" : "bg-cyan-500/10 border-transparent text-cyan-400/70",
                          sky: isSelected ? "bg-sky-500/30 border-sky-500 text-sky-400" : "bg-sky-500/10 border-transparent text-sky-400/70",
                          orange: isSelected ? "bg-orange-500/30 border-orange-500 text-orange-400" : "bg-orange-500/10 border-transparent text-orange-400/70",
                        };

                        return (
                          <button
                            key={method.id}
                            onClick={() => setSelectedPayment(method.id)}
                            className={cn(
                              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                              colorMap[method.color],
                              isSelected && "ring-2 ring-offset-2 ring-offset-slate-900"
                            )}
                          >
                            <Icon className="w-6 h-6" />
                            <span className="text-sm font-medium">{method.label}</span>
                            {isSelected && (
                              <Check className="w-4 h-4 absolute top-2 right-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cash Input */}
                  {selectedPayment === "cash" && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-slate-400">Qabul qilingan pul</h3>
                      <input
                        type="number"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder="Summani kiriting..."
                        className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-white text-lg font-mono focus:outline-none focus:border-blue-500"
                      />
                      <div className="flex flex-wrap gap-2">
                        {quickCashAmounts.map((amount) => (
                          <button
                            key={amount}
                            onClick={() => setCashReceived(amount.toString())}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                          >
                            {formatCurrency(amount)}
                          </button>
                        ))}
                      </div>
                      {cashReceivedNum >= total && (
                        <div className="flex justify-between items-center p-3 bg-emerald-500/20 rounded-xl">
                          <span className="text-emerald-400 font-medium">Qaytim</span>
                          <span className="text-xl font-bold text-emerald-400">
                            {formatCurrency(change)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Izoh (ixtiyoriy)</h3>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Qo'shimcha izoh..."
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={selectedPayment === "cash" && cashReceivedNum < total}
                    className={cn(
                      "w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all",
                      selectedPayment === "cash" && cashReceivedNum < total
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30"
                    )}
                  >
                    <Receipt className="w-5 h-5" />
                    <span>SOTUVNI YAKUNLASH</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {/* Processing Step */}
              {step === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
                  <p className="text-xl font-medium text-white mb-2">Sotuv qayd etilmoqda...</p>
                  <p className="text-slate-500">Iltimos, kutib turing</p>
                </motion.div>
              )}

              {/* Success Step */}
              {step === "success" && saleResult && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Success Animation */}
                  <div className="flex flex-col items-center py-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4"
                    >
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-1">Muvaffaqiyatli!</h3>
                    <p className="text-slate-400">Sotuv yakunlandi</p>
                  </div>

                  {/* Receipt Preview */}
                  <div className="bg-white text-black rounded-xl p-6 font-mono text-sm">
                    {/* Header */}
                    <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
                      <Store className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                      <h4 className="text-lg font-bold">SAVDOGAR POS</h4>
                      <p className="text-gray-500 text-xs">Chek raqami: {saleResult.receipt_number}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(saleResult.created_at).toLocaleString("uz-UZ")}
                      </p>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 border-b border-dashed border-gray-300 pb-4 mb-4">
                      {cart.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <div className="flex-1">
                            <p className="font-medium truncate pr-2">
                              {item.variant.product?.name || item.variant.sku}
                            </p>
                            <p className="text-gray-500">
                              {item.quantity} x {formatCurrency(item.unit_price)}
                            </p>
                          </div>
                          <span className="font-medium">{formatCurrency(item.total)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Jami:</span>
                        <span>{formatCurrency(saleResult.subtotal)}</span>
                      </div>
                      {saleResult.tax_amount > 0 && (
                        <div className="flex justify-between text-gray-500">
                          <span>Soliq:</span>
                          <span>{formatCurrency(saleResult.tax_amount)}</span>
                        </div>
                      )}
                      {saleResult.discount_amount > 0 && (
                        <div className="flex justify-between text-gray-500">
                          <span>Chegirma:</span>
                          <span>-{formatCurrency(saleResult.discount_amount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                        <span>TO'LOV:</span>
                        <span>{formatCurrency(saleResult.total_amount)}</span>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-300 text-center text-xs text-gray-500">
                      <p>To'lov usuli: {selectedPayment.toUpperCase()}</p>
                      {selectedPayment === "cash" && cashReceivedNum > 0 && (
                        <>
                          <p>Qabul qilindi: {formatCurrency(cashReceivedNum)}</p>
                          <p>Qaytim: {formatCurrency(change)}</p>
                        </>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-300 text-center">
                      <p className="text-xs text-gray-500">Xaridingiz uchun rahmat!</p>
                      <div className="mt-2 flex justify-center">
                        <QrCode className="w-16 h-16 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handlePrint}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                    >
                      <Printer className="w-5 h-5" />
                      Chop etish
                    </button>
                    <button
                      onClick={handleNewSale}
                      className="flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
                    >
                      <Receipt className="w-5 h-5" />
                      Yangi sotuv
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Error Step */}
              {step === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-12"
                >
                  <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Xatolik yuz berdi</h3>
                  <p className="text-slate-400 text-center mb-6 max-w-sm">{error}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep("payment")}
                      className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                    >
                      Qayta urinish
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-medium transition-colors"
                    >
                      Yopish
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
