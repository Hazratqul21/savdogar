"use client";

import { useState } from "react";
import { Package, Barcode, DollarSign, Loader2, CheckCircle, SkipForward } from "lucide-react";

interface StepFirstProductProps {
  onComplete: () => void;
  onBack: () => void;
  onSkip: () => void;
  saving: boolean;
}

export default function StepFirstProduct({
  onComplete,
  onBack,
  onSkip,
  saving,
}: StepFirstProductProps) {
  const [productData, setProductData] = useState({
    name: "",
    barcode: "",
    price: "",
    cost: "",
    stock: "",
  });
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddProduct = async () => {
    if (!productData.name || !productData.price) return;
    
    setAdding(true);
    try {
      // In a real implementation, this would call the products API
      // For now, we'll just simulate the addition
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAdded(true);
    } catch (error) {
      console.error("Failed to add product:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleComplete = () => {
    if (added || productData.name) {
      handleAddProduct().then(onComplete);
    } else {
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Birinchi mahsulot</h2>
        <p className="text-gray-500 mt-2">
          Omboringizga birinchi mahsulotni qo'shing yoki keyinroq qo'shing
        </p>
      </div>

      {added ? (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Mahsulot qo'shildi!</h3>
          <p className="text-gray-500">Keyingi mahsulotlarni Dashboard'dan qo'shishingiz mumkin</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4 inline mr-2" />
              Mahsulot nomi *
            </label>
            <input
              type="text"
              value={productData.name}
              onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Masalan: Coca-Cola 1L"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Barcode className="w-4 h-4 inline mr-2" />
              Shtrix kod
            </label>
            <input
              type="text"
              value={productData.barcode}
              onChange={(e) => setProductData(prev => ({ ...prev, barcode: e.target.value }))}
              placeholder="Skanerdan yoki qo'lda kiriting"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Sotish narxi *
              </label>
              <input
                type="number"
                value={productData.price}
                onChange={(e) => setProductData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="15000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kelish narxi
              </label>
              <input
                type="number"
                value={productData.cost}
                onChange={(e) => setProductData(prev => ({ ...prev, cost: e.target.value }))}
                placeholder="12000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Boshlang'ich qoldiq
            </label>
            <input
              type="number"
              value={productData.stock}
              onChange={(e) => setProductData(prev => ({ ...prev, stock: e.target.value }))}
              placeholder="100"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {productData.name && productData.price && (
            <button
              onClick={handleAddProduct}
              disabled={adding}
              className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {adding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Qo'shilmoqda...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Mahsulotni qo'shish
                </>
              )}
            </button>
          )}
        </div>
      )}

      <div className="flex justify-between pt-4 border-t">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          Orqaga
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            disabled={saving}
            className="px-6 py-3 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            O'tkazib yuborish
          </button>
          <button
            onClick={handleComplete}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saqlanmoqda...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Tugatish
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
