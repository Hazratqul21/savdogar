"use client";

import { Store, Shirt, Coffee, Package, Gem, Wrench, Cigarette } from "lucide-react";

const BUSINESS_TYPES = [
  { id: "retail", label: "Oziq-ovqat do'koni", icon: Store, description: "Supermarket, minimarket, produktlar" },
  { id: "fashion", label: "Kiyim-kechak", icon: Shirt, description: "Kiyim do'koni, boutique" },
  { id: "horeca", label: "Kafe / Restoran", icon: Coffee, description: "Oshxona, kafe, fast-food" },
  { id: "wholesale", label: "Optom savdo", icon: Package, description: "Optoviy savdo, B2B" },
  { id: "jewelry", label: "Bijuteriya", icon: Gem, description: "Aksessuarlar, taqinchoqlar" },
  { id: "plumbing_hvac", label: "Santexnika", icon: Wrench, description: "Santexnika, konditsioner" },
  { id: "tobacco", label: "Tamaki do'koni", icon: Cigarette, description: "Sigaret, alkogol (litsenziyali)" },
];

interface StepBusinessTypeProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
}

export default function StepBusinessType({ value, onChange, onNext }: StepBusinessTypeProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Biznesingiz turi</h2>
        <p className="text-gray-500 mt-2">
          Tizim sizning biznesingizga moslashtiriladi
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BUSINESS_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.id;
          
          return (
            <button
              key={type.id}
              onClick={() => onChange(type.id)}
              className={`
                flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all
                ${isSelected 
                  ? "border-blue-600 bg-blue-50" 
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }
              `}
            >
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                ${isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}
              `}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className={`font-medium ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                  {type.label}
                </div>
                <div className="text-sm text-gray-500">{type.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Davom etish
        </button>
      </div>
    </div>
  );
}
