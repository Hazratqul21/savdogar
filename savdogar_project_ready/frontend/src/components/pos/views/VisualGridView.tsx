"use client";

import { useState } from 'react';
import { usePosState, type ProductVariant } from '@/stores/pos-state';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/lib/api-pos';
import { Plus, Minus, Trash2, ShoppingCart, Utensils } from 'lucide-react';

interface Modifier {
  id: string;
  name: string;
  options: Array<{ id: string; name: string; price: number }>;
}

interface ModifiersModalProps {
  variant: ProductVariant;
  onAdd: (variant: ProductVariant, modifiers: Record<string, string>) => void;
  onClose: () => void;
}

function ModifiersModal({ variant, onAdd, onClose }: ModifiersModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string>>({});

  // Mock modifiers - in real app, fetch from API
  const modifiers: Modifier[] = [
    {
      id: 'sugar',
      name: 'Shakar',
      options: [
        { id: 'none', name: 'Shakarsiz', price: 0 },
        { id: 'low', name: 'Kam', price: 0 },
        { id: 'medium', name: "O'rtacha", price: 0 },
        { id: 'high', name: 'Ko\'p', price: 0 },
      ],
    },
    {
      id: 'ice',
      name: 'Muz',
      options: [
        { id: 'none', name: 'Muzsiz', price: 0 },
        { id: 'normal', name: 'Oddiy', price: 0 },
        { id: 'extra', name: 'Qo\'shimcha', price: 0 },
      ],
    },
  ];

  const handleAdd = () => {
    onAdd(variant, selectedModifiers);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-slate-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white mb-4">{variant.product?.name}</h3>

        <div className="space-y-4 mb-6">
          {modifiers.map((modifier) => (
            <div key={modifier.id}>
              <p className="text-white font-medium mb-2">{modifier.name}</p>
              <div className="flex flex-wrap gap-2">
                {modifier.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() =>
                      setSelectedModifiers((prev) => ({ ...prev, [modifier.id]: option.id }))
                    }
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedModifiers[modifier.id] === option.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Qo'shish
          </button>
        </div>
      </div>
    </div>
  );
}

export function VisualGridView() {
  const {
    cart,
    selectedTable,
    setSelectedTable,
    addToCart,
    removeFromCart,
    incrementQuantity,
    decrementQuantity,
    getCartTotal,
    tenantId,
  } = usePosState();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ['products', tenantId],
    queryFn: () => getProducts(tenantId!),
    enabled: !!tenantId,
  });

  const handleProductPress = (variant: ProductVariant, isLongPress: boolean) => {
    if (isLongPress) {
      // Show details/ingredients
      alert(`Tarkibi: ${JSON.stringify(variant.attributes)}`);
    } else {
      // Open modifiers modal
      setSelectedVariant(variant);
    }
  };

  const handleAddWithModifiers = (variant: ProductVariant, modifiers: Record<string, string>) => {
    addToCart(variant, 1);
    setSelectedVariant(null);
  };

  // Mock tables
  const tables = Array.from({ length: 12 }, (_, i) => `Stol ${i + 1}`);

  return (
    <div className="h-full flex gap-4">
      {/* Main Product Grid - Large Cards */}
      <div className="flex-1 bg-slate-900 rounded-xl p-6 overflow-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Mahsulotlar</h2>
        <div className="grid grid-cols-3 gap-4">
          {products.map((product: any) =>
            product.variants?.map((variant: ProductVariant) => (
              <div
                key={variant.id}
                onTouchStart={() => {
                  const timer = setTimeout(() => {
                    handleProductPress(variant, true);
                  }, 500);
                  setLongPressTimer(timer);
                }}
                onTouchEnd={() => {
                  if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    setLongPressTimer(null);
                  }
                }}
                onClick={() => handleProductPress(variant, false)}
                className="bg-slate-800 rounded-2xl p-6 cursor-pointer hover:bg-slate-700 transition-all border-2 border-slate-700 hover:border-blue-500"
              >
                {/* Product Image Placeholder */}
                <div className="w-full h-32 bg-slate-700 rounded-xl mb-4 flex items-center justify-center">
                  <Utensils className="text-slate-400" size={48} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{product.name}</h3>
                <p className="text-2xl font-bold text-blue-400 mb-2">
                  {variant.price.toLocaleString()} so'm
                </p>
                {variant.stock_quantity > 0 ? (
                  <p className="text-sm text-green-400">Mavjud</p>
                ) : (
                  <p className="text-sm text-red-400">Qolmagan</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sidebar - Table Management & Cart */}
      <div className="w-80 bg-slate-900 rounded-xl p-6 flex flex-col">
        {/* Table Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Utensils size={20} />
            Stol tanlash
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {tables.map((table) => (
              <button
                key={table}
                onClick={() => setSelectedTable(table)}
                className={`py-2 px-3 rounded-lg font-medium transition-colors ${
                  selectedTable === table
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {table}
              </button>
            ))}
          </div>
          {selectedTable && (
            <p className="text-sm text-slate-400 mt-2">Tanlangan: {selectedTable}</p>
          )}
        </div>

        {/* Cart */}
        <div className="flex-1 overflow-auto">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ShoppingCart size={20} />
            Savat
          </h3>
          <div className="space-y-3">
            {cart.map((item) => (
              <div
                key={item.variant_id}
                className="bg-slate-800 rounded-xl p-4 border border-slate-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-white">{item.variant.product?.name}</p>
                    <p className="text-sm text-slate-400">{item.variant.sku}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.variant_id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => decrementQuantity(item.variant_id)}
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
                    >
                      <Minus size={16} className="text-white" />
                    </button>
                    <span className="text-white font-semibold text-lg w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => incrementQuantity(item.variant_id)}
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
                    >
                      <Plus size={16} className="text-white" />
                    </button>
                  </div>
                  <span className="text-white font-bold text-lg">
                    {item.total.toLocaleString()} so'm
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total & Payment */}
        {cart.length > 0 && (
          <div className="border-t border-slate-700 pt-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 text-lg">Jami:</span>
              <span className="text-white text-2xl font-bold">
                {getCartTotal().toLocaleString()} so'm
              </span>
            </div>
            <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-colors">
              To'lov
            </button>
          </div>
        )}
      </div>

      {/* Modifiers Modal */}
      {selectedVariant && (
        <ModifiersModal
          variant={selectedVariant}
          onAdd={handleAddWithModifiers}
          onClose={() => setSelectedVariant(null)}
        />
      )}
    </div>
  );
}








