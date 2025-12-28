import { useEffect, useRef, useCallback } from 'react';

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minLength?: number;
  maxLength?: number;
  timeout?: number; // Time between keystrokes to consider as barcode scan
}

/**
 * Hook for detecting barcode scanner input
 * Barcode scanners typically send rapid keystrokes ending with Enter
 */
export function useBarcodeScanner({
  onScan,
  minLength = 3,
  maxLength = 50,
  timeout = 100, // 100ms between keystrokes
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastKeyTimeRef = useRef<number>(0);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;

      // If too much time passed, reset buffer (not a barcode scan)
      if (timeSinceLastKey > timeout) {
        bufferRef.current = '';
      }

      lastKeyTimeRef.current = now;

      // Handle Enter key (end of barcode)
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();

        const barcode = bufferRef.current.trim();

        if (barcode.length >= minLength && barcode.length <= maxLength) {
          // Valid barcode
          onScan(barcode);
        }

        bufferRef.current = '';
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        return;
      }

      // Ignore modifier keys
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        event.key === 'Shift' ||
        event.key === 'Control' ||
        event.key === 'Alt' ||
        event.key === 'Meta'
      ) {
        return;
      }

      // Ignore function keys (F1-F12) unless they're part of the barcode
      if (event.key.startsWith('F') && event.key.length <= 3) {
        return;
      }

      // Add character to buffer
      if (event.key.length === 1) {
        bufferRef.current += event.key;
      } else if (event.key === 'Backspace') {
        bufferRef.current = bufferRef.current.slice(0, -1);
      }

      // Clear buffer if it gets too long
      if (bufferRef.current.length > maxLength) {
        bufferRef.current = '';
      }

      // Set timeout to clear buffer if no more keys come
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        bufferRef.current = '';
      }, timeout);
    },
    [onScan, minLength, maxLength, timeout]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleKeyDown]);
}








