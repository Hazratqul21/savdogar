"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  Settings,
  Receipt,
  BarChart3,
  UserPlus,
  Shield,
} from "lucide-react";

// Menu items with permission requirements (same as sidebar)
const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", permission: "dashboard" },
  { icon: ShoppingCart, label: "POS Terminali", href: "/pos", permission: "pos" },
  { icon: Package, label: "Mahsulotlar", href: "/dashboard/products", permission: "products" },
  { icon: Warehouse, label: "Ombor", href: "/dashboard/inventory", permission: "inventory" },
  { icon: Receipt, label: "Sotuvlar", href: "/dashboard/sales", permission: "reports" },
  { icon: Users, label: "Mijozlar", href: "/dashboard/customers", permission: "customers" },
  { icon: BarChart3, label: "Hisobotlar", href: "/dashboard/reports", permission: "reports" },
  { icon: UserPlus, label: "Jamoa", href: "/dashboard/team", permission: "team" },
  { icon: Settings, label: "Sozlamalar", href: "/dashboard/settings", permission: "settings" },
];

/**
 * Mobile Sidebar - Hamburger menu for mobile devices
 * Only visible on screens < 768px (md breakpoint)
 */
export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<any>({});
  const pathname = usePathname();
  const router = useRouter();
  const permissions = usePermissions();

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { getSettings } = await import("@/lib/api");
        const data = await getSettings();
        setProfile(data.user || {});
      } catch (e) {
        console.error("Failed to fetch profile:", e);
      }
    };
    fetchProfile();
  }, []);

  // Filter menu items based on permissions
  const visibleMenuItems = MENU_ITEMS.filter(item => {
    return permissions.hasPermission(item.permission);
  });

  // Add super admin link if user is super_admin
  if (permissions.role === "super_admin") {
    visibleMenuItems.push({
      icon: Shield,
      label: "Super Admin",
      href: "/admin",
      permission: "*"
    });
  }

  const handleLogout = async () => {
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_permissions");
    localStorage.removeItem("tenant_id");
    localStorage.removeItem("business_type");
    const { removeToken } = await import("@/lib/api");
    removeToken();
    router.push("/login");
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: "Super Admin",
      owner: "Egasi",
      manager: "Menejer",
      cashier: "Kassir",
      warehouse_manager: "Omborchi"
    };
    return labels[role] || role;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 md:hidden h-11 w-11 bg-white shadow-md"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[260px] sm:w-[280px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Savdogar</h2>
                <p className="text-xs text-gray-500">Savdo tizimi</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="px-4 py-3 border-b bg-gray-50">
            <p className="font-medium text-gray-900 text-sm">
              {profile.full_name || profile.username || "Foydalanuvchi"}
            </p>
            <p className="text-xs text-gray-500">{getRoleLabel(permissions.role)}</p>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-0.5">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Chiqish
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
