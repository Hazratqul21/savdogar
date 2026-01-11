"use client";

import { forwardRef, useEffect, useState } from "react";

interface ReceiptItem {
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
    sku?: string;
}

interface ReceiptData {
    receipt_number: string;
    date: string;
    time: string;
    cashier_name: string;
    
    // Do'kon ma'lumotlari
    store_name: string;
    store_address?: string;
    store_phone?: string;
    
    // Mahsulotlar
    items: ReceiptItem[];
    
    // Hisob-kitob
    subtotal: number;
    discount_amount?: number;
    tax_amount?: number;
    service_charge?: number;
    total: number;
    
    // To'lov
    payment_method: string;
    amount_paid?: number;
    change?: number;
    
    // Mijoz (agar bor bo'lsa)
    customer_name?: string;
    customer_phone?: string;
    
    // QR kod uchun
    qr_data?: string;
}

interface ReceiptPrintProps {
    data: ReceiptData;
    onPrintComplete?: () => void;
}

// Format currency
function formatCurrency(value: number): string {
    return value.toLocaleString('uz-UZ');
}

// Payment method labels
const PAYMENT_LABELS: Record<string, string> = {
    cash: "Naqd",
    card: "Karta",
    transfer: "O'tkazma",
    debt: "Nasiya",
    payme: "Payme",
    click: "Click",
    mixed: "Aralash",
};

export const ReceiptPrint = forwardRef<HTMLDivElement, ReceiptPrintProps>(
    ({ data, onPrintComplete }, ref) => {
        const [isPrinting, setIsPrinting] = useState(false);

        // Print function
        const handlePrint = () => {
            setIsPrinting(true);
            window.print();
            setTimeout(() => {
                setIsPrinting(false);
                onPrintComplete?.();
            }, 1000);
        };

        return (
            <div
                ref={ref}
                className="receipt-container bg-white text-black"
                style={{
                    width: "80mm",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    padding: "10px",
                }}
            >
                {/* Header - Store Info */}
                <div className="text-center mb-4">
                    <h1 className="text-lg font-bold">{data.store_name}</h1>
                    {data.store_address && (
                        <p className="text-xs">{data.store_address}</p>
                    )}
                    {data.store_phone && (
                        <p className="text-xs">Tel: {data.store_phone}</p>
                    )}
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-400 my-2" />

                {/* Receipt Info */}
                <div className="text-xs mb-2">
                    <div className="flex justify-between">
                        <span>Chek №:</span>
                        <span className="font-bold">{data.receipt_number}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Sana:</span>
                        <span>{data.date}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Vaqt:</span>
                        <span>{data.time}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Kassir:</span>
                        <span>{data.cashier_name}</span>
                    </div>
                    {data.customer_name && (
                        <div className="flex justify-between">
                            <span>Mijoz:</span>
                            <span>{data.customer_name}</span>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-400 my-2" />

                {/* Items */}
                <div className="mb-2">
                    <div className="flex justify-between text-xs font-bold mb-1">
                        <span>Tovar</span>
                        <span>Summa</span>
                    </div>
                    {data.items.map((item, index) => (
                        <div key={index} className="mb-1">
                            <div className="text-xs truncate">{item.name}</div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-600">
                                    {item.quantity} x {formatCurrency(item.unit_price)}
                                </span>
                                <span>{formatCurrency(item.total)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-400 my-2" />

                {/* Totals */}
                <div className="text-xs">
                    <div className="flex justify-between">
                        <span>Jami:</span>
                        <span>{formatCurrency(data.subtotal)}</span>
                    </div>
                    {data.discount_amount && data.discount_amount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Chegirma:</span>
                            <span>-{formatCurrency(data.discount_amount)}</span>
                        </div>
                    )}
                    {data.tax_amount && data.tax_amount > 0 && (
                        <div className="flex justify-between">
                            <span>Soliq:</span>
                            <span>{formatCurrency(data.tax_amount)}</span>
                        </div>
                    )}
                    {data.service_charge && data.service_charge > 0 && (
                        <div className="flex justify-between">
                            <span>Xizmat haqi:</span>
                            <span>{formatCurrency(data.service_charge)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-base mt-1 border-t border-gray-300 pt-1">
                        <span>JAMI:</span>
                        <span>{formatCurrency(data.total)} so'm</span>
                    </div>
                </div>

                {/* Payment Info */}
                <div className="border-t border-dashed border-gray-400 my-2" />
                <div className="text-xs">
                    <div className="flex justify-between">
                        <span>To'lov usuli:</span>
                        <span>{PAYMENT_LABELS[data.payment_method] || data.payment_method}</span>
                    </div>
                    {data.amount_paid && (
                        <div className="flex justify-between">
                            <span>Berildi:</span>
                            <span>{formatCurrency(data.amount_paid)} so'm</span>
                        </div>
                    )}
                    {data.change && data.change > 0 && (
                        <div className="flex justify-between font-bold">
                            <span>Qaytim:</span>
                            <span>{formatCurrency(data.change)} so'm</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-dashed border-gray-400 my-2" />
                <div className="text-center text-xs">
                    <p className="font-bold mb-1">Xaridingiz uchun rahmat!</p>
                    <p className="text-gray-500">Savdogar POS</p>
                </div>

                {/* QR Code placeholder */}
                {data.qr_data && (
                    <div className="flex justify-center mt-2">
                        <div 
                            className="w-20 h-20 bg-gray-100 flex items-center justify-center text-xs text-gray-400"
                            style={{ border: "1px solid #ccc" }}
                        >
                            [QR Code]
                        </div>
                    </div>
                )}

                {/* Print styles */}
                <style jsx global>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .receipt-container,
                        .receipt-container * {
                            visibility: visible;
                        }
                        .receipt-container {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 80mm !important;
                        }
                        @page {
                            size: 80mm auto;
                            margin: 0;
                        }
                    }
                `}</style>
            </div>
        );
    }
);

ReceiptPrint.displayName = "ReceiptPrint";

// Helper function to generate receipt data from sale
export function generateReceiptData(
    sale: any,
    storeInfo: { name: string; address?: string; phone?: string },
    cashierName: string
): ReceiptData {
    const now = new Date();
    
    return {
        receipt_number: sale.receipt_number || `R-${sale.id}`,
        date: now.toLocaleDateString('uz-UZ'),
        time: now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        cashier_name: cashierName,
        
        store_name: storeInfo.name,
        store_address: storeInfo.address,
        store_phone: storeInfo.phone,
        
        items: (sale.items || []).map((item: any) => ({
            name: item.product_name || item.variant?.product?.name || "Mahsulot",
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
            sku: item.variant?.sku,
        })),
        
        subtotal: sale.subtotal || sale.total_amount,
        discount_amount: sale.discount_amount,
        tax_amount: sale.tax_amount,
        service_charge: sale.service_charge,
        total: sale.total_amount,
        
        payment_method: sale.payment_method,
        amount_paid: sale.amount_paid,
        change: sale.change_amount,
        
        customer_name: sale.customer?.name,
        customer_phone: sale.customer?.phone,
    };
}

export default ReceiptPrint;
