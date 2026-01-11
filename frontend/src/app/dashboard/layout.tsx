"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { AuthGuard } from "@/components/auth-guard";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <div className="flex h-screen bg-white overflow-hidden">
                {/* Desktop Sidebar - hidden on mobile */}
                <div className="hidden md:block">
                    <Sidebar />
                </div>
                
                {/* Mobile Sidebar - hamburger menu */}
                <MobileSidebar />
                
                <main className="flex-1 overflow-auto relative bg-white w-full">
                    {/* Reduced padding on mobile: p-3 -> sm:p-4 -> md:p-6 -> lg:p-8 */}
                    <div className="relative z-10 p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
