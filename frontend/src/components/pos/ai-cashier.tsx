"use client";

import { useEffect, useState } from "react";
import { usePOSStore } from "@/stores/pos-store";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Plus, X } from "lucide-react";

// Mock Rule Engine
const RECOMMENDATION_RULES: Record<string, { id: number; name: string; price: number; reason: string }> = {
    "Burger": { id: 901, name: "Kartoshka fri", price: 3.50, reason: "80% mijozlar qo'shib oladilar" },
    "Coffee": { id: 902, name: "Muffin", price: 2.50, reason: "Nonushta uchun ajoyib" },
    "Laptop": { id: 903, name: "Sichqoncha", price: 25.00, reason: "Kerakli aksessuar" },
};

export function AICashier() {
    const { cart, addToCart } = usePOSStore();
    const [recommendation, setRecommendation] = useState<{ id: number; name: string; price: number; reason: string } | null>(null);

    // Watch cart changes
    useEffect(() => {
        const lastItem = cart[cart.length - 1];
        if (!lastItem) {
            setRecommendation(null);
            return;
        }

        // Simple fuzzy match for demo
        const match = Object.keys(RECOMMENDATION_RULES).find(key => lastItem.name.includes(key));

        if (match) {
            const rec = RECOMMENDATION_RULES[match];
            // Don't recommend if already in cart
            const alreadyHas = cart.find(i => i.id === rec.id);
            if (!alreadyHas) {
                setRecommendation(rec);
            } else {
                setRecommendation(null);
            }
        }
    }, [cart]);

    if (!recommendation) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            >
                <div className="glass-card flex items-center gap-4 p-3 pr-5 rounded-full premium-shadow pointer-events-auto ring-1 ring-white/20">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center animate-pulse shadow-glow">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">AI Tavsiyasi</span>
                        <span className="text-sm font-bold text-foreground flex items-center gap-1">
                            {recommendation.name} qo'shamizmi?
                            <span className="text-muted-foreground font-normal text-xs ml-1 hidden sm:inline">
                                ({recommendation.reason})
                            </span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2 border-l border-white/10 pl-3">
                        <button
                            onClick={() => setRecommendation(null)}
                            className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={16} />
                        </button>
                        <button
                            onClick={() => {
                                addToCart({
                                    id: recommendation.id,
                                    name: recommendation.name,
                                    price: recommendation.price,
                                    stock_qty: 100
                                });
                                setRecommendation(null);
                            }}
                            className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 text-primary-foreground"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
