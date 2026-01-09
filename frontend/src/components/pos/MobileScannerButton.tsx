"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileBarcodeScanner } from "./MobileBarcodeScanner";
import { cn } from "@/lib/utils";

interface MobileScannerButtonProps {
  /**
   * Callback when a barcode is scanned
   */
  onScan: (barcode: string) => void;
  
  /**
   * Additional className for the button
   */
  className?: string;
  
  /**
   * Batch scanning mode (keep camera open after scan)
   */
  batchMode?: boolean;
}

/**
 * Mobile Scanner Button Component
 * 
 * Renders a "Scan Barcode" button with camera icon.
 * Only visible on mobile breakpoints (md:hidden by default).
 * Opens camera scanner modal when clicked.
 */
export function MobileScannerButton({ 
  onScan, 
  className,
  batchMode = true,
}: MobileScannerButtonProps) {
  const [showScanner, setShowScanner] = useState(false);

  const handleOpenScanner = () => {
    setShowScanner(true);
  };

  return (
    <>
      {/* Scanner Button - Visible only on mobile */}
      <Button
        onClick={handleOpenScanner}
        className={cn(
          "md:hidden", // Only visible on mobile
          "px-4 py-2 h-12",
          "bg-blue-600 hover:bg-blue-700 text-white",
          "flex items-center justify-center gap-2",
          "min-h-[44px]", // Thumb-friendly
          "transition-colors",
          className
        )}
        aria-label="Scan barcode with camera"
      >
        <Camera className="h-5 w-5 flex-shrink-0" />
        <span className="font-medium hidden sm:inline">Scan</span>
      </Button>

      {/* Camera Scanner Modal */}
      {showScanner && (
        <MobileBarcodeScanner
          onScan={onScan}
          onClose={() => setShowScanner(false)}
          batchMode={batchMode}
        />
      )}
    </>
  );
}
