"use client";

import { useState, useRef } from "react";
import { Upload, X, Edit2, Save, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { scanNakladnoyImage, importNakladnoyToInventory, type NakladnoyItem } from "@/lib/api";

export default function NakladnoyScannerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [items, setItems] = useState<NakladnoyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setItems([]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleScan = async () => {
    if (!file) return;

    setScanning(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await scanNakladnoyImage(file);
      setItems(result.items || []);
      setSuccess(`${result.items?.length || 0} ta mahsulot topildi`);
    } catch (err: any) {
      setError(err.message || "Nakladnoy tahlil qilishda xatolik yuz berdi");
    } finally {
      setScanning(false);
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (index: number, updatedItem: NakladnoyItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    setItems(newItems);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleImport = async () => {
    if (items.length === 0) {
      setError("Import qilish uchun kamida bitta mahsulot bo'lishi kerak");
      return;
    }

    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await importNakladnoyToInventory(items);
      setSuccess(
        `${result.created_count || 0} ta mahsulot omborga qo'shildi. ` +
        (result.error_count > 0 ? `${result.error_count} ta xatolik.` : "")
      );
      setItems([]);
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setError(err.message || "Omborga import qilishda xatolik yuz berdi");
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setItems([]);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nakladnoy Skaner</h1>
          <p className="text-gray-600 mt-1">Nakladnoy rasmini yuklab, AI orqali tahlil qiling</p>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nakladnoy rasmini tanlang
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
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium"
            >
              <Upload size={20} />
              Rasm tanlash
            </label>
            {file && (
              <p className="text-sm text-gray-600 mt-2">{file.name}</p>
            )}
          </div>
          {file && (
            <div className="flex gap-3">
              <button
                onClick={handleScan}
                disabled={scanning}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {scanning ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Tahlil qilinmoqda...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Tahlil qilish
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

        {/* Preview */}
        {preview && (
          <div className="mt-6">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-96 rounded-lg border border-gray-200"
            />
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="text-green-600" size={20} />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Items List */}
      {items.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Tahlil qilingan mahsulotlar ({items.length})
            </h2>
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Import qilinmoqda...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Omborga yuborish
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Mahsulot nomi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Miqdor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Birlik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Narx
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Jami
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index}>
                    {editingIndex === index ? (
                      <EditableRow
                        item={item}
                        onSave={(updated) => handleSaveEdit(index, updated)}
                        onCancel={() => setEditingIndex(null)}
                      />
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {item.price.toLocaleString()} so'm
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {item.total.toLocaleString()} so'm
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(index)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function EditableRow({
  item,
  onSave,
  onCancel,
}: {
  item: NakladnoyItem;
  onSave: (item: NakladnoyItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity.toString());
  const [unit, setUnit] = useState(item.unit);
  const [price, setPrice] = useState(item.price.toString());

  const handleSave = () => {
    const qty = parseFloat(quantity) || 0;
    const prc = parseFloat(price) || 0;
    onSave({
      name,
      quantity: qty,
      unit,
      price: prc,
      total: qty * prc,
    });
  };

  return (
    <>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          step="0.01"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          step="0.01"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
        {(parseFloat(quantity) * parseFloat(price) || 0).toLocaleString()} so'm
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="text-green-600 hover:text-green-800"
          >
            <Save size={18} />
          </button>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800"
          >
            <X size={18} />
          </button>
        </div>
      </td>
    </>
  );
}
