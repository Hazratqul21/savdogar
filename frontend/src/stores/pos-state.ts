import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BusinessType = 'retail' | 'fashion' | 'horeca' | 'wholesale' | 'jewelry' | 'cafe' | 'kitchen';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'debt' | 'mixed' | 'payme' | 'click';

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  attributes: Record<string, any>;
  barcode_aliases: string[];
  product?: {
    id: number;
    name: string;
    tax_rate: number;
  };
}

export interface CartItem {
  variant_id: number;
  variant: ProductVariant;
  quantity: number;
  unit_price: number; // Final price after price tier
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  // Wholesale-specific
  pack_qty?: number; // Pack quantity (for wholesale)
  final_price?: number; // Editable price (for wholesale negotiation)
  original_price?: number; // Original price before negotiation
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  price_tier: 'retail' | 'vip' | 'wholesaler';
  balance: number; // Positive = credit, Negative = debt
  credit_limit: number;
  max_debt_allowed: number;
}

interface PosState {
  // Business context
  businessType: BusinessType | null;
  tenantId: number | null;

  // Cart state
  cart: CartItem[];
  selectedCustomer: Customer | null;
  paymentMethod: PaymentMethod;

  // UI state
  searchQuery: string;
  isSearchFocused: boolean;
  selectedTable?: string; // For Cafe mode

  // Wholesale-specific
  isPriceNegotiationMode: boolean;

  // Actions
  setBusinessType: (type: BusinessType) => void;
  setTenantId: (id: number) => void;
  setSearchQuery: (query: string) => void;
  setSearchFocused: (focused: boolean) => void;

  // Cart actions
  addToCart: (variant: ProductVariant, quantity?: number) => void;
  updateCartItem: (variantId: number, updates: Partial<CartItem>) => void;
  removeFromCart: (variantId: number) => void;
  clearCart: () => void;
  incrementQuantity: (variantId: number) => void;
  decrementQuantity: (variantId: number) => void;

  // Wholesale cart actions
  updateWholesalePrice: (variantId: number, finalPrice: number) => void;
  updatePackQuantity: (variantId: number, packQty: number) => void;

  // Customer actions
  setCustomer: (customer: Customer | null) => void;
  setPaymentMethod: (method: PaymentMethod) => void;

  // Cafe actions
  setSelectedTable: (table: string | undefined) => void;

  // Calculations
  getCartSubtotal: () => number;
  getCartTax: () => number;
  getCartDiscount: () => number;
  getCartTotal: () => number;
  getServiceCharge: () => number;
  getDiscountPercent: (variantId: number) => number; // For wholesale price negotiation
}

export const usePosState = create<PosState>()(
  persist(
    (set, get) => ({
      // Initial state
      businessType: null,
      tenantId: null,
      cart: [],
      selectedCustomer: null,
      paymentMethod: 'cash',
      searchQuery: '',
      isSearchFocused: false,
      selectedTable: undefined,
      isPriceNegotiationMode: false,

      // Setters
      setBusinessType: (type) => set({ businessType: type }),
      setTenantId: (id) => set({ tenantId: id }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchFocused: (focused) => set({ isSearchFocused: focused }),

      // Cart actions
      addToCart: (variant, quantity = 1) => {
        const state = get();
        const existingItem = state.cart.find(item => item.variant_id === variant.id);

        if (existingItem) {
          // Increment quantity
          const newQuantity = existingItem.quantity + quantity;
          get().updateCartItem(variant.id, { quantity: newQuantity });
        } else {
          // Add new item
          const unitPrice = variant.price;
          const itemTotal = unitPrice * quantity;
          const taxAmount = itemTotal * ((variant.product?.tax_rate || 0) / 100);

          const newItem: CartItem = {
            variant_id: variant.id,
            variant,
            quantity,
            unit_price: unitPrice,
            discount_percent: 0,
            discount_amount: 0,
            tax_rate: variant.product?.tax_rate || 0,
            tax_amount: taxAmount,
            total: itemTotal + taxAmount,
            // Wholesale defaults
            pack_qty: 1,
            final_price: unitPrice,
            original_price: unitPrice,
          };

          set({ cart: [...state.cart, newItem] });
        }
      },

      updateCartItem: (variantId, updates) => {
        const state = get();
        const cart = state.cart.map(item => {
          if (item.variant_id === variantId) {
            const updated = { ...item, ...updates };

            // Recalculate totals if price or quantity changed
            if (updates.quantity !== undefined || updates.unit_price !== undefined || updates.final_price !== undefined) {
              const qty = updates.quantity ?? item.quantity;
              const price = updates.final_price ?? updates.unit_price ?? item.unit_price;
              const subtotal = price * qty;
              const discount = updated.discount_percent > 0
                ? subtotal * (updated.discount_percent / 100)
                : updated.discount_amount || 0;
              const afterDiscount = subtotal - discount;
              const tax = afterDiscount * (updated.tax_rate / 100);

              updated.total = afterDiscount + tax;
              updated.tax_amount = tax;
              updated.discount_amount = discount;
            }

            return updated;
          }
          return item;
        });
        set({ cart });
      },

      removeFromCart: (variantId) => {
        const state = get();
        set({ cart: state.cart.filter(item => item.variant_id !== variantId) });
      },

      clearCart: () => set({ cart: [], selectedCustomer: null }),

      incrementQuantity: (variantId) => {
        const item = get().cart.find(i => i.variant_id === variantId);
        if (item) {
          get().updateCartItem(variantId, { quantity: item.quantity + 1 });
        }
      },

      decrementQuantity: (variantId) => {
        const item = get().cart.find(i => i.variant_id === variantId);
        if (item) {
          if (item.quantity > 1) {
            get().updateCartItem(variantId, { quantity: item.quantity - 1 });
          } else {
            get().removeFromCart(variantId);
          }
        }
      },

      // Wholesale actions
      updateWholesalePrice: (variantId, finalPrice) => {
        get().updateCartItem(variantId, { final_price: finalPrice, unit_price: finalPrice });
      },

      updatePackQuantity: (variantId, packQty) => {
        const item = get().cart.find(i => i.variant_id === variantId);
        if (item) {
          const totalQty = packQty * (item.pack_qty || 1);
          get().updateCartItem(variantId, { pack_qty: packQty, quantity: totalQty });
        }
      },

      // Customer actions
      setCustomer: (customer) => set({ selectedCustomer: customer }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setSelectedTable: (table) => set({ selectedTable: table }),

      // Calculations
      getCartSubtotal: () => {
        return get().cart.reduce((sum, item) => {
          const price = item.final_price ?? item.unit_price;
          return sum + (price * item.quantity);
        }, 0);
      },

      getCartTax: () => {
        return get().cart.reduce((sum, item) => sum + item.tax_amount, 0);
      },

      getCartDiscount: () => {
        return get().cart.reduce((sum, item) => sum + item.discount_amount, 0);
      },

      getCartTotal: () => {
        const subtotal = get().getCartSubtotal() + get().getCartTax() - get().getCartDiscount();
        return subtotal + get().getServiceCharge();
      },

      getServiceCharge: () => {
        const subtotal = get().getCartSubtotal();
        const { businessType } = get();
        const serviceChargeTypes: BusinessType[] = ['horeca', 'cafe', 'kitchen'];
        return serviceChargeTypes.includes(businessType as any) ? subtotal * 0.10 : 0;
      },

      getDiscountPercent: (variantId) => {
        const item = get().cart.find(i => i.variant_id === variantId);
        if (!item || !item.original_price) return 0;
        const currentPrice = item.final_price ?? item.unit_price;
        return ((item.original_price - currentPrice) / item.original_price) * 100;
      },
    }),
    {
      name: 'pos-state-storage',
      partialize: (state) => ({
        cart: state.cart,
        selectedCustomer: state.selectedCustomer,
        paymentMethod: state.paymentMethod,
        selectedTable: state.selectedTable,
      }),
    }
  )
);
