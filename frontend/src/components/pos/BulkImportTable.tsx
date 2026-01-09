"use client";

import { useState, useEffect } from "react";
import { Edit2, Trash2, Save, X, CheckCircle2 } from "lucide-react";
import { ParsedInvoiceItem } from "@/lib/api";
import { getProducts, type ProductVariant } from "@/lib/api-pos";
import { useQuery } from "@tanstack/react-query";

interface BulkImportTableProps {
  items: ParsedInvoiceItem[];
  tenantId: number;
  onItemsChange: (items: ParsedInvoiceItem[]) => void;
  onImport: (items: ParsedInvoiceItem[]) => void;
}

/**
 * Bulk Import Table Component
 * 
 * Displays parsed invoice items with:
 * - Fuzzy matching with existing products_v2
 * - Editable fields
 * - Import to products_v2 functionality
 */
export function BulkImportTable({
  items: initialItems,
  tenantId,
  onItemsChange,
  onImport,
}: BulkImportTableProps) {
  const [items, setItems] = useState<ParsedInvoiceItem[]>(initialItems);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [matchedProducts, setMatchedProducts] = useState<Map<number, ProductVariant | null>>(new Map());

  // Fetch products for fuzzy matching
  const { data: products = [] } = useQuery({
    queryKey: ["products", tenantId],
    queryFn: () => getProducts(tenantId),
    enabled: !!tenantId && items.length > 0,
  });

  // Fuzzy match products when items change
  useEffect(() => {
    if (products.length === 0) return;

    const matches = new Map<number, ProductVariant | null>();

    items.forEach((item, index) => {
      // Flatten all variants from products
      const allVariants: ProductVariant[] = [];
      products.forEach((product: any) => {
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach((variant: any) => {
            allVariants.push({
              ...variant,
              product: {
                id: product.id,
                name: product.name,
                tax_rate: product.tax_rate || 0,
              },
            });
          });
        }
      });

      // Simple fuzzy match: check if product name contains item name or vice versa
      const itemNameLower = item.product_name.toLowerCase().trim();
      let bestMatch: ProductVariant | null = null;
      let bestScore = 0;

      allVariants.forEach((variant) => {
        const variantName = variant.product?.name || "";
        const variantNameLower = variantName.toLowerCase().trim();

        // Calculate similarity (simple contains check + length similarity)
        let score = 0;
        if (variantNameLower.includes(itemNameLower) || itemNameLower.includes(variantNameLower)) {
          score = 0.7; // Base score for contains match
        }

        // Length similarity bonus
        const lengthDiff = Math.abs(variantNameLower.length - itemNameLower.length);
        const maxLength = Math.max(variantNameLower.length, itemNameLower.length);
        if (maxLength > 0) {
          score += (1 - lengthDiff / maxLength) * 0.3;
        }

        if (score > bestScore && score >= 0.6) {
          bestScore = score;
          bestMatch = variant;
        }
      });

      matches.set(index, bestMatch);
    });

    setMatchedProducts(matches);
  }, [items, products]);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (index: number, updatedItem: ParsedInvoiceItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    setItems(newItems);
    onItemsChange(newItems);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onItemsChange(newItems);
    setEditingIndex(null);
  };

  const handleImport = async () => {
    if (items.length === 0) return;
    try {
      await onImport(items);
    } catch (error) {
      console.error("Bulk import error:", error);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Hech qanday mahsulot topilmadi</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 size={20} />
          <span className="font-semibold">{items.length} ta mahsulot topildi</span>
        </div>
        <button
          onClick={handleImport}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
        >
          <CheckCircle2 size={18} />
          Barchasini import qilish
        </button>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Mahsulot nomi
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Miqdor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Narx (birlik)
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Jami
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Match
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item, index) => {
                const matched = matchedProducts.get(index);
                const isEditing = editingIndex === index;

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    {isEditing ? (
                      <EditableRow
                        item={item}
                        onSave={(updated) => handleSaveEdit(index, updated)}
                        onCancel={() => setEditingIndex(null)}
                      />
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{item.product_name}</div>
                          {matched && (
                            <div className="text-xs text-blue-600 mt-1">
                              ✓ Match: {matched.product?.name}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.price.toLocaleString()} so'm
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {(item.quantity * item.price).toLocaleString()} so'm
                        </td>
                        <td className="px-4 py-3">
                          {matched ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                              <CheckCircle2 size={12} />
                              Topildi
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                              Yangi
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(index)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              aria-label="Tahrirlash"
                              title="Tahrirlash"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(index)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              aria-label="O'chirish"
                              title="O'chirish"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EditableRow({
  item,
  onSave,
  onCancel,
}: {
  item: ParsedInvoiceItem;
  onSave: (item: ParsedInvoiceItem) => void;
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

  return (
    <>
      <td className="px-4 py-3">
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            step="0.01"
            min="0"
          />
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="dona"
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          step="0.01"
          min="0"
        />
      </td>
      <td className="px-4 py-3 font-semibold text-gray-900">
        {(parseFloat(quantity) * parseFloat(price) || 0).toLocaleString()} so'm
      </td>
      <td className="px-4 py-3"></td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={handleSave}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
            aria-label="Saqlash"
          >
            <Save size={16} />
          </button>
          <button
            onClick={onCancel}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            aria-label="Bekor qilish"
          >
            <X size={16} />
          </button>
        </div>
      </td>
    </>
  );
}
