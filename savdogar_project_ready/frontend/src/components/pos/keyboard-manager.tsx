"use client";

import { useEffect } from "react";
import { usePOSStore } from "@/stores/pos-store";

export function KeyboardManager() {
    const { clearCart, cartTotal } = usePOSStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // F1: Focus Search
            if (e.key === "F1") {
                e.preventDefault();
                const searchInput = document.getElementById("pos-search-input");
                if (searchInput) searchInput.focus();
            }

            // ESC: Clear Cart
            if (e.key === "Escape") {
                e.preventDefault();
                if (confirm("Are you sure you want to clear the cart?")) {
                    clearCart();
                }
            }

            // SPACE: Quick Pay (only if not typing in an input)
            if (e.key === " " && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
                e.preventDefault();
                const total = cartTotal();
                if (total > 0) {
                    alert(`Simulating Payment: $${total.toFixed(2)}`);
                    // logic to trigger payment modal would go here
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [clearCart, cartTotal]);

    return null; // This component handles logic only
}
