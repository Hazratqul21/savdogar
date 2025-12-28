# Adaptive POS Interface - "Operating System for Commerce"

## 🎯 Vision
The UI adapts its layout and behavior based on the user's industry (Retail vs. Wholesale vs. Cafe), creating a "Chameleon" interface that changes to match the workflow.

---

## 🏗️ Architecture

### 1. **PosLayout HOC** (`/src/components/pos/PosLayout.tsx`)
- Checks `user.business_type` from tenant API
- Renders one of three specialized views:
  - **ScannerView** (Retail/Fashion)
  - **VisualGridView** (Cafe/HoReCa)
  - **TraderView** (Wholesale)

### 2. **State Management** (`/src/stores/pos-state.ts`)
- Zustand store with persistence
- Handles different cart logic for each business type
- Wholesale-specific: price negotiation, pack quantities
- Retail/Cafe: standard cart operations

### 3. **Barcode Scanner Hook** (`/src/hooks/useBarcodeScanner.ts`)
- Listens for rapid keystrokes ending in Enter
- Bypasses active input focus
- Configurable min/max length and timeout

### 4. **Offline-First Setup**
- TanStack Query with localStorage persistence
- Queues requests when offline
- Auto-syncs when connection restored

---

## 📱 View Modes

### View 1: "The Scanner" (Retail & Fashion)

**Optimized for:** Barcode guns, keyboard usage

**Features:**
- High-density product list
- Global search bar **always focused** (auto-refocus on blur)
- Keyboard shortcuts:
  - `F2` → Focus search
  - `Space` → Pay
- Barcode scanning:
  - Scan → Add to cart
  - Scan same item → Increment quantity
- Compact cart sidebar

**Layout:**
```
┌─────────────────┬──────────────┐
│  Global Search  │              │
│  (Always Focus) │              │
├─────────────────┤              │
│                 │    Cart      │
│  Product List   │    (Compact)  │
│  (High Density) │              │
│                 │              │
│                 │  [Pay Button]│
└─────────────────┴──────────────┘
```

---

### View 2: "The Visual Grid" (Cafe/HoReCa)

**Optimized for:** Touchscreens, tablets

**Features:**
- Large product cards with images
- Touch interactions:
  - **Tap** → Open modifiers modal (sugar level, ice, etc.)
  - **Long press** → Show details/ingredients
- Sidebar for table management (Table 1, Table 2...)
- Visual cart with large touch targets

**Layout:**
```
┌─────────────────────────┬──────────┐
│                         │  Tables  │
│   Product Grid          │  (12)    │
│   (Large Cards)         │          │
│                         │  Cart    │
│   [Card] [Card] [Card]  │          │
│   [Card] [Card] [Card]  │          │
│                         │  [Pay]   │
└─────────────────────────┴──────────┘
```

---

### View 3: "The Trader" (Wholesale/Optom)

**Optimized for:** Negotiation, bulk sales

**Features:**
- Excel-like data table view
- **Price Negotiation:**
  - Click edit icon → Manually override price
  - Shows `% Discount` calculated dynamically
- **Customer Binding (MANDATORY):**
  - Cannot sell to Guest
  - Shows customer's debt balance in red if negative
  - Debt limit validation
- **Cart Columns:**
  - Item Name | Single Price | Pack Qty | Total Qty | **Final Price (Editable)** | Discount % | Total

**Layout:**
```
┌──────────┬──────────────────────────────────┐
│          │  Customer Selection (MANDATORY)  │
│          │  [Balance: -5000 so'm] (Red)     │
├──────────┼──────────────────────────────────┤
│ Product  │  Excel-like Table                │
│ Search   │  ┌──────┬──────┬──────┬──────┐   │
│          │  │Item │Price │Pack  │Final │   │
│          │  │Name │      │Qty   │Price │   │
│          │  └──────┴──────┴──────┴──────┘   │
│          │  [Edit Price] [Discount %]        │
│          │                                   │
│          │  Total: 150,000 so'm             │
│          │  [Payment Method]                │
│          │  [Checkout]                       │
└──────────┴──────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### State Management (Zustand)

```typescript
interface PosState {
  businessType: 'retail' | 'fashion' | 'horeca' | 'wholesale';
  cart: CartItem[];
  selectedCustomer: Customer | null;
  
  // Wholesale-specific
  updateWholesalePrice: (variantId, finalPrice) => void;
  getDiscountPercent: (variantId) => number;
  
  // Calculations
  getCartTotal: () => number;
  getCartSubtotal: () => number;
}
```

### Barcode Scanner Hook

```typescript
useBarcodeScanner({
  onScan: (barcode) => {
    const variant = await searchProductsByBarcode(barcode);
    addToCart(variant, 1);
  },
  minLength: 3,
  maxLength: 50,
  timeout: 100, // ms between keystrokes
});
```

### Offline-First (TanStack Query)

```typescript
// Query client with persistence
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'POS_QUERY_CACHE',
});

// Auto-retry and queue when offline
defaultOptions: {
  queries: {
    retry: 1,
    refetchOnReconnect: true,
  },
}
```

---

## 🚀 Usage

### 1. Setup Query Provider

```tsx
// app/layout.tsx
import { QueryProvider } from '@/providers/query-provider';

export default function RootLayout({ children }) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  );
}
```

### 2. Use PosLayout

```tsx
// app/dashboard/pos/page.tsx
import { PosLayout } from '@/components/pos/PosLayout';

export default function POSPage() {
  return <PosLayout />;
}
```

### 3. Access State

```tsx
import { usePosState } from '@/stores/pos-state';

function MyComponent() {
  const { cart, businessType, addToCart } = usePosState();
  // ...
}
```

---

## 📋 Key Features

### ✅ Offline-First
- TanStack Query with localStorage persistence
- Queues requests when offline
- Auto-syncs when connection restored

### ✅ Hardware Integration
- Barcode scanner support (HID devices)
- Keyboard shortcuts (F2, Space)
- Touch gestures (long press)

### ✅ Optimistic Updates
- UI updates instantly (0ms latency)
- Syncs with backend in background
- Rollback on error

### ✅ Business-Specific Logic
- **Retail/Fashion:** Barcode-focused, keyboard-driven
- **Cafe:** Touch-optimized, table management
- **Wholesale:** Price negotiation, debt management

---

## 🔄 Data Flow

```
User Action
    ↓
Zustand Store (Optimistic Update)
    ↓
TanStack Query Mutation
    ↓
API Request (Queued if offline)
    ↓
Backend Response
    ↓
Update Store & Cache
```

---

## 📦 File Structure

```
frontend/src/
├── components/pos/
│   ├── PosLayout.tsx          # Main HOC
│   └── views/
│       ├── ScannerView.tsx    # Retail/Fashion
│       ├── VisualGridView.tsx # Cafe
│       └── TraderView.tsx     # Wholesale
├── stores/
│   └── pos-state.ts           # Zustand store
├── hooks/
│   └── useBarcodeScanner.ts   # Barcode hook
├── providers/
│   └── query-provider.tsx     # TanStack Query setup
└── lib/
    └── api-pos.ts             # POS API functions
```

---

## 🎨 Styling

- **Dark Mode:** Slate-900/800 backgrounds
- **High Contrast:** White text on dark backgrounds
- **Touch Targets:** Minimum 44x44px for mobile
- **Responsive:** Grid layouts adapt to screen size

---

## 🐛 Troubleshooting

### Barcode Scanner Not Working
- Check browser permissions for HID devices
- Verify scanner is in "HID keyboard" mode
- Test with manual keyboard input

### Offline Mode Not Working
- Check localStorage is enabled
- Verify QueryProvider is mounted
- Check network status in DevTools

### Wrong View Rendering
- Verify tenant API returns correct `business_type`
- Check `usePosState().businessType` value
- Clear localStorage and reload

---

## 🔮 Future Enhancements

- [ ] Voice commands for hands-free operation
- [ ] Multi-language support
- [ ] Customizable keyboard shortcuts
- [ ] Advanced barcode scanner configuration
- [ ] Real-time inventory sync
- [ ] Offline receipt printing








