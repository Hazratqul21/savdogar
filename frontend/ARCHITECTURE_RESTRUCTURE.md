# Architecture Restructure & Mobile-First UX

## Overview

The application has been restructured to use Next.js Route Groups for strict separation between POS and Admin interfaces, with full mobile-first responsive design.

## Route Structure

### URL Mapping
- `/admin` → Admin Dashboard (Owners)
- `/pos` → Point of Sale (Cashiers)

### Route Groups (Internal Structure)
- `app/(admin)/` → Admin route group (does not affect URL)
- `app/(pos)/` → POS route group (does not affect URL)

### File Structure
```
app/
├── (admin)/
│   ├── layout.tsx          # Admin layout with sidebar
│   └── admin/
│       ├── page.tsx         # /admin
│       ├── settings/
│       ├── labels/
│       └── inventory/
│
├── (pos)/
│   ├── layout.tsx          # POS layout (fullscreen, no sidebar)
│   └── pos/
│       └── page.tsx         # /pos
│
├── layout.tsx              # Root layout
└── globals.css             # Global styles with mobile fixes
```

## Layouts

### Admin Layout (`app/(admin)/layout.tsx`)
- **Desktop**: Sidebar navigation (always visible)
- **Mobile**: Hamburger menu (Sheet component)
- **Features**:
  - Responsive sidebar
  - Mobile-first navigation
  - Dense data density for admin tasks

### POS Layout (`app/(pos)/layout.tsx`)
- **Fullscreen**: No sidebar, optimized for touch
- **Mobile**: Bottom cart bar instead of sidebar
- **Features**:
  - Touch-optimized interface
  - Mobile camera scanner
  - Bottom cart drawer

## Mobile-First Components

### 1. Mobile Sidebar (`components/layout/mobile-sidebar.tsx`)
- Hamburger menu for mobile admin
- Sheet component (bottom drawer)
- Only visible on screens < 768px

### 2. Mobile Cart Bar (`components/pos/MobileCartBar.tsx`)
- Sticky bottom bar for mobile POS
- Shows cart summary (item count + total)
- Opens cart drawer on click
- Only visible on mobile (< 768px)

### 3. Mobile Cart Drawer (`components/pos/MobileCartDrawer.tsx`)
- Bottom sheet containing cart items
- Full checkout functionality
- Thumb-friendly buttons (44px min height)

### 4. Mobile Barcode Scanner (`components/pos/MobileBarcodeScanner.tsx`)
- Uses device camera (html5-qrcode)
- Replaces USB scanner on mobile
- Full-screen scanning interface

### 5. Responsive Table (`components/admin/ResponsiveTable.tsx`)
- **Desktop**: Full table with columns
- **Mobile**: Card list (detail cards)
- Configurable column priority for mobile

## Mobile UX Rules

### Button Sizes
- **Minimum**: 44px height (thumb-friendly)
- **Width**: Minimum 44px for icon buttons
- Applied via CSS: `min-h-[44px] min-w-[44px]`

### Input Sizes
- **Font Size**: 16px+ on mobile (prevents iOS auto-zoom)
- Applied via CSS: `font-size: 16px !important` on mobile

### No Horizontal Scrolling
- `overflow-x: hidden` on html/body
- `max-width: 100vw` enforced
- All components use responsive breakpoints

### Breakpoints
- **Mobile**: < 768px (md breakpoint)
- **Desktop**: >= 768px

## Responsive Patterns

### Table-to-Card Pattern
```tsx
// Desktop: Table
<div className="hidden md:block">
  <table>...</table>
</div>

// Mobile: Cards
<div className="md:hidden space-y-4">
  {data.map(item => <Card>...</Card>)}
</div>
```

### Sidebar-to-Drawer Pattern
```tsx
// Desktop: Permanent sidebar
<aside className="hidden md:flex">
  <Sidebar />
</aside>

// Mobile: Hamburger menu
<div className="md:hidden">
  <MobileSidebar />
</div>
```

### Cart Sidebar-to-Bottom Bar Pattern
```tsx
// Desktop: Permanent sidebar
<div className="hidden md:block w-96">
  <CartSidebar />
</div>

// Mobile: Bottom bar + drawer
<MobileCartBar />
```

## Component Usage

### Admin Pages
```tsx
// Automatically uses (admin) layout
export default function InventoryPage() {
  return (
    <ResponsiveTable
      data={products}
      columns={columns}
      keyExtractor={(item) => item.id}
    />
  );
}
```

### POS Pages
```tsx
// Automatically uses (pos) layout
export default function POSPage() {
  return <PosLayout />;
}
```

## Mobile Features

### Camera Scanner
- Button appears only on mobile
- Opens full-screen camera interface
- Scans barcodes using device camera
- Replaces USB scanner functionality

### Bottom Cart Bar
- Sticky at bottom of screen
- Shows: "3 items | Total: 120,000 so'm >"
- Opens drawer on click
- Auto-hides when cart is empty

### Touch Optimization
- All interactive elements: 44px minimum
- Large tap targets
- No hover states on mobile
- Swipe-friendly drawers

## CSS Utilities

### Mobile Input Fix
```css
@media screen and (max-width: 768px) {
  input, textarea, select {
    font-size: 16px !important;
  }
}
```

### Thumb-Friendly Buttons
```css
@media screen and (max-width: 768px) {
  button, a[role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}
```

## Testing

### Desktop Testing
1. Navigate to `/admin` - Should show sidebar
2. Navigate to `/pos` - Should show fullscreen POS
3. Resize to mobile - Should show hamburger menu

### Mobile Testing
1. Open on phone browser
2. `/admin` - Should show hamburger menu
3. `/pos` - Should show bottom cart bar
4. Test camera scanner button
5. Test cart drawer
6. Verify no horizontal scrolling

## Migration Notes

### Old Routes (Deprecated)
- `/dashboard` → `/admin`
- `/dashboard/pos` → `/pos`
- `/dashboard/settings` → `/admin/settings`
- `/dashboard/labels` → `/admin/labels`

### New Routes (Active)
- `/admin` - Admin dashboard
- `/pos` - POS terminal
- `/admin/settings` - Settings
- `/admin/labels` - Label studio

## Dependencies Added

```json
{
  "html5-qrcode": "^latest",        // Camera barcode scanning
  "class-variance-authority": "^latest",  // Sheet variants
  "@radix-ui/react-dialog": "^latest"     // Sheet component
}
```

## Next Steps

1. **Inventory Page**: Implement ResponsiveTable for product list
2. **Customers Page**: Use ResponsiveTable for customer list
3. **Sales History**: Use ResponsiveTable for sales table
4. **Settings**: Ensure all forms are mobile-friendly
5. **Testing**: Test on real devices (iOS/Android)

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 12+)
- **Mobile Browsers**: Full support with camera API
