"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductVariant } from "@/stores/pos-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProductCardProps {
  variant: ProductVariant;
  businessType: string | null;
  onAddToCart: (variant: ProductVariant, quantity: number) => void;
  className?: string;
}

export function ProductCard({
  variant,
  businessType,
  onAddToCart,
  className,
}: ProductCardProps) {
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [isAdding, setIsAdding] = useState(false);

  const productName = variant.product?.name || variant.sku;
  const price = variant.price;
  const stock = variant.stock_quantity;
  // Check if this is a meter-based product (for plumbing)
  const primaryUnit = (variant as any).primary_unit || variant.attributes?.primary_unit || "piece";
  const isPlumbing = businessType === "plumbing_hvac" || businessType === "plumbing";

  const handleClick = () => {
    if (isPlumbing && primaryUnit === "meter") {
      // For PLUMBING with meter units, show dialog
      setShowQuantityDialog(true);
      setQuantity("1");
    } else {
      // For RETAIL and others, just add +1
      handleAddToCart(1);
    }
  };

  const handleAddToCart = (qty: number) => {
    if (qty <= 0 || isAdding) return;
    
    setIsAdding(true);
    onAddToCart(variant, qty);
    
    // Reset after animation
    setTimeout(() => {
      setIsAdding(false);
      setShowQuantityDialog(false);
      setQuantity("1");
    }, 300);
  };

  const handleDialogConfirm = () => {
    const qty = parseFloat(quantity);
    if (qty > 0) {
      handleAddToCart(qty);
    }
  };

  const isOutOfStock = stock <= 0;

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn("h-full", className)}
      >
        <Card
          className={cn(
            "h-full cursor-pointer transition-all duration-200 bg-white border border-gray-200",
            "hover:shadow-md",
            isOutOfStock && "opacity-50 cursor-not-allowed",
            isAdding && "ring-2 ring-blue-500 ring-offset-2"
          )}
          onClick={!isOutOfStock ? handleClick : undefined}
        >
          <CardContent className="p-4 flex flex-col h-full">
            {/* Product Info */}
            <div className="flex-1 space-y-2 mb-3">
              <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-tight mb-1">
                {productName}
              </h3>
              <p className="text-xs text-gray-500">{variant.sku}</p>
              
              <div className="flex items-baseline justify-between mt-3">
                <span className="text-lg font-bold text-gray-900">
                  {price.toLocaleString()} so'm
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {stock.toFixed(2)} {primaryUnit}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quantity Dialog for Plumbing */}
      <Dialog open={showQuantityDialog} onOpenChange={setShowQuantityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {productName}</DialogTitle>
            <DialogDescription>
              How many meters do you want to add?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="quantity">Quantity (meters)</Label>
            <Input
              id="quantity"
              type="number"
              min="0.01"
              step="0.01"
              max={stock}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleDialogConfirm();
                }
              }}
              autoFocus
              className="mt-2 text-lg"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Available: {stock.toFixed(2)} meters
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowQuantityDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDialogConfirm}
              disabled={!quantity || parseFloat(quantity) <= 0 || parseFloat(quantity) > stock}
            >
              Add to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

