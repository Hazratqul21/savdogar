/**
 * POS Keyboard Shortcuts Hook
 * ============================
 * Kassir uchun tez tugmalar (F1-F12, hotkeys)
 */
import { useEffect, useCallback } from "react";

export interface PosShortcutActions {
    // F1-F4: Quick products
    onQuickProduct1?: () => void;
    onQuickProduct2?: () => void;
    onQuickProduct3?: () => void;
    onQuickProduct4?: () => void;
    
    // F5-F8: Common actions
    onSearch?: () => void;       // F5 - Qidirish
    onDiscount?: () => void;     // F6 - Chegirma
    onCustomer?: () => void;     // F7 - Mijoz tanlash
    onHoldOrder?: () => void;    // F8 - Buyurtmani to'xtatib turish
    
    // F9-F12: Payment & Complete
    onCash?: () => void;         // F9 - Naqd to'lov
    onCard?: () => void;         // F10 - Karta to'lov
    onTransfer?: () => void;     // F11 - O'tkazma
    onComplete?: () => void;     // F12 - Yakunlash
    
    // Other shortcuts
    onClearCart?: () => void;    // Escape - Savatni tozalash
    onQuantityUp?: () => void;   // + - Miqdorni oshirish
    onQuantityDown?: () => void; // - - Miqdorni kamaytirish
    onDeleteItem?: () => void;   // Delete - Mahsulotni o'chirish
    onPrintReceipt?: () => void; // Ctrl+P - Chek chop etish
}

export function usePosShortcuts(actions: PosShortcutActions, enabled: boolean = true) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;
        
        // Don't trigger shortcuts when typing in input fields
        const target = event.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
            // Allow only F-keys and Escape in input fields
            if (!event.key.startsWith("F") && event.key !== "Escape") {
                return;
            }
        }
        
        // Prevent default for F-keys
        if (event.key.startsWith("F") && event.key.length <= 3) {
            event.preventDefault();
        }
        
        switch (event.key) {
            // Quick products (F1-F4)
            case "F1":
                actions.onQuickProduct1?.();
                break;
            case "F2":
                actions.onQuickProduct2?.();
                break;
            case "F3":
                actions.onQuickProduct3?.();
                break;
            case "F4":
                actions.onQuickProduct4?.();
                break;
            
            // Common actions (F5-F8)
            case "F5":
                actions.onSearch?.();
                break;
            case "F6":
                actions.onDiscount?.();
                break;
            case "F7":
                actions.onCustomer?.();
                break;
            case "F8":
                actions.onHoldOrder?.();
                break;
            
            // Payment (F9-F12)
            case "F9":
                actions.onCash?.();
                break;
            case "F10":
                actions.onCard?.();
                break;
            case "F11":
                actions.onTransfer?.();
                break;
            case "F12":
                actions.onComplete?.();
                break;
            
            // Other shortcuts
            case "Escape":
                actions.onClearCart?.();
                break;
            case "+":
            case "=":
                if (!target.tagName.match(/INPUT|TEXTAREA/)) {
                    actions.onQuantityUp?.();
                }
                break;
            case "-":
            case "_":
                if (!target.tagName.match(/INPUT|TEXTAREA/)) {
                    actions.onQuantityDown?.();
                }
                break;
            case "Delete":
                actions.onDeleteItem?.();
                break;
            case "p":
            case "P":
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    actions.onPrintReceipt?.();
                }
                break;
        }
    }, [actions, enabled]);
    
    useEffect(() => {
        if (enabled) {
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }
    }, [handleKeyDown, enabled]);
}

// Shortcut descriptions for help modal
export const POS_SHORTCUTS = [
    { key: "F1-F4", description: "Tez mahsulotlar" },
    { key: "F5", description: "Qidirish" },
    { key: "F6", description: "Chegirma" },
    { key: "F7", description: "Mijoz tanlash" },
    { key: "F8", description: "Buyurtmani to'xtatish" },
    { key: "F9", description: "Naqd to'lov" },
    { key: "F10", description: "Karta to'lov" },
    { key: "F11", description: "O'tkazma" },
    { key: "F12", description: "Yakunlash" },
    { key: "Escape", description: "Savatni tozalash" },
    { key: "+/-", description: "Miqdor +/-" },
    { key: "Delete", description: "Mahsulotni o'chirish" },
    { key: "Ctrl+P", description: "Chek chop etish" },
];

export default usePosShortcuts;
