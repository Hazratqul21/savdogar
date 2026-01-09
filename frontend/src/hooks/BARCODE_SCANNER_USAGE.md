# Barcode Scanner Hook - Usage Guide

## Overview

The `useBarcodeScanner` hook detects barcode scans from handheld USB scanners that act as keyboards (HID mode).

## Detection Logic

- **Rapid Input Detection**: <50ms gap between keystrokes (typical barcode scanner speed)
- **Normal Typing**: >50ms gap (ignored)
- **Sequence End**: Enter key ends the barcode sequence

## Basic Usage

```tsx
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

function MyPOSComponent() {
  useBarcodeScanner({
    onScan: (barcode) => {
      console.log('Scanned:', barcode);
      // Handle the scan...
    }
  });

  return <div>...</div>;
}
```

## Full Integration Example (Scan-to-Cart)

```tsx
"use client";

import { useState } from 'react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { usePosState } from '@/stores/pos-state';
import { searchProductsByBarcode, searchProductsBySku } from '@/lib/api-pos';
import { soundManager } from '@/lib/sound-manager';
import { ScanIndicator } from '@/components/pos/ScanIndicator';
import { useToast } from '@/hooks/useToast';

export function POSPage() {
  const { addToCart, tenantId } = usePosState();
  const { error: showErrorToast } = useToast();
  
  // Scan indicator state
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanError, setScanError] = useState(false);

  // HID Barcode Scanner: Listen for USB scanner input
  useBarcodeScanner({
    onScan: async (barcode) => {
      try {
        if (!tenantId) {
          soundManager.playError();
          setScanError(true);
          setTimeout(() => setScanError(false), 1000);
          return;
        }

        // Search by barcode first, then SKU
        let variant = await searchProductsByBarcode(barcode, tenantId);
        if (!variant) {
          variant = await searchProductsBySku(barcode, tenantId);
        }

        if (variant) {
          // Found: Auto-add to cart
          addToCart(variant, 1);
          
          // Visual feedback: Green flash
          setScanSuccess(true);
          setTimeout(() => setScanSuccess(false), 1000);
          
          // Audio feedback: Success beep
          soundManager.playBeep();
        } else {
          // Not found: Visual feedback: Red flash
          setScanError(true);
          setTimeout(() => setScanError(false), 1000);
          
          // Audio feedback: Error buzzer
          soundManager.playError();
          
          // Show toast
          showErrorToast(`Product not found: ${barcode.substring(0, 8)}...`);
        }
      } catch (error) {
        console.error('Scan error:', error);
        setScanError(true);
        setTimeout(() => setScanError(false), 1000);
        soundManager.playError();
      }
    },
    enabled: true,
    maxGap: 50, // 50ms max gap for rapid input
    ignoreInputFocus: true, // Don't intercept when typing in input fields
  });

  return (
    <div>
      {/* Scan Indicator - Visual feedback */}
      <ScanIndicator success={scanSuccess} error={scanError} />
      
      {/* Your POS UI */}
    </div>
  );
}
```

## Hook Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onScan` | `(barcode: string) => void` | **Required** | Callback when barcode is scanned |
| `minLength` | `number` | `3` | Minimum barcode length |
| `maxLength` | `number` | `50` | Maximum barcode length |
| `maxGap` | `number` | `50` | Max time between keys (ms) for rapid detection |
| `timeout` | `number` | `100` | Timeout to clear buffer (ms) |
| `enabled` | `boolean` | `true` | Enable/disable scanner |
| `ignoreInputFocus` | `boolean` | `true` | Ignore when input fields are focused |

## Features

✅ **Rapid Detection**: Detects scans at 10-50ms per character  
✅ **Conflict Prevention**: Ignores input when user is typing  
✅ **Sound Feedback**: Success beep / Error buzzer  
✅ **Visual Feedback**: Green flash on success, red flash on error  
✅ **Toast Notifications**: Shows success/error messages  

## Integration Points

The hook is already integrated in:
- `components/pos/views/ScannerView.tsx`
- `components/pos/views/VisualGridView.tsx`
- `components/pos/AdaptivePosLayout.tsx`
