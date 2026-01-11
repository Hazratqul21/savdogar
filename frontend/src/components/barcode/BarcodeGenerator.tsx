"use client";

import { useRef, useEffect, useState } from "react";
import { Printer, Copy, Check, X } from "lucide-react";

interface BarcodeGeneratorProps {
    value: string;
    width?: number;
    height?: number;
    productName?: string;
    price?: number;
    showPrintButton?: boolean;
}

/**
 * Simple Barcode Generator using Canvas
 * Generates Code 128 style barcodes
 */
export function BarcodeGenerator({
    value,
    width = 200,
    height = 60,
    productName,
    price,
    showPrintButton = true
}: BarcodeGeneratorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!canvasRef.current || !value) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);

        // Simple barcode pattern (Code 39 style)
        const chars = value.toUpperCase().split("");
        const barWidth = Math.floor(width / (chars.length * 12 + 12));
        const barHeight = height - 20;

        ctx.fillStyle = "black";

        let x = 5;

        // Start pattern
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x, 5, barWidth, barHeight);
            x += barWidth * 2;
        }

        // Character bars (simplified pattern)
        chars.forEach((char) => {
            const code = char.charCodeAt(0);
            const pattern = [
                (code >> 7) & 1,
                (code >> 6) & 1,
                (code >> 5) & 1,
                (code >> 4) & 1,
                (code >> 3) & 1,
                (code >> 2) & 1,
                (code >> 1) & 1,
                code & 1,
            ];

            pattern.forEach((bit, i) => {
                if (bit || i % 2 === 0) {
                    ctx.fillRect(x, 5, barWidth, barHeight);
                }
                x += barWidth;
            });
        });

        // End pattern
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x, 5, barWidth, barHeight);
            x += barWidth * 2;
        }

        // Draw barcode value text
        ctx.fillStyle = "black";
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.fillText(value, width / 2, height - 3);

    }, [value, width, height]);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL("image/png");

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Barcode - ${value}</title>
                <style>
                    body { margin: 0; padding: 20px; }
                    .barcode-container {
                        display: inline-block;
                        border: 1px solid #ddd;
                        padding: 10px;
                        text-align: center;
                        margin: 5px;
                    }
                    .product-name {
                        font-family: Arial, sans-serif;
                        font-size: 12px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .price {
                        font-family: Arial, sans-serif;
                        font-size: 14px;
                        font-weight: bold;
                        margin-top: 5px;
                    }
                    @media print {
                        .barcode-container {
                            page-break-inside: avoid;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="barcode-container">
                    ${productName ? `<div class="product-name">${productName}</div>` : ""}
                    <img src="${dataUrl}" alt="Barcode" />
                    ${price ? `<div class="price">${price.toLocaleString('uz-UZ')} so'm</div>` : ""}
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="inline-flex flex-col items-center">
            {productName && (
                <div className="text-xs font-medium text-gray-700 mb-1 truncate max-w-[200px]">
                    {productName}
                </div>
            )}
            
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="bg-white border rounded"
            />
            
            {price !== undefined && (
                <div className="text-sm font-bold text-gray-900 mt-1">
                    {price.toLocaleString('uz-UZ')} so'm
                </div>
            )}

            {showPrintButton && (
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        title="Nusxa olish"
                    >
                        {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Nusxalandi" : "Nusxa"}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                        title="Chop etish"
                    >
                        <Printer className="w-3 h-3" />
                        Chop etish
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Generate a random barcode value
 */
export function generateBarcode(prefix: string = ""): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `${prefix}${timestamp}${random}`;
}

/**
 * Generate EAN-13 format barcode
 */
export function generateEAN13(): string {
    let code = "200"; // Internal use prefix
    for (let i = 0; i < 9; i++) {
        code += Math.floor(Math.random() * 10);
    }
    
    // Calculate check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    return code + checkDigit;
}

export default BarcodeGenerator;
