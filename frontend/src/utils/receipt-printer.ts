/**
 * Receipt Printing Utility for Xprinter XP-58
 * Handles auto-print functionality using browser native print
 */

import { ReceiptData } from "@/components/pos/ReceiptTemplate";
import { ReceiptTemplate } from "@/components/pos/ReceiptTemplate";
import { createRoot } from "react-dom/client";

/**
 * Print receipt using browser native print dialog
 * Creates a temporary React component, renders it, and triggers print
 * 
 * @param data - Receipt data to print
 * @returns Promise that resolves when print dialog is closed
 */
export async function printReceipt(data: ReceiptData): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Remove any existing print container
      const existing = document.getElementById("receipt-print-container");
      if (existing) {
        existing.remove();
      }

      // Create a temporary container for the receipt
      const printContainer = document.createElement("div");
      printContainer.id = "receipt-print-container";
      printContainer.className = "receipt-container";
      printContainer.style.position = "absolute";
      printContainer.style.left = "-9999px";
      printContainer.style.top = "0";
      printContainer.style.width = "58mm";
      printContainer.style.maxWidth = "58mm";
      document.body.appendChild(printContainer);

      // Render receipt component
      const root = createRoot(printContainer);
      root.render(<ReceiptTemplate data={data} />);

      // Wait for render, then print
      setTimeout(() => {
        // Trigger print dialog
        window.print();

        // Cleanup after print dialog closes
        // Note: We can't detect when print dialog closes, so we use a timeout
        setTimeout(() => {
          try {
            root.unmount();
            if (printContainer.parentNode) {
              printContainer.parentNode.removeChild(printContainer);
            }
          } catch (e) {
            // Ignore cleanup errors
          }
          resolve();
        }, 2000);
      }, 200);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Prepare receipt data from sale object
 */
export function prepareReceiptData(
  sale: any,
  tenantInfo?: any,
  customerInfo?: any
): ReceiptData {
  const orderType: "retail" | "wholesale" =
    sale.payment_method === "debt" || customerInfo ? "wholesale" : "retail";

  // Format items
  const items = (sale.items || []).map((item: any) => ({
    name: item.variant?.product?.name || item.product?.name || "Mahsulot",
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.total,
    unit: item.variant?.primary_unit || "dona",
  }));

  // Calculate payment received and change
  let paymentReceived: number | undefined;
  let change: number | undefined;

  if (sale.payment_method === "cash" && sale.total_amount) {
    // For cash, assume exact payment (can be customized)
    paymentReceived = sale.total_amount;
    change = 0;
  }

  // Wholesale debt calculations
  let previousDebt: number | undefined;
  let newBalance: number | undefined;
  let paymentMade: number | undefined;
  let currentPurchase: number | undefined;

  if (orderType === "wholesale" && customerInfo) {
    previousDebt = Math.abs(customerInfo.balance || 0);
    currentPurchase = sale.total_amount;
    
    if (sale.payment_method === "debt") {
      paymentMade = 0;
      newBalance = previousDebt + sale.total_amount;
    } else {
      paymentMade = sale.total_amount;
      newBalance = previousDebt - sale.total_amount;
    }
  }

  const receiptData: ReceiptData = {
    // Store Info
    store_name: tenantInfo?.name || "Savdo-Gar",
    store_address: tenantInfo?.address,
    store_phone: tenantInfo?.phone,

    // Sale Info
    receipt_number: sale.receipt_number || `#${sale.id}`,
    date: sale.created_at || new Date().toISOString(),
    time: new Date(sale.created_at || Date.now()).toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    cashier_name: sale.cashier?.full_name || sale.cashier?.username,

    // Items
    items,

    // Totals
    subtotal: sale.subtotal || sale.total_amount,
    tax_amount: sale.tax_amount || 0,
    discount_amount: sale.discount_amount || 0,
    service_charge: sale.service_charge || 0,
    total: sale.total_amount,

    // Payment
    payment_method: sale.payment_method,
    payment_received: paymentReceived,
    change,

    // Mode
    order_type: orderType,

    // Wholesale-specific
    customer_name: customerInfo?.name,
    previous_debt: previousDebt,
    current_purchase: currentPurchase,
    payment_made: paymentMade,
    new_balance: newBalance,
  };

  return receiptData;
}
