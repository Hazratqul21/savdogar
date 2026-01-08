"use client";

import { useEffect, useState } from "react";
import {
    ShoppingBag,
    TrendingUp,
    Users,
    Package,
    AlertCircle,
    Printer
} from "lucide-react";
import Link from "next/link";
import { DemoDataSeeder } from "@/components/settings/demo-seeder";

const getUserBusinessType = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem("business_type") || "retail";
    }
    return "retail";
};

export default function DashboardPage() {
    const [businessType, setBusinessType] = useState<string>("retail");

    useEffect(() => {
        const type = getUserBusinessType();
        setBusinessType(type);
    }, []);

    const renderRetailDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Bugungi Savdo" value="12,450,000 UZS" icon={<TrendingUp className="text-green-600" />} />
            <StatsCard title="Mijozlar" value="145" icon={<Users className="text-blue-600" />} />
            <StatsCard title="Kam qolgan tovarlar" value="12" icon={<AlertCircle className="text-red-600" />} />
            <StatsCard title="Yaroqlilik muddati" value="5 ta ogohlantirish" icon={<Package className="text-orange-600" />} />
        </div>
    );

    const renderFashionDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Bugungi Savdo" value="8,200,000 UZS" icon={<TrendingUp className="text-purple-600" />} />
            <StatsCard title="Trenddagi Modellar" value="Oversize T-Shirt" icon={<TrendingUp className="text-pink-600" />} />
            <StatsCard title="Eng ko'p sotilgan o'lcham" value="L (Large)" icon={<Users className="text-blue-600" />} />
            <StatsCard title="Mavsumiy tovarlar" value="Qishki kolleksiya" icon={<Package className="text-indigo-600" />} />
        </div>
    );

    const renderJewelryDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Bugungi Savdo" value="25,000,000 UZS" icon={<TrendingUp className="text-amber-600" />} />
            <StatsCard title="Oltin kursi (1gr)" value="850,000 UZS" icon={<TrendingUp className="text-yellow-600" />} />
            <StatsCard title="Sotilgan to'plamlar" value="3 ta" icon={<Users className="text-blue-600" />} />
            <StatsCard title="Ombordagi qoldiq" value="142 dona" icon={<Package className="text-gray-600" />} />
        </div>
    );

    const renderHorecaDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Bugungi Savdo" value="5,600,000 UZS" icon={<TrendingUp className="text-orange-600" />} />
            <StatsCard title="Buyurtmalar" value="48 ta" icon={<TrendingUp className="text-amber-600" />} />
            <StatsCard title="Band stollar" value="5 / 12" icon={<Users className="text-blue-600" />} />
            <StatsCard title="Oshxona yuki" value="O'rta" icon={<AlertCircle className="text-green-600" />} />
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Xush kelibsiz
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Sizning faoliyat turi: <span className="font-semibold text-blue-600 capitalize">{businessType === 'retail' ? 'Oziq-ovqat' : businessType === 'fashion' ? 'Kiyim-kechak' : businessType === 'jewelry' ? 'Bijuteriya' : 'Kafe/Restoran'}</span>
                    </p>
                </div>
                <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium">
                    {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            <div>
                <DemoDataSeeder />

                {businessType === 'retail' && renderRetailDashboard()}
                {businessType === 'fashion' && renderFashionDashboard()}
                {businessType === 'jewelry' && renderJewelryDashboard()}
                {businessType === 'horeca' && renderHorecaDashboard()}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
                    <h2 className="text-lg font-bold mb-4 text-gray-900">So'nggi savdolar</h2>
                    <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        Grafik yoki jadval joyi (Tez orada)
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h2 className="text-lg font-bold mb-4 text-gray-900">Tezkor amallar</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <ActionButton icon={<ShoppingBag />} label="Yangi Savdo" href="/dashboard/pos" />
                        <ActionButton icon={<Printer />} label="Etiketkalar" href="/dashboard/labels" />
                        <ActionButton icon={<Users />} label="Mijozlar" href="#" />
                        <ActionButton icon={<TrendingUp />} label="Hisobot" href="#" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-lg bg-gray-50">
                    {icon}
                </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    );
}

function ActionButton({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
    return (
        <Link href={href} className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-all border border-gray-200 group cursor-pointer">
            <div className="mb-2 text-gray-600 group-hover:text-blue-600 transition-colors">
                {icon}
            </div>
            <span className="text-xs font-medium text-center text-gray-700">{label}</span>
        </Link>
    );
}
