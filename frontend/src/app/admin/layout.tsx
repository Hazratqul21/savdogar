"use client";

import { SuperAdminGuard } from "@/components/admin/super-admin-guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

/**
 * Super Admin Layout
 * Protected route - only super_admin users can access
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperAdminGuard>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SuperAdminGuard>
  );
}
