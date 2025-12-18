"use client";

import { useState, useEffect } from 'react';
import { usePosState, type ProductVariant, type Customer } from '@/stores/pos-state';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, getCustomers, checkout } from '@/lib/api-pos';
import { Search, Plus, Minus, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';
import { useSmartScanner } from '@/hooks/useSmartScanner';

export function TraderView() {
  const {
    cart,
    selectedCustomer,
    setCustomer,
    searchQuery,
    setSearchQuery,
    addToCart,
    removeFromCart,
    updateWholesalePrice,
    updatePackQuantity,
    getCartTotal,
    getCartSubtotal,
    getDiscountPercent,
    tenantId,
    paymentMethod,
    setPaymentMethod,
  } = usePosState();

  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [lastScannedItem, setLastScannedItem] = useState<{ name: string; isPack: boolean } | null>(null);
  const queryClient = useQueryClient();

  // Smart scanner with pack detection
  useSmartScanner({
    onScan: (variant, isPack) => {
      setLastScannedItem({
        name: variant.product?.name || variant.sku,
        isPack,
      });
      // Clear notification after 2 seconds
      setTimeout(() => setLastScannedItem(null), 2000);
    },
    onError: (barcode) => {
      console.warn('Product not found:', barcode);
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', tenantId],
    queryFn: () => getProducts(tenantId!),
    enabled: !!tenantId,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', tenantId],
    queryFn: () => getCustomers(tenantId!),
    enabled: !!tenantId,
  });

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.variants?.some((v: any) => v.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCustomers = customers.filter((c: Customer) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handlePriceEdit = (variantId: number, currentPrice: number) => {
    setEditingPrice(variantId);
    setTempPrice(currentPrice.toString());
  };

  const handlePriceSave = (variantId: number) => {
    const price = parseFloat(tempPrice);
    if (!isNaN(price) && price > 0) {
      updateWholesalePrice(variantId, price);
    }
    setEditingPrice(null);
    setTempPrice('');
  };

  const handlePriceCancel = () => {
    setEditingPrice(null);
    setTempPrice('');
  };

  const checkoutMutation = useMutation({
    mutationFn: checkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['customers', tenantId] });
      // Clear cart after successful checkout
      usePosState.getState().clearCart();
    },
  });

  const handleCheckout = async () => {
    if (!selectedCustomer) {
      alert('Mijoz tanlash majburiy!');
      return;
    }

    if (selectedCustomer.balance < 0 && Math.abs(selectedCustomer.balance) >= selectedCustomer.max_debt_allowed) {
      alert(`Qarz limiti oshib ketdi! Maksimal: ${selectedCustomer.max_debt_allowed.toLocaleString()} so'm`);
      return;
    }

    const checkoutData = {
      items: cart.map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        discount_percent: item.discount_percent,
      })),
      customer_id: selectedCustomer.id,
      payment_method: paymentMethod,
      debt_amount: paymentMethod === 'debt' ? getCartTotal() : undefined,
    };

    try {
      await checkoutMutation.mutateAsync(checkoutData);
      alert('Sotuv muvaffaqiyatli yakunlandi!');
    } catch (error: any) {
      alert(`Xatolik: ${error.message}`);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Scan Notification */}
      {lastScannedItem && (
        <div
          className={`p-4 rounded-lg border-2 ${
            lastScannedItem.isPack
              ? 'bg-blue-900/50 border-blue-500'
              : 'bg-green-900/50 border-green-500'
          }`}
        >
          <p className="text-white font-semibold">
            {lastScannedItem.isPack ? '📦 Paket qo\'shildi' : '✅ Mahsulot qo\'shildi'}:{' '}
            {lastScannedItem.name}
          </p>
        </div>
      )}

      {/* Header - Customer Selection (MANDATORY) */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Mijoz tanlash <span className="text-red-400">*</span>
            </label>
            {selectedCustomer ? (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-white font-semibold">{selectedCustomer.name}</p>
                  <p className="text-sm text-slate-400">{selectedCustomer.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Balans:</p>
                  <p
                    className={`text-lg font-bold ${
                      selectedCustomer.balance < 0 ? 'text-red-400' : 'text-green-400'
                    }`}
                  >
                    {selectedCustomer.balance.toLocaleString()} so'm
                  </p>
                  {selectedCustomer.balance < 0 && (
                    <p className="text-xs text-red-400">
                      Qarzi: {Math.abs(selectedCustomer.balance).toLocaleString()} so'm
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  O'zgartirish
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomerModal(true)}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <AlertCircle size={20} />
                Mijoz tanlash majburiy!
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
        {/* Product Search */}
        <div className="bg-slate-900 rounded-xl p-4 overflow-auto">
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mahsulot qidirish..."
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            {filteredProducts.map((product: any) =>
              product.variants?.map((variant: ProductVariant) => (
                <div
                  key={variant.id}
                  onClick={() => addToCart(variant, 1)}
                  className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer border border-slate-700"
                >
                  <p className="font-medium text-white text-sm">{product.name}</p>
                  <p className="text-xs text-slate-400">{variant.sku}</p>
                  <p className="text-sm text-slate-300 mt-1">
                    {variant.price.toLocaleString()} so'm
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cart - Excel-like Data Table */}
        <div className="col-span-2 bg-slate-900 rounded-xl p-4 overflow-auto">
          <h3 className="text-lg font-semibold text-white mb-4">Savat</h3>
          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>Savat bo'sh</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-2 text-slate-300 font-semibold">Mahsulot</th>
                    <th className="text-right py-3 px-2 text-slate-300 font-semibold">
                      Birlik narxi
                    </th>
                    <th className="text-right py-3 px-2 text-slate-300 font-semibold">
                      Paket miqdori
                    </th>
                    <th className="text-right py-3 px-2 text-slate-300 font-semibold">
                      Jami miqdor
                    </th>
                    <th className="text-right py-3 px-2 text-slate-300 font-semibold">
                      Yakuniy narx
                    </th>
                    <th className="text-right py-3 px-2 text-slate-300 font-semibold">Chegirma</th>
                    <th className="text-right py-3 px-2 text-slate-300 font-semibold">Jami</th>
                    <th className="text-center py-3 px-2 text-slate-300 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => {
                    const discount = getDiscountPercent(item.variant_id);
                    const finalPrice = item.final_price ?? item.unit_price;

                    return (
                      <tr
                        key={item.variant_id}
                        className="border-b border-slate-800 hover:bg-slate-800/50"
                      >
                        <td className="py-3 px-2">
                          <div>
                            <p className="text-white font-medium">
                              {item.variant.product?.name || item.variant.sku}
                            </p>
                            <p className="text-xs text-slate-400">{item.variant.sku}</p>
                          </div>
                        </td>
                        <td className="text-right py-3 px-2 text-slate-300">
                          {item.original_price?.toLocaleString()} so'm
                        </td>
                        <td className="text-right py-3 px-2">
                          <input
                            type="number"
                            min="1"
                            value={item.pack_qty || 1}
                            onChange={(e) =>
                              updatePackQuantity(item.variant_id, parseInt(e.target.value) || 1)
                            }
                            className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-right"
                          />
                        </td>
                        <td className="text-right py-3 px-2 text-white font-medium">
                          {item.quantity}
                        </td>
                        <td className="text-right py-3 px-2">
                          {editingPrice === item.variant_id ? (
                            <div className="flex items-center gap-2 justify-end">
                              <input
                                type="number"
                                value={tempPrice}
                                onChange={(e) => setTempPrice(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handlePriceSave(item.variant_id);
                                  if (e.key === 'Escape') handlePriceCancel();
                                }}
                                className="w-24 px-2 py-1 bg-slate-800 border border-blue-500 rounded text-white text-right"
                                autoFocus
                              />
                              <button
                                onClick={() => handlePriceSave(item.variant_id)}
                                className="text-green-400 hover:text-green-300"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={handlePriceCancel}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-white font-semibold">
                                {finalPrice.toLocaleString()} so'm
                              </span>
                              <button
                                onClick={() => handlePriceEdit(item.variant_id, finalPrice)}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <Edit2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="text-right py-3 px-2">
                          <span
                            className={`font-semibold ${
                              discount > 0 ? 'text-green-400' : 'text-slate-400'
                            }`}
                          >
                            {discount > 0 ? `-${discount.toFixed(1)}%` : '0%'}
                          </span>
                        </td>
                        <td className="text-right py-3 px-2 text-white font-bold">
                          {item.total.toLocaleString()} so'm
                        </td>
                        <td className="text-center py-3 px-2">
                          <button
                            onClick={() => removeFromCart(item.variant_id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals & Payment */}
          {cart.length > 0 && (
            <div className="mt-6 border-t border-slate-700 pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400">Jami:</span>
                <span className="text-white text-2xl font-bold">
                  {getCartTotal().toLocaleString()} so'm
                </span>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  To'lov usuli
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="cash">Naqd</option>
                  <option value="card">Karta</option>
                  <option value="debt">Qarz</option>
                  <option value="transfer">O'tkazma</option>
                </select>
              </div>
              <button
                onClick={handleCheckout}
                disabled={!selectedCustomer || checkoutMutation.isPending}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-colors"
              >
                {checkoutMutation.isPending ? 'Jarayonda...' : 'Sotuvni yakunlash'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowCustomerModal(false)}
        >
          <div
            className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full mx-4 border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">Mijoz tanlash</h3>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Mijoz qidirish..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 mb-4"
              autoFocus
            />
            <div className="max-h-96 overflow-auto space-y-2">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => {
                    setCustomer(customer);
                    setShowCustomerModal(false);
                  }}
                  className="p-4 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer border border-slate-700"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-white">{customer.name}</p>
                      <p className="text-sm text-slate-400">{customer.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Balans:</p>
                      <p
                        className={`font-bold ${
                          customer.balance < 0 ? 'text-red-400' : 'text-green-400'
                        }`}
                      >
                        {customer.balance.toLocaleString()} so'm
                      </p>
                      {customer.balance < 0 && (
                        <p className="text-xs text-red-400">
                          Qarz: {Math.abs(customer.balance).toLocaleString()} so'm
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}








