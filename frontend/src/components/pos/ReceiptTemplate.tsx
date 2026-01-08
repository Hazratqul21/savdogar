"use client";

import "@/styles/receipt-print.css";

/**
 * Receipt Template for Xprinter XP-58 (58mm thermal printer)
 * Supports RETAIL and WHOLESALE modes
 */

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  unit?: string;
}

export interface ReceiptData {
  // Store Info
  store_name: string;
  store_address?: string;
  store_phone?: string;
  
  // Sale Info
  receipt_number?: string;
  date: string;
  time: string;
  cashier_name?: string;
  
  // Items
  items: ReceiptItem[];
  
  // Totals
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  service_charge?: number;
  total: number;
  
  // Payment
  payment_method: string;
  payment_received?: number;
  change?: number;
  
  // Mode
  order_type: "retail" | "wholesale";
  
  // Wholesale-specific
  customer_name?: string;
  previous_debt?: number;
  current_purchase?: number;
  payment_made?: number;
  new_balance?: number;
}

interface ReceiptTemplateProps {
  data: ReceiptData;
}

export function ReceiptTemplate({ data }: ReceiptTemplateProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  const isWholesale = data.order_type === "wholesale";

  return (
    <div className="receipt-container">
      {/* Store Header */}
      <div className="receipt-header">
        <div className="store-name">{data.store_name}</div>
        {data.store_address && (
          <div className="store-address">{data.store_address}</div>
        )}
        {data.store_phone && (
          <div className="store-phone">{data.store_phone}</div>
        )}
      </div>

      <div className="receipt-divider" />

      {/* Sale Info */}
      <div className="receipt-info">
        {data.receipt_number && (
          <div className="info-row">
            <span>Chek №:</span>
            <span>{data.receipt_number}</span>
          </div>
        )}
        <div className="info-row">
          <span>Sana:</span>
          <span>{formatDate(data.date)}</span>
        </div>
        <div className="info-row">
          <span>Vaqt:</span>
          <span>{formatTime(data.time)}</span>
        </div>
        {data.cashier_name && (
          <div className="info-row">
            <span>Kassir:</span>
            <span>{data.cashier_name}</span>
          </div>
        )}
      </div>

      <div className="receipt-divider" />

      {/* Wholesale: Customer Info */}
      {isWholesale && data.customer_name && (
        <>
          <div className="customer-section">
            <div className="customer-name">Mijoz: {data.customer_name}</div>
          </div>
          <div className="receipt-divider" />
        </>
      )}

      {/* Items List */}
      <div className="items-section">
        <div className="items-header">
          <span>Mahsulot</span>
          <span>Summa</span>
        </div>
        {data.items.map((item, index) => (
          <div key={index} className="item-row">
            <div className="item-name">
              {item.name}
              {item.unit && ` (${item.unit})`}
            </div>
            <div className="item-details">
              {item.quantity} × {formatCurrency(item.unit_price)} ={" "}
              {formatCurrency(item.total)}
            </div>
          </div>
        ))}
      </div>

      <div className="receipt-divider" />

      {/* Totals */}
      <div className="totals-section">
        <div className="total-row">
          <span>Jami:</span>
          <span>{formatCurrency(data.subtotal)} so'm</span>
        </div>
        {data.discount_amount > 0 && (
          <div className="total-row discount">
            <span>Chegirma:</span>
            <span>-{formatCurrency(data.discount_amount)} so'm</span>
          </div>
        )}
        {data.tax_amount > 0 && (
          <div className="total-row">
            <span>Soliq:</span>
            <span>{formatCurrency(data.tax_amount)} so'm</span>
          </div>
        )}
        {data.service_charge && data.service_charge > 0 && (
          <div className="total-row">
            <span>Xizmat haqi:</span>
            <span>{formatCurrency(data.service_charge)} so'm</span>
          </div>
        )}
        <div className="total-row final-total">
          <span>TO'LOV:</span>
          <span>{formatCurrency(data.total)} so'm</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="receipt-divider" />
      <div className="payment-section">
        <div className="info-row">
          <span>To'lov usuli:</span>
          <span>
            {data.payment_method === "cash"
              ? "Naqd"
              : data.payment_method === "card"
              ? "Karta"
              : data.payment_method === "debt"
              ? "Qarz"
              : data.payment_method}
          </span>
        </div>
        {data.payment_received && (
          <div className="info-row">
            <span>To'landi:</span>
            <span>{formatCurrency(data.payment_received)} so'm</span>
          </div>
        )}
        {data.change && data.change > 0 && (
          <div className="info-row">
            <span>Qaytim:</span>
            <span>{formatCurrency(data.change)} so'm</span>
          </div>
        )}
      </div>

      {/* Wholesale: Debt Info */}
      {isWholesale && (
        <>
          <div className="receipt-divider" />
          <div className="debt-section">
            <div className="debt-row">
              <span>Eski qarz:</span>
              <span>{formatCurrency(data.previous_debt || 0)} so'm</span>
            </div>
            <div className="debt-row">
              <span>Hozirgi savdo:</span>
              <span>{formatCurrency(data.current_purchase || data.total)} so'm</span>
            </div>
            {data.payment_made && data.payment_made > 0 && (
              <div className="debt-row">
                <span>To'landi:</span>
                <span>{formatCurrency(data.payment_made)} so'm</span>
              </div>
            )}
            <div className="debt-row final-debt">
              <span>JAMI QARZ:</span>
              <span>{formatCurrency(data.new_balance || 0)} so'm</span>
            </div>
          </div>
        </>
      )}

      {/* Signature (Wholesale) */}
      {isWholesale && (
        <>
          <div className="receipt-divider" />
          <div className="signature-section">
            <div className="signature-line">
              Qabul qildi: ___________________
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="receipt-divider" />
      <div className="receipt-footer">
        <div className="footer-text">Ichki hisob uchun</div>
        <div className="footer-text">Internal Receipt</div>
        <div className="disclaimer">
          Ushbu chek soliq hujjati hisoblanmaydi
        </div>
        <div className="disclaimer-en">
          This is not a tax document
        </div>
      </div>

    </div>
  );
}
