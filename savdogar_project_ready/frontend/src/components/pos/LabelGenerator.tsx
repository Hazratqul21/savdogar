"use client";

import { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import QRCodeSVG from 'react-qr-code';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/lib/api-pos';
import { Printer, Download, Plus, Minus, X } from 'lucide-react';
import type { ProductVariant } from '@/stores/pos-state';
import { usePosState } from '@/stores/pos-state';

interface LabelItem {
  variant: ProductVariant;
  quantity: number;
  price: number;
}

export function LabelGenerator() {
  const { tenantId } = usePosState();
  const printRef = useRef<HTMLDivElement>(null);
  const [labels, setLabels] = useState<LabelItem[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['products', tenantId],
    queryFn: () => getProducts(tenantId!),
    enabled: !!tenantId,
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Product Labels',
    pageStyle: `
      @page {
        size: 40mm 30mm;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .label-page {
          page-break-after: always;
        }
      }
    `,
  });

  const addLabel = () => {
    if (!selectedVariant) return;

    const existingIndex = labels.findIndex(
      (l) => l.variant.id === selectedVariant.id
    );

    if (existingIndex >= 0) {
      // Update existing
      setLabels(
        labels.map((l, i) =>
          i === existingIndex ? { ...l, quantity: l.quantity + quantity } : l
        )
      );
    } else {
      // Add new
      setLabels([
        ...labels,
        {
          variant: selectedVariant,
          quantity,
          price: selectedVariant.price,
        },
      ]);
    }

    setSelectedVariant(null);
    setQuantity(1);
    setShowAddForm(false);
  };

  const removeLabel = (index: number) => {
    setLabels(labels.filter((_, i) => i !== index));
  };

  const updateLabelQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setLabels(
      labels.map((l, i) => (i === index ? { ...l, quantity: newQuantity } : l))
    );
  };

  // Generate QR code data
  const generateQRData = (variant: ProductVariant): string => {
    return JSON.stringify({
      s: variant.sku,
      v: variant.id.toString(),
    });
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Label Studio</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2"
          >
            <Plus size={20} />
            Mahsulot qo'shish
          </button>
          {labels.length > 0 && (
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2"
            >
              <Printer size={20} />
              Chop etish ({labels.reduce((sum, l) => sum + l.quantity, 0)} ta)
            </button>
          )}
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full mx-4 border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Mahsulot qo'shish</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mahsulot
                </label>
                <select
                  value={selectedVariant?.id || ''}
                  onChange={(e) => {
                    const variantId = parseInt(e.target.value);
                    const variant = products
                      .flatMap((p: any) => p.variants || [])
                      .find((v: ProductVariant) => v.id === variantId);
                    setSelectedVariant(variant || null);
                  }}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">Tanlang...</option>
                  {products.map((product: any) =>
                    product.variants?.map((variant: ProductVariant) => (
                      <option key={variant.id} value={variant.id}>
                        {product.name} - {variant.sku} ({variant.price.toLocaleString()} so'm)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nusxa soni
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={addLabel}
                  disabled={!selectedVariant}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold"
                >
                  Qo'shish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Labels List */}
      <div className="flex-1 bg-slate-900 rounded-xl p-4 overflow-auto">
        {labels.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Printer size={48} className="mx-auto mb-4 opacity-50" />
            <p>Hozircha label yo'q</p>
            <p className="text-sm mt-2">Mahsulot qo'shing va chop eting</p>
          </div>
        ) : (
          <div className="space-y-3">
            {labels.map((label, index) => (
              <div
                key={index}
                className="p-4 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-semibold text-white">
                    {label.variant.product?.name || label.variant.sku}
                  </p>
                  <p className="text-sm text-slate-400">{label.variant.sku}</p>
                  <p className="text-sm text-slate-300 mt-1">
                    {label.price.toLocaleString()} so'm
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateLabelQuantity(index, label.quantity - 1)}
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded"
                    >
                      <Minus size={16} className="text-white" />
                    </button>
                    <span className="text-white font-semibold w-12 text-center">
                      {label.quantity}
                    </span>
                    <button
                      onClick={() => updateLabelQuantity(index, label.quantity + 1)}
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded"
                    >
                      <Plus size={16} className="text-white" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeLabel(index)}
                    className="p-2 text-red-400 hover:text-red-300"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Printable Labels (Hidden until print) */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} className="print-container">
          {labels.map((label, labelIndex) =>
            Array.from({ length: label.quantity }).map((_, copyIndex) => (
              <div
                key={`${labelIndex}-${copyIndex}`}
                className="label-page"
                style={{
                  width: '40mm',
                  height: '30mm',
                  padding: '2mm',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid #000',
                  pageBreakAfter: 'always',
                }}
              >
                {/* Header - Product Name */}
                <div
                  style={{
                    fontSize: '8pt',
                    fontWeight: 'bold',
                    lineHeight: '1.2',
                    maxHeight: '8mm',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {label.variant.product?.name || label.variant.sku}
                </div>

                {/* Body - QR Code */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flex: 1,
                    minHeight: '12mm',
                  }}
                >
                  <QRCodeSVG
                    value={generateQRData(label.variant)}
                    size={60}
                    level="M"
                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                  />
                </div>

                {/* Footer - Price */}
                <div
                  style={{
                    fontSize: '10pt',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginTop: '2mm',
                  }}
                >
                  {label.price.toLocaleString()} so'm
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: 40mm 30mm;
            margin: 0;
            padding: 0;
          }

          body {
            margin: 0;
            padding: 0;
            background: white;
          }

          .print-container {
            display: block;
          }

          .label-page {
            width: 40mm !important;
            height: 30mm !important;
            margin: 0 !important;
            padding: 2mm !important;
            page-break-after: always;
            page-break-inside: avoid;
            border: 1px solid #000;
            box-sizing: border-box;
          }

          /* Hide everything except labels */
          body > *:not(.print-container) {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}








