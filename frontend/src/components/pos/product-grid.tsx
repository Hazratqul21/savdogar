"use client";

import { VList } from "virtua";
import { usePOSStore, Product } from "@/stores/pos-store";
import { Plus } from "lucide-react";

// Mock Data Generation for Testing Performance (5000 items)
const MOCK_PRODUCTS: Product[] = Array.from({ length: 5000 }).map((_, i) => ({
    id: i + 1,
    name: `Product Item ${i + 1}`,
    price: Math.floor(Math.random() * 100) + 1,
    stock_qty: 100,
    sku: `SKU-${1000 + i}`,
    image_url: `https://placehold.co/100x100?text=P${i + 1}`
}));

export function ProductGrid() {
    const addToCart = usePOSStore(state => state.addToCart);

    return (
        <div className="h-full w-full overflow-y-auto px-4 pb-4">
            {/* 
               virtua's VList handles the virtualization automatically.
               It renders only the visible items + overscan.
             */}
            <VList style={{ height: '100%' }}>
                {MOCK_PRODUCTS.map((product) => (
                    <div
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="flex items-center justify-between p-4 mb-2 bg-card hover:bg-accent border border-border rounded-xl cursor-pointer transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-accent/50 flex items-center justify-center text-xs font-bold text-muted-foreground">
                                {product.sku}
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground">{product.name}</h3>
                                <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                            </div>
                        </div>
                        <button className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus size={18} />
                        </button>
                    </div>
                ))}
            </VList>
        </div>
    );
}
