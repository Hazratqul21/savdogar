"use client";

import { useState } from 'react';
import { usePosState } from '@/stores/pos-state';
import { Package, Check, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const DEMO_PRODUCTS: Record<string, any[]> = {
    retail: [
        { name: "Sut 'Musaffo' 1L", price: 12500, sku: "MILK-001", stock: 50, attributes: { expiry_date: "2024-12-31" } },
        { name: "Non 'Buxanka'", price: 3500, sku: "BREAD-001", stock: 100, attributes: { expiry_date: "2024-12-20" } },
        { name: "Pechenye 'Yubiley'", price: 8000, sku: "COOK-001", stock: 45, attributes: { expiry_date: "2025-06-01" } },
        { name: "Coca-Cola 1.5L", price: 14000, sku: "COKE-001", stock: 60, attributes: { expiry_date: "2025-01-15" } },
    ],
    fashion: [
        { name: "Erkaklar futbolkasi (Oq)", price: 85000, sku: "TSH-WHT-L", stock: 20, attributes: { size: "L", color: "Oq", material: "Paxta" } },
        { name: "Jinsi shim 'Slim Fit'", price: 250000, sku: "JNS-BLU-32", stock: 15, attributes: { size: "32", color: "Ko'k", brand: "Zara" } },
        { name: "Ayollar ko'ylagi", price: 180000, sku: "DRS-RED-M", stock: 10, attributes: { size: "M", color: "Qizil", season: "Yoz" } },
    ],
    jewelry: [
        { name: "Oltin uzuk 585", price: 2500000, sku: "RING-G-585", stock: 5, attributes: { weight: 3.5, purity: "585", stone: "None" } },
        { name: "Kumush zanjir", price: 450000, sku: "CHN-S-925", stock: 12, attributes: { weight: 12.0, purity: "925" } },
    ],
    horeca: [
        { name: "Cappuccino", price: 22000, sku: "COF-CAP", stock: 1000, attributes: { type: "Hot Drink" } },
        { name: "Cheesecake", price: 35000, sku: "CAKE-CHS", stock: 20, attributes: { type: "Dessert" } },
    ]
};

export function DemoDataSeeder() {
    const { businessType, tenantId } = usePosState();
    const [loading, setLoading] = useState(false);
    const [seeded, setSeeded] = useState(false);

    const handleSeed = async () => {
        setLoading(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In a real app, this would call an API endpoint to bulk insert
        console.log(`Seeding data for ${businessType} into tenant ${tenantId}`, DEMO_PRODUCTS[businessType || 'retail'] || []);

        setLoading(false);
        setSeeded(true);

        // Notify user (would use toast here)
    };

    if (seeded) {
        return (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400 mb-6">
                <Check size={20} />
                <span>Tabriklaymiz! Do'koningiz tayyor. Savdoni boshlashingiz mumkin.</span>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl mb-8 relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-grid-white/5 mask-image-linear-to-b" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Sparkles className="text-white" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Xush kelibsiz! Do'koningiz bo'sh ko'rinmoqda.</h3>
                        <p className="text-slate-300">
                            {(businessType as string) === 'retail' ? "Oziq-ovqat mahsulotlari" :
                                (businessType as string) === 'fashion' ? "Kiyim-kechak namunalari" :
                                    (businessType as string) === 'jewelry' ? "Zargarlik buyumlari" : "Menyu namunalari"}ni bir bosishda yuklang.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleSeed}
                    disabled={loading}
                    className="whitespace-nowrap px-6 py-3 bg-white text-blue-600 font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Yuklanmoqda...
                        </>
                    ) : (
                        <>
                            <Package size={20} />
                            Namunalarni Yuklash
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
