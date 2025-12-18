# Wholesale Labeling & Scanning Guide

## 🏷️ Label Studio Module

### Overview
The Label Studio allows wholesale traders to generate product labels with QR codes for bulk items. Labels are optimized for thermal printers (40mm x 30mm).

### Features

#### 1. **Label Generation**
- Select product variant
- Set quantity (batch print)
- Generate QR code with product data
- Print-ready format

#### 2. **Label Layout**
- **Size:** 40mm x 30mm (Standard Thermal Sticker)
- **Header:** Product Name (2 lines max, bold)
- **Body:** QR Code (JSON: `{"s": "SKU-123", "v": "1"}`)
- **Footer:** Price (large font) + Currency

#### 3. **Batch Print**
- Select multiple products
- Set quantity per product
- Generate grid layout for thermal printers
- No margins/headers (print-optimized)

---

## 📦 Smart Scanner Logic

### Pack Detection

The scanner automatically detects if a scanned item is a "Pack" and applies special logic:

#### Detection Methods:

1. **QR Code Data:**
   ```json
   {
     "s": "SKU-123",
     "v": "1",
     "p": 50  // Pack quantity
   }
   ```

2. **Product Attributes:**
   - `pack_size`, `pack_qty`, or `packSize` in variant attributes

3. **SKU Pattern:**
   - Contains "PACK", "BOX", or "PK"
   - Extracts quantity from SKU (e.g., "ITEM-PACK-50" → 50)

#### Behavior:

- **Regular Item:** Single beep, quantity = 1
- **Pack Item:** Double beep, quantity = pack_size

---

## 🔊 Sound Manager

### Audio Feedback

The `SoundManager` provides audio cues for different scan events:

#### `playBeep()`
- **Frequency:** 800Hz
- **Duration:** 100ms
- **Use:** Successful scan (regular item)

#### `playDoubleBeep()`
- **Frequencies:** 800Hz → 1000Hz
- **Duration:** 150ms (two beeps)
- **Use:** Pack scan (bulk item detected)

#### `playError()`
- **Frequency:** 400Hz → 200Hz (descending)
- **Duration:** 300ms
- **Use:** Product not found

### Usage

```typescript
import { soundManager } from '@/lib/sound-manager';

// Enable/disable sounds
soundManager.setEnabled(true);

// Play sounds
soundManager.playBeep();        // Success
soundManager.playDoubleBeep();   // Pack
soundManager.playError();        // Error
```

---

## 🔧 Implementation Details

### LabelGenerator Component

**Location:** `/src/components/pos/LabelGenerator.tsx`

**Features:**
- Drag-and-drop product selection
- Batch quantity input
- QR code generation
- Print preview
- Thermal printer optimization

**Print Styles:**
```css
@media print {
  @page {
    size: 40mm 30mm;
    margin: 0;
  }
  .label-page {
    page-break-after: always;
  }
}
```

### useSmartScanner Hook

**Location:** `/src/hooks/useSmartScanner.ts`

**Features:**
- Barcode/QR code scanning
- Pack detection logic
- Automatic quantity setting
- Audio feedback integration
- Error handling

**Usage:**
```typescript
useSmartScanner({
  onScan: (variant, isPack) => {
    console.log('Scanned:', variant.sku, isPack ? 'Pack' : 'Regular');
  },
  onError: (barcode) => {
    console.error('Not found:', barcode);
  },
});
```

---

## 📋 QR Code Format

### Standard Format

```json
{
  "s": "SKU-123",      // SKU code
  "v": "1",            // Variant ID
  "p": 50              // Pack quantity (optional)
}
```

### Plain SKU

If QR contains only SKU (no JSON), scanner will:
1. Try exact SKU match
2. Try partial SKU match
3. Try barcode alias match

---

## 🖨️ Printing Instructions

### Thermal Printer Setup

1. **Printer Settings:**
   - Paper size: 40mm x 30mm
   - No margins
   - No headers/footers

2. **Browser Print:**
   - Use "More settings"
   - Set margins to "None"
   - Disable headers/footers

3. **Batch Print:**
   - Select all products
   - Set quantities
   - Click "Chop etish"
   - Browser will generate grid layout

### Label Layout

```
┌─────────────────────┐
│ Product Name        │ ← Header (2 lines max)
│ (Bold, 8pt)         │
├─────────────────────┤
│                     │
│    [QR Code]        │ ← Body (60px)
│                     │
├─────────────────────┤
│  150,000 so'm       │ ← Footer (10pt, bold)
└─────────────────────┘
```

---

## 🎯 Workflow

### For Wholesale Traders

1. **Generate Labels:**
   - Go to "Label Studio"
   - Select products
   - Set quantities
   - Print labels

2. **Stick Labels:**
   - Attach to bulk items
   - Each pack gets a label

3. **Scan & Sell:**
   - Scan QR code at POS
   - System detects pack
   - Auto-sets quantity
   - Applies wholesale price

---

## 🔍 Troubleshooting

### QR Code Not Scanning

- Check QR code format (JSON or plain SKU)
- Verify product exists in database
- Check barcode_aliases in variant

### Pack Not Detected

- Verify `pack_size` in attributes
- Check SKU pattern (PACK/BOX/PK)
- Review QR code data structure

### Print Issues

- Check browser print settings
- Verify page size (40mm x 30mm)
- Disable margins/headers
- Use thermal printer mode

### Sound Not Playing

- Check browser autoplay policy
- User interaction required first
- Verify AudioContext support
- Check `soundManager.isSoundEnabled()`

---

## 📦 Example: Pack Product

### Product Setup

```json
{
  "name": "T-Shirt Pack",
  "variants": [
    {
      "sku": "TSHIRT-PACK-50",
      "price": 50000,
      "attributes": {
        "pack_size": 50,
        "pack_type": "box"
      }
    }
  ]
}
```

### QR Code Generated

```json
{
  "s": "TSHIRT-PACK-50",
  "v": "1",
  "p": 50
}
```

### Scan Result

- **Detected as Pack:** ✅
- **Quantity Set:** 50
- **Sound:** Double beep
- **Price:** Wholesale price applied

---

## 🚀 Future Enhancements

- [ ] Custom label templates
- [ ] Barcode support (Code128, EAN-13)
- [ ] Multi-language labels
- [ ] Batch label generation API
- [ ] Label history tracking
- [ ] Print queue management








