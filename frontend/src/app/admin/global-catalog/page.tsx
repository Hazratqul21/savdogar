"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { contributeToGlobalCatalogRPC, searchGlobalCatalogByBarcode, type GlobalCatalogProduct } from "@/lib/supabase";
import { Search, Save, CheckCircle, XCircle, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/inventory/Toast";

export default function GlobalCatalogPage() {
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [existingProduct, setExistingProduct] = useState<GlobalCatalogProduct | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const { toasts, removeToast, success, error } = useToast();

  // Auto-check when barcode changes
  useEffect(() => {
    const checkBarcode = async () => {
      if (barcode.length >= 8) {
        setIsChecking(true);
        try {
          const product = await searchGlobalCatalogByBarcode(barcode);
          if (product) {
            setExistingProduct(product);
            setName(product.name || "");
            setCategory(product.category || "");
            setImageUrl(product.image_url || "");
            setDescription(product.description || "");
            success("Product already exists in global catalog. You can update it.");
          } else {
            setExistingProduct(null);
            // Keep form values if user already entered them
            if (!name) setName("");
            if (!category) setCategory("");
            if (!imageUrl) setImageUrl("");
            if (!description) setDescription("");
          }
        } catch (err) {
          console.error("Error checking barcode:", err);
        } finally {
          setIsChecking(false);
        }
      } else {
        setExistingProduct(null);
      }
    };

    const timeoutId = setTimeout(checkBarcode, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [barcode, success]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!barcode || !name) {
        throw new Error("Barcode and Name are required");
      }
      return await contributeToGlobalCatalogRPC(barcode, name, category || undefined, imageUrl || undefined, description || undefined);
    },
    onSuccess: () => {
      success(existingProduct ? "Product updated in global catalog" : "Product added to global catalog");
      // Reset form
      setBarcode("");
      setName("");
      setCategory("");
      setImageUrl("");
      setDescription("");
      setExistingProduct(null);
      // Focus back on barcode input
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    },
    onError: (err: any) => {
      error(err.message || "Failed to save product");
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && barcode && name && !saveMutation.isPending) {
      handleSave();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Global Catalog Manager</h1>
        <p className="text-gray-600 mt-1">Quick contributor tool - Add products to global catalog</p>
      </div>

      {/* Main Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Add/Update Product</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Barcode Input - Large and Prominent */}
          <div className="space-y-2">
            <Label htmlFor="barcode" className="text-base font-semibold">
              Barcode <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                id="barcode"
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan or enter barcode..."
                className="h-14 pl-12 text-lg"
                autoFocus
                onKeyPress={handleKeyPress}
              />
              {isChecking && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="animate-spin text-gray-400" size={20} />
                </div>
              )}
              {!isChecking && existingProduct && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <CheckCircle className="text-green-500" size={20} />
                </div>
              )}
              {!isChecking && !existingProduct && barcode.length >= 8 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <XCircle className="text-gray-400" size={20} />
                </div>
              )}
            </div>
            {existingProduct && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle size={14} />
                Product exists - Updating existing entry
              </p>
            )}
            {!existingProduct && barcode.length >= 8 && !isChecking && (
              <p className="text-sm text-blue-600">New product - Will be added to catalog</p>
            )}
          </div>

          {/* Product Name - Required */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-semibold">
              Product Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name..."
              className="h-12 text-base"
              onKeyPress={handleKeyPress}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-base font-semibold">
              Category
            </Label>
            <Input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Food, Electronics, Clothing..."
              className="h-12 text-base"
              onKeyPress={handleKeyPress}
            />
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="text-base font-semibold">
              Image URL
            </Label>
            <Input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="h-12 text-base"
              onKeyPress={handleKeyPress}
            />
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Product preview"
                className="w-full h-48 object-contain bg-gray-100 rounded-lg border border-gray-200 mt-2"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold">
              Description
            </Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product description..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              onKeyPress={handleKeyPress}
            />
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={!barcode || !name || saveMutation.isPending}
              className="flex-1 h-12 text-base font-semibold"
              size="lg"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={20} />
                  {existingProduct ? "Update Product" : "Add to Catalog"}
                </>
              )}
            </Button>
          </div>

          {/* Helper Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> After saving, the cursor will automatically focus back on the barcode field
              for rapid entry. Press Enter to save when both barcode and name are filled.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Mobile Camera Button (Optional - for future implementation) */}
      <div className="md:hidden fixed bottom-6 right-6">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
          onClick={() => {
            // TODO: Open camera scanner
            alert("Camera scanner coming soon");
          }}
        >
          <Camera size={24} />
        </Button>
      </div>
    </div>
  );
}
