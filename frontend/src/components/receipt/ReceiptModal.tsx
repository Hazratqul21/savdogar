"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer, Download, CheckCircle } from "lucide-react";
import { ReceiptPrint, generateReceiptData } from "./ReceiptPrint";

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: any;
    storeInfo: {
        name: string;
        address?: string;
        phone?: string;
    };
    cashierName: string;
    autoPrint?: boolean;
}

export function ReceiptModal({
    isOpen,
    onClose,
    sale,
    storeInfo,
    cashierName,
    autoPrint = false,
}: ReceiptModalProps) {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [printed, setPrinted] = useState(false);

    const receiptData = sale ? generateReceiptData(sale, storeInfo, cashierName) : null;

    // Auto print if enabled
    useEffect(() => {
        if (isOpen && autoPrint && receiptData && !printed) {
            const timer = setTimeout(() => {
                handlePrint();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoPrint, receiptData, printed]);

    const handlePrint = () => {
        if (receiptRef.current) {
            window.print();
            setPrinted(true);
        }
    };

    const handleClose = () => {
        setPrinted(false);
        onClose();
    };

    if (!isOpen || !receiptData) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-2xl w-full max-w-md my-8 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-2">
                            {printed && <CheckCircle className="w-5 h-5 text-green-500" />}
                            <h2 className="text-lg font-semibold text-gray-900">
                                {printed ? "Chek chop etildi" : "Chek"}
                            </h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Receipt Preview */}
                    <div className="p-4 bg-gray-100 flex justify-center">
                        <div className="bg-white shadow-lg">
                            <ReceiptPrint ref={receiptRef} data={receiptData} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 p-4 border-t">
                        <button
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Yopish
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            {printed ? "Qayta chop etish" : "Chop etish"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default ReceiptModal;
