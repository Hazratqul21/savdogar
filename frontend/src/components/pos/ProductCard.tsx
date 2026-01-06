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
            "h-full cursor-pointer transition-all duration-200",
            "hover:shadow-lg hover:border-primary/50",
            isOutOfStock && "opacity-50 cursor-not-allowed",
            isAdding && "ring-2 ring-primary ring-offset-2"
          )}
          onClick={!isOutOfStock ? handleClick : undefined}
        >
          <CardContent className="p-4 flex flex-col h-full">
            {/* Product Image/Icon */}
            <div className="flex items-center justify-center h-32 mb-3 bg-muted rounded-lg">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>

            {/* Product Info */}
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                {productName}
              </h3>
              
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">
                  {price.toLocaleString()} UZS
                </span>
                {isPlumbing && primaryUnit === "meter" && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    per meter
                  </span>
                )}
              </div>

              {/* Stock Info */}
              <div className="flex items-center justify-between text-xs">
                <span className={cn(
                  "text-muted-foreground",
                  stock < 10 && "text-orange-500",
                  isOutOfStock && "text-red-500"
                )}>
                  Stock: {stock.toFixed(2)} {primaryUnit}
                </span>
                <span className="text-muted-foreground">
                  SKU: {variant.sku}
                </span>
              </div>
            </div>

            {/* Add Button */}
            <Button
              className="w-full mt-3"
              size="lg"
              disabled={isOutOfStock || isAdding}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </Button>
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

