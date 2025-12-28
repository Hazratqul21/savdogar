import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Product {
    id: number;
    name: string;
    price: number;
    stock_qty: number;
    sku?: string;
    image_url?: string;
    attributes?: Record<string, any>; // Flexible attributes for Retail (expiry), Fashion (size), etc.
}

export interface CartItem extends Product {
    quantity: number;
    cartId: string; // Unique ID for cart item (differs from product ID if variants exist)
}

interface POSState {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (cartId: string) => void;
    updateQuantity: (cartId: string, delta: number) => void;
    clearCart: () => void;
    cartTotal: () => number;
    cartCount: () => number;
}

export const usePOSStore = create<POSState>()(
    persist(
        (set, get) => ({
            cart: [],

            addToCart: (product) => {
                const { cart } = get();
                const existingItem = cart.find(item => item.id === product.id);

                if (existingItem) {
                    // Optimistically update quantity
                    set({
                        cart: cart.map(item =>
                            item.id === product.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        )
                    });
                } else {
                    // Optimistically add new item
                    set({
                        cart: [
                            ...cart,
                            {
                                ...product,
                                quantity: 1,
                                cartId: `${product.id}-${Date.now()}`
                            }
                        ]
                    });
                }
            },

            removeFromCart: (cartId) => {
                set({
                    cart: get().cart.filter(item => item.cartId !== cartId)
                });
            },

            updateQuantity: (cartId, delta) => {
                const { cart } = get();
                const item = cart.find(item => item.cartId === cartId);

                if (!item) return;

                const newQuantity = item.quantity + delta;

                if (newQuantity <= 0) {
                    get().removeFromCart(cartId);
                } else {
                    set({
                        cart: cart.map(item =>
                            item.cartId === cartId
                                ? { ...item, quantity: newQuantity }
                                : item
                        )
                    });
                }
            },

            clearCart: () => set({ cart: [] }),

            cartTotal: () => {
                const subtotal = get().cart.reduce((total, item) => total + (item.price * item.quantity), 0);
                // We'll get businessType from local storage or better yet, inject it into the store if available
                // For now, let's assume we can check it via localStorage similar to the Dashboard
                let businessType = "retail";
                if (typeof window !== 'undefined') {
                    businessType = localStorage.getItem("business_type") || "retail";
                }

                let total = subtotal;
                if (businessType === 'horeca') {
                    total += subtotal * 0.10; // 10% Service Charge
                }
                return total;
            },

            getServiceCharge: () => {
                const subtotal = get().cart.reduce((total, item) => total + (item.price * item.quantity), 0);
                let businessType = "retail";
                if (typeof window !== 'undefined') {
                    businessType = localStorage.getItem("business_type") || "retail";
                }
                return businessType === 'horeca' ? subtotal * 0.10 : 0;
            },

            cartCount: () => {
                return get().cart.reduce((count, item) => count + item.quantity, 0);
            }
        }),
        {
            name: 'pos-cart-storage',
            storage: createJSONStorage(() => localStorage), // Recover state after crash
        }
    )
);
