"use client";

import { useCallback, useRef } from 'react';
import { usePosState } from '@/stores/pos-state';
import { useBarcodeScanner } from './useBarcodeScanner';
import { searchProductsByBarcode, searchProductsBySku } from '@/lib/api-pos';
import { soundManager } from '@/lib/sound-manager';
import { useToast } from './useToast';

interface UseScanToCartOptions {
  /**
   * Enable/disable scan-to-cart functionality
   */
  enabled?: boolean;
  
  /**
   * Callback when product is successfully added to cart
   */
  onProductAdded?: (variant: any) => void;
  
  /**
   * Callback when product is not found
   */
  onProductNotFound?: (barcode: string) => void;
  
  /**
   * Callback on error
   */
  onError?: (error: Error) => void;
}

/**
 * Global Scan-to-Cart Hook
 * 
 * Automatically adds scanned products to cart:
 * 1. Listens for barcode scans (rapid numeric input + Enter)
 * 2. Searches for product by barcode/SKU
 * 3. Auto-adds to cart if found (increments quantity if already in cart)
 * 4. Plays success beep on found, error buzzer on not found
 * 5. Shows toast notifications
 * 
 * Conflict Prevention:
 * - Disables auto-add when user is typing in input fields
 * - Only processes rapid sequences (<100ms between keys)
 */
export function useScanToCart(options: UseScanToCartOptions = {}) {
  const {
    enabled = true,
    onProductAdded,
    onProductNotFound,
    onError,
  } = options;

  const { addToCart, tenantId } = usePosState();
  const { success, error: showErrorToast } = useToast(); // Renamed to avoid conflict with onError callback
  const isProcessingRef = useRef(false);

  /**
   * Handle barcode scan: search and add to cart
   */
  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      // Prevent concurrent scans
      if (isProcessingRef.current) {
        return;
      }

      if (!tenantId) {
        showErrorToast('Tenant ID not set. Please select a business first.');
        return;
      }

      isProcessingRef.current = true;

      try {
        // Step 1: Search by barcode
        let variant = await searchProductsByBarcode(barcode, tenantId);

        // Step 2: If not found, try SKU search
        if (!variant) {
          variant = await searchProductsBySku(barcode, tenantId);
        }

        // Step 3: Handle result
        if (variant) {
          // Found: Auto-add to cart (increment quantity if already exists)
          addToCart(variant, 1);
          
          // Play success beep
          soundManager.playBeep();
          
          // Show success toast
          const productName = variant.product?.name || variant.sku || 'Product';
          success(`${productName} qo'shildi`);
          
          // Callback
          onProductAdded?.(variant);
        } else {
          // Not found: Play error sound and show toast
          soundManager.playError();
          
          // Show error toast with truncated barcode
          const truncatedBarcode = barcode.length > 8 
            ? `${barcode.substring(0, 8)}...` 
            : barcode;
          showErrorToast(`Mahsulot topilmadi: ${truncatedBarcode}`);
          
          // Callback
          onProductNotFound?.(barcode);
        }
      } catch (err) {
        // Error handling
        const errorObj = err instanceof Error ? err : new Error(String(err));
        console.error('Scan-to-cart error:', errorObj);
        
        soundManager.playError();
        showErrorToast('Xatolik: Mahsulotni qidirishda muammo yuz berdi');
        
        // Callback
        onError?.(errorObj);
      } finally {
        // Reset processing flag after a short delay (prevent double scans)
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 100);
      }
    },
    [tenantId, addToCart, success, showErrorToast, onProductAdded, onProductNotFound, onError]
  );

  // Use enhanced barcode scanner
  useBarcodeScanner({
    onScan: handleBarcodeScan,
    minLength: 3,
    maxLength: 50,
    timeout: 100, // 100ms gap detection
    enabled,
    ignoreInputFocus: true, // Prevent conflicts with input fields
  });
}
