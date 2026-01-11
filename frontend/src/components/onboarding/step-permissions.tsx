"use client";

import { Check, X, Shield, User, Store, Package, FileText, Settings } from "lucide-react";

const PERMISSIONS_TABLE = [
  {
    category: "Boshqaruv",
    icon: Store,
    items: [
      { name: "Dashboard ko'rish", owner: true, manager: true, cashier: false, warehouse: false },
      { name: "Hisobotlar", owner: true, manager: true, cashier: false, warehouse: false },
      { name: "Tahlillar", owner: true, manager: true, cashier: false, warehouse: false },
    ],
  },
  {
    category: "Savdo",
    icon: Store,
    items: [
      { name: "POS terminali", owner: true, manager: true, cashier: true, warehouse: false },
      { name: "Chegirma berish", owner: true, manager: true, cashier: false, warehouse: false },
      { name: "Qaytarish", owner: true, manager: true, cashier: false, warehouse: false },
    ],
  },
  {
    category: "Mahsulotlar",
    icon: Package,
    items: [
      { name: "Mahsulot ko'rish", owner: true, manager: true, cashier: true, warehouse: true },
      { name: "Mahsulot qo'shish", owner: true, manager: true, cashier: false, warehouse: true },
      { name: "Narx o'zgartirish", owner: true, manager: true, cashier: false, warehouse: false },
    ],
  },
  {
    category: "Ombor",
    icon: Package,
    items: [
      { name: "Ombor ko'rish", owner: true, manager: true, cashier: false, warehouse: true },
      { name: "Ombor o'zgartirish", owner: true, manager: true, cashier: false, warehouse: true },
    ],
  },
  {
    category: "Sozlamalar",
    icon: Settings,
    items: [
      { name: "Jamoa boshqarish", owner: true, manager: false, cashier: false, warehouse: false },
      { name: "Tizim sozlamalari", owner: true, manager: false, cashier: false, warehouse: false },
    ],
  },
];

interface StepPermissionsProps {
  onNext: () => void;
  onBack: () => void;
}

export default function StepPermissions({ onNext, onBack }: StepPermissionsProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Ruxsatlar tizimi</h2>
        <p className="text-gray-500 mt-2">
          Har bir rol uchun belgilangan ruxsatlar
        </p>
      </div>

      {/* Role Headers */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-2 font-medium text-gray-700">Ruxsat</th>
              <th className="text-center py-3 px-2">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mb-1">
                    <User className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">Egasi</span>
                </div>
              </th>
              <th className="text-center py-3 px-2">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-1">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">Menejer</span>
                </div>
              </th>
              <th className="text-center py-3 px-2">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-1">
                    <User className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">Kassir</span>
                </div>
              </th>
              <th className="text-center py-3 px-2">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mb-1">
                    <Package className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">Omborchi</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS_TABLE.map((category) => (
              <>
                <tr key={category.category} className="bg-gray-50">
                  <td colSpan={5} className="py-2 px-2 font-medium text-gray-800">
                    {category.category}
                  </td>
                </tr>
                {category.items.map((item) => (
                  <tr key={item.name} className="border-b border-gray-100">
                    <td className="py-2 px-2 text-sm text-gray-600">{item.name}</td>
                    <td className="text-center py-2">
                      {item.owner ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-2">
                      {item.manager ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-2">
                      {item.cashier ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-2">
                      {item.warehouse ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Ma'lumot</p>
            <p className="mt-1">
              Ruxsatlar tizimi avtomatik ishlaydi. Siz faqat xodimga rol berasiz,
              qolgan barcha ruxsatlar o'sha rolga mos ravishda beriladi.
            </p>
          </div>
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
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Davom etish
        </button>
      </div>
    </div>
  );
}
