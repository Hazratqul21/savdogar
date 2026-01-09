import { useEffect, useRef, useCallback } from 'react';

interface UseBarcodeScannerOptions {
  /**
   * Callback when a barcode is scanned
   */
  onScan: (barcode: string) => void;
  
  /**
   * Minimum length for valid barcode (default: 3)
   */
  minLength?: number;
  
  /**
   * Maximum length for valid barcode (default: 50)
   */
  maxLength?: number;
  
  /**
   * Maximum time between keystrokes to consider as rapid input (default: 50ms)
   * Barcode scanners typically input at 10-50ms per character
   */
  maxGap?: number;
  
  /**
   * Timeout to clear buffer if no activity (default: 100ms)
   */
  timeout?: number;
  
  /**
   * Enable/disable the scanner (default: true)
   */
  enabled?: boolean;
  
  /**
   * If true, ignores input when user is focused on input fields (default: true)
   */
  ignoreInputFocus?: boolean;
}

/**
 * HID Barcode Scanner Hook
 * 
 * Detects barcode scans from handheld USB scanners that act as keyboards.
 * 
 * Detection Logic:
 * - Rapid keystrokes: <50ms gap between characters (barcode scanner)
 * - Normal typing: >50ms gap (ignored)
 * - Enter key ends the barcode sequence
 * 
 * Usage:
 * ```tsx
 * useBarcodeScanner({
 *   onScan: (barcode) => {
 *     console.log('Scanned:', barcode);
 *   }
 * });
 * ```
 */
export function useBarcodeScanner({
  onScan,
  minLength = 3,
  maxLength = 50,
  maxGap = 50, // 50ms max gap for rapid input detection
  timeout = 100, // 100ms timeout to clear buffer
  enabled = true,
  ignoreInputFocus = true,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastKeyTimeRef = useRef<number>(0);
  const sequenceStartTimeRef = useRef<number>(0);

  /**
   * Check if active element is an input field (conflict prevention)
   */
  const isInputFocused = useCallback((): boolean => {
    if (!ignoreInputFocus) return false;

    const activeElement = document.activeElement;
    if (!activeElement) return false;

    const tagName = activeElement.tagName.toLowerCase();
    const isInput = tagName === 'input' || tagName === 'textarea';
    const isContentEditable = activeElement.getAttribute('contenteditable') === 'true';

    return isInput || isContentEditable;
  }, [ignoreInputFocus]);

  /**
   * Check if the sequence is rapid enough to be a barcode scan
   */
  const isRapidSequence = useCallback((now: number): boolean => {
    if (bufferRef.current.length === 0) {
      sequenceStartTimeRef.current = now;
      return true; // First key, assume rapid
    }

    const timeSinceLastKey = now - lastKeyTimeRef.current;
    const totalSequenceTime = now - sequenceStartTimeRef.current;
    const avgTimePerChar = totalSequenceTime / (bufferRef.current.length + 1);

    // Rapid if: gap between keys < maxGap AND average time per char < 50ms
    return timeSinceLastKey <= maxGap && avgTimePerChar < 50;
  }, [maxGap]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if disabled
      if (!enabled) return;

      // Conflict prevention: Skip if user is typing in an input field
      if (isInputFocused() && event.key !== 'Enter') {
        // Don't intercept normal typing
        return;
      }

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;

      // Check if sequence is rapid enough (barcode scanner)
      const isRapid = isRapidSequence(now);

      // If too much time passed or not rapid, reset buffer (normal typing)
      if (timeSinceLastKey > maxGap * 2 || !isRapid) {
        bufferRef.current = '';
        sequenceStartTimeRef.current = now;
      }

      lastKeyTimeRef.current = now;

      // Handle Enter key (end of barcode)
      if (event.key === 'Enter') {
        const barcode = bufferRef.current.trim();

        // Only process if we have a valid barcode AND it was a rapid sequence
        if (
          barcode.length >= minLength && 
          barcode.length <= maxLength &&
          isRapidSequence(now)
        ) {
          event.preventDefault();
          event.stopPropagation();
          
          // Valid barcode scan
          onScan(barcode);
        }

        // Always clear buffer on Enter
        bufferRef.current = '';
        sequenceStartTimeRef.current = 0;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        return;
      }

      // Ignore modifier keys (Ctrl, Alt, Shift, Meta)
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        ['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)
      ) {
        return;
      }

      // Ignore function keys (F1-F12)
      if (event.key.startsWith('F') && event.key.length <= 3) {
        return;
      }

      // Ignore navigation keys (arrows, tab, escape)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Escape'].includes(event.key)) {
        return;
      }

      // Add alphanumeric characters to buffer (only if rapid sequence)
      if (event.key.length === 1 && /[0-9a-zA-Z]/.test(event.key)) {
        // Only add if part of rapid sequence
        if (isRapid || bufferRef.current.length === 0) {
          bufferRef.current += event.key;
        } else {
          // Not rapid, reset
          bufferRef.current = event.key;
          sequenceStartTimeRef.current = now;
        }
      } else if (event.key === 'Backspace') {
        bufferRef.current = bufferRef.current.slice(0, -1);
      } else {
        // Non-barcode character, reset if not part of rapid sequence
        if (!isRapid) {
          bufferRef.current = '';
          sequenceStartTimeRef.current = 0;
        }
      }

      // Clear buffer if it gets too long (invalid scan)
      if (bufferRef.current.length > maxLength) {
        bufferRef.current = '';
        sequenceStartTimeRef.current = 0;
      }

      // Set timeout to clear buffer if no more keys come (user stopped typing)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        bufferRef.current = '';
        sequenceStartTimeRef.current = 0;
      }, timeout * 3); // 300ms default
    },
    [onScan, minLength, maxLength, maxGap, timeout, enabled, ignoreInputFocus, isInputFocused, isRapidSequence]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown, true); // Use capture phase for better interception

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleKeyDown, enabled]);
}








