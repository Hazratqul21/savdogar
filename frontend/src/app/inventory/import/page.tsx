"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Loader2, Camera, PenTool } from "lucide-react";
import { scanInvoiceHybrid, importNakladnoyToInventory, type HybridScanItem } from "@/lib/api";
import { InvoicePreviewModal } from "@/components/inventory/InvoicePreviewModal";
import { ToastContainer } from "@/components/inventory/Toast";
import { useToast } from "@/hooks/useToast";

export default function HybridInvoiceScannerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState<"printed" | "handwritten">("printed");
  const [scannedItems, setScannedItems] = useState<HybridScanItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toasts, success, error, removeToast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setScannedItems([]);
      setShowPreview(false);
    }
  };

  const handleScan = async (mode: "printed" | "handwritten") => {
    if (!file) return;

    setScanning(true);
    setScanMode(mode);
    setShowPreview(false);

    try {
      const result = await scanInvoiceHybrid(file, mode);

      if (!result.success || result.items.length === 0) {
        error(
          result.error ||
            "Hech qanday mahsulot topilmadi. Iltimos, qayta urinib ko'ring yoki qo'lda kiriting."
        );
        return;
      }

      setScannedItems(result.items);
      setShowPreview(true);
      success(
        `${result.items.length} ta mahsulot topildi (${result.model_used} model ishlatildi)`
      );
    } catch (err: any) {
      error(err.message || "Invoice tahlil qilishda xatolik yuz berdi");
    } finally {
      setScanning(false);
    }
  };

  const handleConfirmImport = async (items: HybridScanItem[]) => {
    if (items.length === 0) {
      error("Import qilish uchun kamida bitta mahsulot bo'lishi kerak");
      return;
    }

    setImporting(true);
    setShowPreview(false);

    try {
      // Convert to nakladnoy format for import
      const nakladnoyItems = items.map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        total: item.quantity * item.price,
      }));

      const result = await importNakladnoyToInventory(nakladnoyItems);
      const successMessage = `✅ ${result.created_count || 0} ta mahsulot omborga qo'shildi${
        result.error_count > 0 ? `. ${result.error_count} ta xatolik.` : ""
      }`;

      success(successMessage);

      // Reset
      setFile(null);
      setPreview(null);
      setScannedItems([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      error(err.message || "Omborga import qilishda xatolik yuz berdi");
    } finally {
      setImporting(false);
    }
  };

  const handleManualEntry = () => {
    setShowPreview(false);
    // TODO: Navigate to manual entry page or open manual entry modal
    error("Qo'lda kiritish funksiyasi tez orada qo'shiladi");
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setScannedItems([]);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hybrid AI Invoice Scanner</h1>
          <p className="text-gray-600 mt-1">
            Tez va aniq faktura skanerlash - bosilgan yoki qo'lda yozilgan
          </p>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Invoice rasmini tanlang
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium inline-block"
            >
              <Upload size={20} />
              Rasm tanlash
            </label>
            {file && (
              <p className="text-sm text-gray-600 mt-2">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
          {file && (
            <div className="flex gap-3">
              <button
                onClick={() => handleScan("printed")}
                disabled={scanning}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
              >
                {scanning && scanMode === "printed" ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Tahlil qilinmoqda...
                  </>
                ) : (
                  <>
                    <Camera size={20} />
                    📸 Bosilgan (Tez)
                  </>
                )}
              </button>
              <button
                onClick={() => handleScan("handwritten")}
                disabled={scanning}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
              >
                {scanning && scanMode === "handwritten" ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Tahlil qilinmoqda...
                  </>
                ) : (
                  <>
                    <PenTool size={20} />
                    ✍️ Qo'lda yozilgan (Aniq)
                  </>
                )}
              </button>
              <button
                onClick={reset}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Tozalash
              </button>
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {scanning && (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Preview */}
        {preview && !scanning && (
          <div className="mt-6">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-96 rounded-lg border border-gray-200 shadow-sm"
            />
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <InvoicePreviewModal
        isOpen={showPreview}
        items={scannedItems}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirmImport}
        onManualEntry={handleManualEntry}
      />

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Qanday ishlaydi?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                <strong>📸 Bosilgan (Tez):</strong> gpt-4o-mini modelidan foydalanadi - tez va
                arzon, bosilgan fakturalar uchun
              </li>
              <li>
                <strong>✍️ Qo'lda yozilgan (Aniq):</strong> gpt-4o modelidan foydalanadi - yuqori
                aniqlik, qo'lda yozilgan fakturalar uchun
              </li>
              <li>
                Tahlil qilingan ma'lumotlarni tekshiring va tahrirlang, keyin omborga qo'shing
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
