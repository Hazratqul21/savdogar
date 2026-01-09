"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, Loader2, FileText, PenTool, CheckCircle2, XCircle } from "lucide-react";
import { parseInvoice, type ParsedInvoiceItem } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

interface InvoiceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsParsed: (items: ParsedInvoiceItem[]) => void;
}

/**
 * Invoice Scanner Modal Component
 * 
 * Features:
 * - Camera/Upload area
 * - Toggle: "Qo'lda yozilgan" (Handwritten / Hard to Read)
 * - Model selection: gpt-4o-mini (printed) or gpt-4o (handwritten)
 * - Process button
 */
export function InvoiceScannerModal({ isOpen, onClose, onProductsParsed }: InvoiceScannerModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isHandwritten, setIsHandwritten] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedInvoiceItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toasts, removeToast, success: showSuccessToast, error: showErrorToast } = useToast();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setPreview(null);
      setIsHandwritten(false);
      setIsProcessing(false);
      setParsedItems([]);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setParsedItems([]);
      setError(null);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleProcess = async () => {
    if (!file) {
      showErrorToast("Iltimos, avval rasm tanlang");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setParsedItems([]);

    try {
      const result = await parseInvoice(file, isHandwritten);

      if (!result.success || result.items.length === 0) {
        setError(
          result.error ||
            "Hech qanday mahsulot topilmadi. Iltimos, qayta urinib ko'ring yoki qo'lda kiriting."
        );
        showErrorToast(
          result.error ||
            "Hech qanday mahsulot topilmadi. Iltimos, qayta urinib ko'ring."
        );
        return;
      }

      setParsedItems(result.items);
      showSuccessToast(
        `${result.items.length} ta mahsulot topildi (${result.model_used} model ishlatildi)`
      );
    } catch (err: any) {
      const errorMessage = err.message || "Invoice tahlil qilishda xatolik yuz berdi";
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (parsedItems.length === 0) {
      showErrorToast("Import qilish uchun kamida bitta mahsulot bo'lishi kerak");
      return;
    }
    onProductsParsed(parsedItems);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText size={24} />
              📸 Scan Invoice
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Faktura rasmini yuklang yoki kameradan oling
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Toggle Switch */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <PenTool size={20} className="text-gray-600" />
              <div>
                <label className="text-sm font-semibold text-gray-900 cursor-pointer">
                  Qo'lda yozilgan / Qiyin o'qiladigan
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isHandwritten
                    ? "gpt-4o model ishlatiladi (yuqori aniqlik)"
                    : "gpt-4o-mini model ishlatiladi (tez va arzon)"}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isHandwritten}
                onChange={(e) => setIsHandwritten(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="invoice-upload"
            />

            {!preview ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-blue-50 rounded-full">
                    <Camera size={32} className="text-blue-600" />
                  </div>
                  <div>
                    <label
                      htmlFor="invoice-upload"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium"
                    >
                      <Upload size={20} />
                      Rasm tanlash yoki kameradan olish
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      JPEG, PNG, GIF, WEBP, HEIC qo'llab-quvvatlanadi
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt="Invoice preview"
                  className="max-w-full max-h-64 mx-auto rounded-lg border border-gray-200 shadow-sm"
                />
                <div className="flex items-center justify-center gap-3">
                  <label
                    htmlFor="invoice-upload"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer text-sm font-medium"
                  >
                    Boshqa rasm tanlash
                  </label>
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    O'chirish
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Process Button */}
          {file && (
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Tahlil qilinmoqda...
                </>
              ) : (
                <>
                  <FileText size={20} />
                  Analyze
                </>
              )}
            </button>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-blue-600">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm font-medium">
                  {isHandwritten
                    ? "gpt-4o model bilan tahlil qilinmoqda (yuqori aniqlik)..."
                    : "gpt-4o-mini model bilan tahlil qilinmoqda (tez)..."}
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900">Xatolik</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Parsed Results Preview */}
          {parsedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 size={20} />
                <span className="font-semibold">
                  {parsedItems.length} ta mahsulot topildi
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                {parsedItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 text-sm"
                  >
                    <span className="font-medium text-gray-900">{item.product_name}</span>
                    <span className="text-gray-600">
                      {item.quantity} {item.unit} × {item.price.toLocaleString()} so'm
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleConfirm}
            disabled={parsedItems.length === 0}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle2 size={20} />
            Import qilish ({parsedItems.length})
          </button>
        </div>
      </div>
    </div>
  );
}
