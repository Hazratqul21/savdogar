"use client";

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScanIndicatorProps {
  /**
   * Show success indicator (green flash)
   */
  success?: boolean;
  
  /**
   * Show error indicator (red flash)
   */
  error?: boolean;
  
  /**
   * Duration to show indicator in milliseconds (default: 1000ms)
   */
  duration?: number;
}

/**
 * Scan Indicator Component
 * 
 * Visual feedback for barcode scans:
 * - Green flash on successful scan
 * - Red flash on error/not found
 */
export function ScanIndicator({ success, error, duration = 1000 }: ScanIndicatorProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (success || error) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [success, error, duration]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="fixed top-4 right-4 z-50"
        >
          {success && (
            <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Scan Success</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Product Not Found</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
