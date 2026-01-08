"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";

/**
 * Admin Layout - Desktop: Sidebar navigation, Mobile: Hamburger menu
 * Route Group: (admin) - Does not affect URL structure
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-white overflow-hidden">
        {/* Desktop Sidebar - Hidden on mobile */}
        <aside className="hidden md:flex md:flex-shrink-0">
          <Sidebar />
        </aside>

        {/* Mobile Hamburger Menu */}
        <div className="md:hidden">
          <MobileSidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto relative bg-white w-full">
          <div className="relative z-10 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
