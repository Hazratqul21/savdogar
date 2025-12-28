"use client";

import { Keyboard } from 'lucide-react';
import { useState } from 'react';

export function KeyboardGuide() {
    const [isOpen, setIsOpen] = useState(false);

    const keys = [
        { key: "F2 / F4", action: "Qidiruvni aktivlashtirish" },
        { key: "Space / F8", action: "To'lovni amalga oshirish" },
        { key: "F9", action: "Chegirma (Yaqinda)" },
        { key: "ESC", action: "Oynani yopish" },
    ];

    return (
        <div className="fixed bottom-4 left-4 z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-3 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-full text-slate-400 hover:text-white transition-all shadow-lg"
            >
                <Keyboard size={20} />
            </button>

            {isOpen && (
                <div className="absolute bottom-14 left-0 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                    <h4 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                        <Keyboard size={16} /> Tezkor tugmalar
                    </h4>
                    <div className="space-y-2">
                        {keys.map((k) => (
                            <div key={k.key} className="flex justify-between items-center text-xs">
                                <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded text-slate-300 font-mono">
                                    {k.key}
                                </span>
                                <span className="text-slate-400">{k.action}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
