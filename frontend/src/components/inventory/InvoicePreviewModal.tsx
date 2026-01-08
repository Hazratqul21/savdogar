"use client";

import { useEffect, useRef, useState } from "react";
import { X, Check, Edit2, Trash2, Save } from "lucide-react";
import { HybridScanItem } from "@/lib/api";

interface InvoicePreviewModalProps {
  isOpen: boolean;
  items: HybridScanItem[];
  onClose: () => void;
  onConfirm: (items: HybridScanItem[]) => void;
  onManualEntry: () => void;
}

export function InvoicePreviewModal({
  isOpen,
  items: initialItems,
  onClose,
  onConfirm,
  onManualEntry,
}: InvoicePreviewModalProps) {
  const [items, setItems] = useState<HybridScanItem[]>(initialItems);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Update items when initialItems change
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Enter to confirm (only if not editing)
      if (e.key === "Enter" && !editingIndex && e.ctrlKey) {
        e.preventDefault();
        handleConfirm();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, editingIndex, items]);

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (isOpen && firstInputRef.current && !editingIndex) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen, editingIndex]);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (index: number, updatedItem: HybridScanItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    setItems(newItems);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    setEditingIndex(null);
  };

  const handleConfirm = () => {
    if (items.length === 0) {
      return;
    }
    onConfirm(items);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Tahlil natijalarini tekshirish
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {items.length} ta mahsulot topildi. Ma'lumotlarni tekshiring va tahrirlang
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Yopish"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">
                Hech qanday mahsulot topilmadi
              </p>
              <button
                onClick={onManualEntry}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Qo'lda kiritish
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  {editingIndex === index ? (
                    <EditableItemRow
                      item={item}
                      onSave={(updated) => handleSaveEdit(index, updated)}
                      onCancel={() => setEditingIndex(null)}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Mahsulot nomi</p>
                          <p className="font-semibold text-gray-900">{item.product_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Miqdor</p>
                          <p className="text-gray-700">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Narx (birlik)</p>
                          <p className="text-gray-700">
                            {item.price.toLocaleString()} so'm
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Jami</p>
                          <p className="font-semibold text-gray-900">
                            {(item.quantity * item.price).toLocaleString()} so'm
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(index)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          aria-label="Tahrirlash"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="O'chirish"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onManualEntry}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Qo'lda kiritish
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleConfirm}
              disabled={items.length === 0}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check size={20} />
              Tasdiqlash va omborga qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditableItemRow({
  item,
  onSave,
  onCancel,
}: {
  item: HybridScanItem;
  onSave: (item: HybridScanItem) => void;
  onCancel: () => void;
}) {
  const [productName, setProductName] = useState(item.product_name);
  const [quantity, setQuantity] = useState(item.quantity.toString());
  const [price, setPrice] = useState(item.price.toString());
  const [unit, setUnit] = useState(item.unit);

  const handleSave = () => {
    const qty = parseFloat(quantity) || 0;
    const prc = parseFloat(price) || 0;
    if (qty > 0 && productName.trim()) {
      onSave({
        product_name: productName.trim(),
        quantity: qty,
        price: prc,
        unit: unit.trim() || "dona",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Mahsulot nomi</label>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          autoFocus
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Miqdor</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            step="0.01"
            min="0"
          />
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="dona"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Narx (birlik)</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          step="0.01"
          min="0"
        />
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">Jami</label>
          <p className="px-3 py-2 bg-gray-50 rounded-lg text-sm font-semibold text-gray-900">
            {(parseFloat(quantity) * parseFloat(price) || 0).toLocaleString()} so'm
          </p>
        </div>
        <button
          onClick={handleSave}
          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          aria-label="Saqlash"
        >
          <Save size={18} />
        </button>
        <button
          onClick={onCancel}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Bekor qilish"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
