"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Coffee } from "lucide-react";
import { type ProductVariant } from "@/stores/pos-state";

interface SizeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  variants: ProductVariant[];
  onSelect: (variant: ProductVariant) => void;
}

// Size labels in Uzbek
const SIZE_LABELS: Record<string, { label: string; icon: string }> = {
  small: { label: "Kichik", icon: "S" },
  kichik: { label: "Kichik", icon: "S" },
  medium: { label: "O'rtacha", icon: "M" },
  ortacha: { label: "O'rtacha", icon: "M" },
  large: { label: "Katta", icon: "L" },
  katta: { label: "Katta", icon: "L" },
  xl: { label: "Juda katta", icon: "XL" },
};

function getSizeInfo(variant: ProductVariant): { label: string; icon: string; order: number } {
  const size = variant.attributes?.size?.toLowerCase() || 
               variant.attributes?.razmer?.toLowerCase() || 
               variant.sku?.split("-").pop()?.toLowerCase() ||
               "medium";
  
  const sizeInfo = SIZE_LABELS[size];
  
  // Order for sorting
  const orderMap: Record<string, number> = { small: 1, kichik: 1, medium: 2, ortacha: 2, large: 3, katta: 3, xl: 4 };
  const order = orderMap[size] || 2;
  
  if (sizeInfo) {
    return { ...sizeInfo, order };
  }
  
  return { label: size.charAt(0).toUpperCase() + size.slice(1), icon: size[0]?.toUpperCase() || "M", order };
}

export function SizeSelectionModal({
  isOpen,
  onClose,
  productName,
  variants,
  onSelect,
}: SizeSelectionModalProps) {
  // Sort variants by size order
  const sortedVariants = [...variants].sort((a, b) => {
    return getSizeInfo(a).order - getSizeInfo(b).order;
  });

  const handleSelect = (variant: ProductVariant) => {
    onSelect(variant);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{productName}</h2>
                  <p className="text-sm text-gray-500">Hajmni tanlang</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Size Options */}
            <div className="p-4 space-y-2">
              {sortedVariants.map((variant) => {
                const sizeInfo = getSizeInfo(variant);
                
                return (
                  <button
                    key={variant.id}
                    onClick={() => handleSelect(variant)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 border-2 border-transparent hover:border-blue-500 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white border-2 border-gray-200 group-hover:border-blue-500 rounded-full flex items-center justify-center font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                        {sizeInfo.icon}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 group-hover:text-blue-700">
                          {sizeInfo.label}
                        </p>
                        <p className="text-sm text-gray-500">
                          {variant.sku}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 group-hover:text-blue-700">
                        {variant.price.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">so'm</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="px-4 pb-4">
              <p className="text-xs text-center text-gray-400">
                Bosing va savatchaga qo'shing
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
