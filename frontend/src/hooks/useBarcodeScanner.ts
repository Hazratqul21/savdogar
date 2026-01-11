/**
 * Barcode Scanner Hook
 * ====================
 * USB/Bluetooth barcode skanerlarni qo'llab-quvvatlash.
 * Skaner klaviatura orqali raqamlarni tez-tez yuboradi va oxirida Enter bosadi.
 */
import { useState, useEffect, useCallback, useRef } from "react";

interface UseBarcodeSccannerOptions {
    onScan: (barcode: string) => void;
    enabled?: boolean;
    minLength?: number;    // Minimal barcode uzunligi
    maxTime?: number;      // Maksimal vaqt (ms) raqamlar orasida
    maxGap?: number;       // Alias for maxTime
    endKey?: string;       // Oxirgi tugma (Enter)
    ignoreInputFocus?: boolean;  // Input field da skaner ishlamasin
}

export function useBarcodeScanner({
    onScan,
    enabled = true,
    minLength = 4,
    maxTime,
    maxGap = 50,
    endKey = "Enter",
    ignoreInputFocus = false
}: UseBarcodeSccannerOptions) {
    // Use maxGap as alias for maxTime
    const effectiveMaxTime = maxTime ?? maxGap;
    const [isScanning, setIsScanning] = useState(false);
    const bufferRef = useRef<string>("");
    const lastKeyTimeRef = useRef<number>(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const clearBuffer = useCallback(() => {
        bufferRef.current = "";
        setIsScanning(false);
    }, []);
    
    const processBarcode = useCallback((barcode: string) => {
        if (barcode.length >= minLength) {
            // Filter out only digits and some special chars commonly in barcodes
            const cleanBarcode = barcode.replace(/[^0-9a-zA-Z-]/g, "");
            if (cleanBarcode.length >= minLength) {
                onScan(cleanBarcode);
            }
        }
        clearBuffer();
    }, [onScan, minLength, clearBuffer]);
    
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;
        
        const now = Date.now();
        const timeDiff = now - lastKeyTimeRef.current;
        lastKeyTimeRef.current = now;
        
        // Clear timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        // If too much time passed, reset buffer (manual typing)
        if (timeDiff > effectiveMaxTime && bufferRef.current.length > 0 && !isScanning) {
            clearBuffer();
        }
        
        // End key detected
        if (event.key === endKey) {
            if (bufferRef.current.length >= minLength) {
                event.preventDefault();
                processBarcode(bufferRef.current);
            } else {
                clearBuffer();
            }
            return;
        }
        
        // Only accept printable characters
        if (event.key.length === 1) {
            // Check if we're in an input field and user is typing normally
            const target = event.target as HTMLElement;
            const isInputField = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
            
            // If ignoreInputFocus is true and we're in input, skip
            if (ignoreInputFocus && isInputField) {
                return;
            }
            
            // If typing slowly in input field, it's not a scanner
            if (isInputField && timeDiff > 100) {
                return;
            }
            
            // Start scanning
            if (bufferRef.current.length === 0) {
                setIsScanning(true);
            }
            
            bufferRef.current += event.key;
            
            // Set timeout to clear if no more keys
            timeoutRef.current = setTimeout(() => {
                // If we have a valid barcode length, process it
                if (bufferRef.current.length >= minLength) {
                    processBarcode(bufferRef.current);
                } else {
                    clearBuffer();
                }
            }, effectiveMaxTime * 3);
        }
    }, [enabled, effectiveMaxTime, minLength, endKey, isScanning, processBarcode, clearBuffer, ignoreInputFocus]);
    
    useEffect(() => {
        if (enabled) {
            window.addEventListener("keydown", handleKeyDown);
            return () => {
                window.removeEventListener("keydown", handleKeyDown);
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
            };
        }
    }, [handleKeyDown, enabled]);
    
    return {
        isScanning,
        clearBuffer
    };
}

export default useBarcodeScanner;
