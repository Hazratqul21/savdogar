"use client";

import { useState, useEffect } from "react";
import {
  X, CreditCard, Banknote, Smartphone, QrCode, User, Check,
  Printer, Receipt, ChevronRight, Loader2,
  CheckCircle2, AlertCircle, Clock, Store
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePosState, type PaymentMethod } from "@/stores/pos-state";
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
    getCartTotal,
    getCartSubtotal,
    getCartTax,
    getCartDiscount,
    getServiceCharge,
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && step !== "processing" && onClose()}
    >
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
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
          {/* Payment Selection Step */}
          {step === "payment" && (
            <div className="space-y-6">
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
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                          isSelected 
                            ? "bg-blue-500/20 border-blue-500 text-blue-400" 
                            : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600"
                        )}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-sm font-medium">{method.label}</span>
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
            </div>
          )}

          {/* Processing Step */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
              <p className="text-xl font-medium text-white mb-2">Sotuv qayd etilmoqda...</p>
              <p className="text-slate-500">Iltimos, kutib turing</p>
            </div>
          )}

          {/* Success Step */}
          {step === "success" && saleResult && (
            <div className="space-y-6">
              {/* Success Animation */}
              <div className="flex flex-col items-center py-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">Muvaffaqiyatli!</h3>
                <p className="text-slate-400">Sotuv yakunlandi</p>
              </div>

              {/* Receipt Preview */}
              <div className="bg-white text-black rounded-xl p-6 font-mono text-sm">
                <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
                  <Store className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  <h4 className="text-lg font-bold">SAVDOGAR POS</h4>
                  <p className="text-gray-500 text-xs">Chek raqami: {saleResult.receipt_number}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(saleResult.created_at).toLocaleString("uz-UZ")}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                    <span>TO'LOV:</span>
                    <span>{formatCurrency(saleResult.total_amount)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-dashed border-gray-300 text-center text-xs text-gray-500">
                  <p>To'lov usuli: {selectedPayment.toUpperCase()}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-dashed border-gray-300 text-center">
                  <p className="text-xs text-gray-500">Xaridingiz uchun rahmat!</p>
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
            </div>
          )}

          {/* Error Step */}
          {step === "error" && (
            <div className="flex flex-col items-center py-12">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
