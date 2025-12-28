import { useCallback } from 'react';
import { useBarcodeScanner } from './useBarcodeScanner';
import { searchProductsByBarcode, searchProductsBySku } from '@/lib/api-pos';
import { usePosState } from '@/stores/pos-state';
import { soundManager } from '@/lib/sound-manager';
import type { ProductVariant } from '@/stores/pos-state';

interface UseSmartScannerOptions {
  onScan?: (variant: ProductVariant, isPack: boolean) => void;
  onError?: (barcode: string) => void;
}

/**
 * Smart Scanner Hook with Pack Logic
 * Detects if scanned item is a "Pack" and auto-sets quantity
 */
export function useSmartScanner(options: UseSmartScannerOptions = {}) {
  const { tenantId, addToCart } = usePosState();

  const handleScan = useCallback(
    async (barcode: string) => {
      if (!tenantId) return;

      try {
        // Try to parse QR code data (if it's JSON)
        let variant: ProductVariant | null = null;
        let isPack = false;
        let packQuantity = 1;

        try {
          const qrData = JSON.parse(barcode);
          if (qrData.s) {
            // QR contains SKU
            variant = await searchProductsBySku(qrData.s, tenantId);
            if (qrData.p && qrData.p > 1) {
              // Pack quantity in QR
              isPack = true;
              packQuantity = qrData.p;
            }
          } else if (qrData.v) {
            // QR contains variant ID
            const products = await searchProductsBySku('', tenantId); // Will search all
            // Find by variant ID (would need API endpoint for this)
            // For now, fallback to barcode search
            variant = await searchProductsByBarcode(barcode, tenantId);
          }
        } catch {
          // Not JSON, treat as plain barcode
          variant = await searchProductsByBarcode(barcode, tenantId);
        }

        // If not found by barcode, try SKU search
        if (!variant && barcode.length > 0) {
          variant = await searchProductsBySku(barcode, tenantId);
        }

        if (!variant) {
          soundManager.playError();
          options.onError?.(barcode);
          return;
        }

        // Check if variant is a "Pack" based on attributes
        // Pack detection logic:
        // 1. Check if attributes contain "pack_size" or "pack_qty"
        // 2. Check if SKU contains "PACK" or "BOX"
        const attributes = variant.attributes || {};
        const packSize = attributes.pack_size || attributes.pack_qty || attributes.packSize;

        if (packSize && packSize > 1) {
          isPack = true;
          packQuantity = packSize;
        } else if (
          variant.sku.toUpperCase().includes('PACK') ||
          variant.sku.toUpperCase().includes('BOX') ||
          variant.sku.toUpperCase().includes('PK')
        ) {
          // Try to extract pack size from SKU (e.g., "ITEM-PACK-50")
          const match = variant.sku.match(/(\d+)/);
          if (match) {
            const extractedQty = parseInt(match[1]);
            if (extractedQty > 1 && extractedQty < 1000) {
              isPack = true;
              packQuantity = extractedQty;
            }
          }
        }

        // Add to cart with pack quantity if it's a pack
        if (isPack) {
          addToCart(variant, packQuantity);
          soundManager.playDoubleBeep(); // Double beep for pack
          options.onScan?.(variant, true);
        } else {
          addToCart(variant, 1);
          soundManager.playBeep(); // Single beep for regular item
          options.onScan?.(variant, false);
        }
      } catch (error) {
        console.error('Scan error:', error);
        soundManager.playError();
        options.onError?.(barcode);
      }
    },
    [tenantId, addToCart, options]
  );

  useBarcodeScanner({
    onScan: handleScan,
    minLength: 3,
    maxLength: 100, // QR codes can be longer
    timeout: 150, // Slightly longer timeout for QR codes
  });
}








