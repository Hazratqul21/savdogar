"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Box,
  Users,
  Settings,
  Receipt,
  Tag,
  FileText,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Boshqaruv paneli", href: "/admin" },
  { icon: ShoppingCart, label: "POS Terminali", href: "/pos" },
  { icon: Tag, label: "Label Studio", href: "/admin/labels" },
  { icon: Receipt, label: "Fakturalar", href: "/admin/invoices" },
  { icon: Box, label: "Ombor", href: "/admin/inventory" },
  { icon: FileText, label: "Nakladnoy Skaner", href: "/admin/inventory/nakladnoy" },
  { icon: Users, label: "Mijozlar", href: "/admin/customers" },
  { icon: Settings, label: "Sozlamalar", href: "/admin/settings" },
];

/**
 * Mobile Sidebar - Hamburger menu for mobile devices
 * Only visible on screens < 768px (md breakpoint)
 */
export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 md:hidden h-11 w-11"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Savdo-Gar</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                const { removeToken } = await import("@/lib/api");
                removeToken();
                window.location.href = "/login";
              }}
            >
              Chiqish
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
