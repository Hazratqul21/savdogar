# Receipt Printing Guide - Xprinter XP-58

## Overview

Internal non-fiscal receipt printing system for Xprinter XP-58 (58mm thermal printer) using browser native print API.

## Components

### 1. ReceiptTemplate Component
**Location:** `frontend/src/components/pos/ReceiptTemplate.tsx`

**Features:**
- **RETAIL Mode**: Simple receipt with items and total
- **WHOLESALE Mode**: Detailed receipt with customer info, debt tracking, signature line
- **58mm Width**: Optimized for thermal printer
- **Monospace Font**: Ensures sharp printing
- **Disclaimer**: "Ushbu chek soliq hujjati hisoblanmaydi" (non-fiscal)

### 2. Print Utility
**Location:** `frontend/src/utils/receipt-printer.ts`

**Functions:**
- `printReceipt(data)` - Triggers browser print dialog
- `prepareReceiptData(sale, tenantInfo, customerInfo)` - Formats sale data for receipt

### 3. CSS Styles
**Location:** `frontend/src/styles/receipt-print.css`

**Features:**
- `@media print` styles for 58mm width
- Hides all UI elements except receipt when printing
- Monospace font for thermal printer compatibility

## Usage

### Automatic Printing (Recommended)

Receipts are automatically printed after successful checkout:

```typescript
import { useCheckout } from "@/hooks/useCheckout";

const { handleCheckout } = useCheckout();

// After successful checkout, receipt prints automatically
await handleCheckout();
```

### Manual Printing

```typescript
import { printReceipt, prepareReceiptData } from "@/utils/receipt-printer";

const receiptData = prepareReceiptData(sale, tenantInfo, customerInfo);
await printReceipt(receiptData);
```

## Receipt Data Structure

```typescript
interface ReceiptData {
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
```

## Receipt Modes

### RETAIL Mode
- Simple layout
- Items list
- Total amount
- Payment method
- Footer disclaimer

### WHOLESALE Mode
- Customer name
- Debt tracking:
  - Previous debt (Eski qarz)
  - Current purchase (Hozirgi savdo)
  - Payment made (To'landi)
  - New balance (Jami qarz)
- Signature line: "Qabul qildi: _______"

## Print Settings

### Browser Print Dialog
1. Select "Xprinter XP-58" as printer
2. Paper size: Custom (58mm width)
3. Margins: None
4. Scale: 100%

### Printer Configuration
- **Width**: 58mm
- **Paper Type**: Thermal
- **Connection**: USB
- **Driver**: Xprinter XP-58 driver installed

## Testing

### Screen Preview
Receipt is visible on screen for testing (with border):
- Navigate to POS
- Complete a sale
- Receipt preview appears before print dialog

### Print Test
1. Complete a sale
2. Print dialog opens automatically
3. Select Xprinter XP-58
4. Click Print

## Troubleshooting

### Receipt Not Printing
- Check printer is connected via USB
- Verify Xprinter driver is installed
- Check browser print settings
- Ensure printer is set as default

### Receipt Too Wide/Narrow
- Verify CSS `width: 58mm` is applied
- Check browser print preview
- Adjust printer settings if needed

### Text Not Sharp
- Ensure monospace font is used
- Check printer resolution settings
- Verify thermal paper quality

## Disclaimer

**Important:** This is an internal receipt system. The disclaimer text is mandatory:
- "Ushbu chek soliq hujjati hisoblanmaydi"
- "This is not a tax document"

This receipt is for internal use only and does not serve as a fiscal document.

## Future Enhancements

1. **Fiscal Integration**: When government license is obtained, integrate fiscal printer API
2. **QR Code**: Add QR code for receipt verification
3. **Multi-language**: Support multiple languages on receipt
4. **Logo Upload**: Allow custom store logo upload
5. **Receipt Templates**: Customizable receipt templates per business type
