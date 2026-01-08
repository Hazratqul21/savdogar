"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { AuthGuard } from "@/components/auth-guard";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <div className="flex h-screen bg-white overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-auto relative bg-white">
                    <div className="relative z-10 p-6 md:p-8 max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
