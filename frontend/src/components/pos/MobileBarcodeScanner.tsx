"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, CheckCircle2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// @ts-ignore - html5-qrcode types may not be available
import { Html5Qrcode } from "html5-qrcode";
import { soundManager } from "@/lib/sound-manager";

interface MobileBarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  /**
   * If true, keep camera open after successful scan (batch scanning mode)
   * Default: true (for speed)
   */
  batchMode?: boolean;
}

/**
 * Mobile Barcode Scanner - Uses device camera to scan barcodes
 * Supports batch scanning (keep camera open for multiple scans)
 */
export function MobileBarcodeScanner({ 
  onScan, 
  onClose,
  batchMode = true, // Default: Keep camera open for batch scanning
}: MobileBarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanResult, setLastScanResult] = useState<{ success: boolean; barcode: string } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanAreaRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false); // Prevent duplicate scans

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current = null;
          })
          .catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);

      const html5QrCode = new Html5Qrcode("barcode-scanner-container");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }, // Limit scan region for better performance
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // Successfully scanned
          if (isProcessingRef.current) return; // Prevent duplicate scans
          
          isProcessingRef.current = true;
          
          try {
            // Play success sound (same as USB scanner)
            soundManager.playBeep();
            
            // Show visual feedback
            setLastScanResult({ success: true, barcode: decodedText });
            setTimeout(() => setLastScanResult(null), 1000);
            
            // Call the scan handler (same function used by USB scanner)
            await onScan(decodedText);
            
            // If not in batch mode, close after successful scan
            if (!batchMode) {
              setTimeout(() => {
                stopScanning();
                onClose();
              }, 300); // Small delay to show feedback
            }
          } catch (err) {
            console.error('Scan handler error:', err);
            
            // Show error feedback
            soundManager.playError();
            setLastScanResult({ success: false, barcode: decodedText });
            setTimeout(() => setLastScanResult(null), 1000);
          } finally {
            // Reset processing flag after delay (prevent rapid duplicate scans)
            setTimeout(() => {
              isProcessingRef.current = false;
            }, 500);
          }
        },
        (errorMessage) => {
          // Ignore scanning errors (just keep trying)
          // Only log if it's a significant error
          if (errorMessage && !errorMessage.includes('No QR code')) {
            console.debug('Scanner:', errorMessage);
          }
        }
      );
    } catch (err: any) {
      setError(err.message || "Kamerani ochib bo'lmadi");
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsScanning(false);
    setError(null);
    setLastScanResult(null);
    if (scanAreaRef.current) {
      scanAreaRef.current.innerHTML = "";
    }
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Barcode skanerlash</DialogTitle>
        </DialogHeader>

        <div className="relative">
          {/* Scanner Container */}
          <div
            id="barcode-scanner-container"
            ref={scanAreaRef}
            className="w-full aspect-square bg-black relative overflow-hidden"
          />

          {/* Overlay with scanning guide */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="border-2 border-blue-500 rounded-lg w-64 h-64 flex items-center justify-center relative">
              <div className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded">
                Barcode'ni quti ichiga qo'ying
              </div>
            </div>
          </div>

          {/* Scan Result Indicator */}
          {lastScanResult && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`${
                  lastScanResult.success
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                } px-6 py-4 rounded-lg shadow-xl flex items-center gap-2 z-10`}
              >
                {lastScanResult.success ? (
                  <>
                    <CheckCircle2 className="h-6 w-6" />
                    <span className="font-semibold text-lg">Scanned: {lastScanResult.barcode}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6" />
                    <span className="font-semibold text-lg">Not Found</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="absolute bottom-4 left-4 right-4 bg-red-500 text-white p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-4 pb-4 space-y-2">
          {!isScanning ? (
            <Button
              onClick={startScanning}
              className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Camera className="mr-2 h-5 w-5" />
              Skanerlashni boshlash
            </Button>
          ) : (
            <>
              {batchMode && (
                <div className="text-center text-sm text-gray-600 dark:text-gray-400 py-2">
                  📸 Batch scanning: Camera will stay open
                </div>
              )}
              <Button
                onClick={stopScanning}
                variant="outline"
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                To'xtatish
              </Button>
            </>
          )}

          <Button
            onClick={handleClose}
            variant="ghost"
            className="w-full h-11"
          >
            <X className="mr-2 h-4 w-4" />
            Yopish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
