"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// @ts-ignore - html5-qrcode types may not be available
import { Html5Qrcode } from "html5-qrcode";

interface MobileBarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

/**
 * Mobile Barcode Scanner - Uses device camera to scan barcodes
 * Only for mobile devices (no USB scanner available)
 */
export function MobileBarcodeScanner({ onScan, onClose }: MobileBarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanAreaRef = useRef<HTMLDivElement>(null);

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
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Successfully scanned
          onScan(decodedText);
          stopScanning();
          onClose();
        },
        (errorMessage) => {
          // Ignore scanning errors (just keep trying)
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
      setIsScanning(false);
      setError(null);
      if (scanAreaRef.current) {
        scanAreaRef.current.innerHTML = "";
      }
    } catch (err) {
      console.error("Error stopping scanner:", err);
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
            <div className="border-2 border-blue-500 rounded-lg w-64 h-64 flex items-center justify-center">
              <div className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded">
                Barcode'ni quti ichiga qo'ying
              </div>
            </div>
          </div>

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
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              <Camera className="mr-2 h-5 w-5" />
              Skanerlashni boshlash
            </Button>
          ) : (
            <Button
              onClick={stopScanning}
              variant="outline"
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              To'xtatish
            </Button>
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
