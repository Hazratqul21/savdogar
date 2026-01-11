"use client";

import { Store, MapPin, Phone } from "lucide-react";

interface StepStoreInfoProps {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  onChange: (data: { storeName?: string; storeAddress?: string; storePhone?: string }) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepStoreInfo({
  storeName,
  storeAddress,
  storePhone,
  onChange,
  onNext,
  onBack,
}: StepStoreInfoProps) {
  const isValid = storeName.trim().length >= 2;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Do'kon ma'lumotlari</h2>
        <p className="text-gray-500 mt-2">
          Biznesingiz haqida asosiy ma'lumotlar
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Store className="w-4 h-4 inline mr-2" />
            Do'kon nomi *
          </label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => onChange({ storeName: e.target.value })}
            placeholder="Masalan: Super Market"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-2" />
            Manzil
          </label>
          <input
            type="text"
            value={storeAddress}
            onChange={(e) => onChange({ storeAddress: e.target.value })}
            placeholder="Masalan: Toshkent sh., Chilonzor tumani"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-2" />
            Telefon raqami
          </label>
          <input
            type="tel"
            value={storePhone}
            onChange={(e) => onChange({ storePhone: e.target.value })}
            placeholder="+998 90 123 45 67"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          Orqaga
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Davom etish
        </button>
      </div>
    </div>
  );
}
