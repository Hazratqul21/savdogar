"use client";

import { AuthGuard } from "@/components/auth-guard";

/**
 * POS Layout - Fullscreen, no sidebar, optimized for touch
 * Route Group: (pos) - Does not affect URL structure
 * Mobile: Bottom cart bar instead of sidebar
 */
export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="h-screen w-screen overflow-hidden bg-slate-950">
        {children}
      </div>
    </AuthGuard>
  );
}
