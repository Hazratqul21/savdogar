"use client";

import { useState, useEffect, useMemo } from "react";

// Permission definitions matching backend
const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ["*"],
  owner: [
    "dashboard",
    "dashboard.analytics",
    "pos",
    "pos.discount",
    "pos.refund",
    "products",
    "products.create",
    "products.edit",
    "products.delete",
    "products.price",
    "inventory",
    "inventory.edit",
    "customers",
    "customers.create",
    "customers.edit",
    "customers.delete",
    "team",
    "team.invite",
    "team.edit",
    "team.delete",
    "reports",
    "reports.sales",
    "reports.inventory",
    "reports.financial",
    "settings",
    "settings.tenant",
    "settings.billing",
  ],
  manager: [
    "dashboard",
    "pos",
    "pos.discount",
    "pos.refund",
    "products",
    "products.create",
    "products.edit",
    "products.price",
    "inventory",
    "inventory.edit",
    "customers",
    "customers.create",
    "customers.edit",
    "reports",
    "reports.sales",
    "reports.inventory",
  ],
  cashier: ["pos", "customers", "customers.view"],
  warehouse_manager: [
    "products",
    "products.create",
    "products.edit",
    "inventory",
    "inventory.edit",
    "reports.inventory",
  ],
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  owner: "Egasi",
  manager: "Menejer",
  cashier: "Kassir",
  warehouse_manager: "Omborchi",
};

// Check if user has specific permission
function hasPermission(role: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];

  // Super admin has all permissions
  if (permissions.includes("*")) {
    return true;
  }

  // Exact match
  if (permissions.includes(permission)) {
    return true;
  }

  // Parent permission check (e.g., "products" grants "products.edit")
  const parts = permission.split(".");
  for (let i = 0; i < parts.length; i++) {
    const parent = parts.slice(0, i + 1).join(".");
    if (permissions.includes(parent)) {
      return true;
    }
  }

  return false;
}

export interface UsePermissionsReturn {
  role: string;
  roleLabel: string;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  // Convenience methods
  canAccessDashboard: boolean;
  canAccessPOS: boolean;
  canGiveDiscount: boolean;
  canRefund: boolean;
  canEditProducts: boolean;
  canCreateProducts: boolean;
  canDeleteProducts: boolean;
  canEditPrices: boolean;
  canManageInventory: boolean;
  canManageTeam: boolean;
  canViewReports: boolean;
  canAccessSettings: boolean;
  isOwner: boolean;
  isManager: boolean;
  isCashier: boolean;
  isWarehouseManager: boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const [role, setRole] = useState<string>("");
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    // Get from localStorage (set by AuthGuard)
    const storedRole = localStorage.getItem("user_role") || "";
    const storedPermissions = localStorage.getItem("user_permissions");

    setRole(storedRole);
    setPermissions(storedPermissions ? JSON.parse(storedPermissions) : []);
  }, []);

  const check = useMemo(() => {
    return (permission: string) => hasPermission(role, permission);
  }, [role]);

  return useMemo(
    () => ({
      role,
      roleLabel: ROLE_LABELS[role] || role,
      permissions: ROLE_PERMISSIONS[role] || permissions,
      hasPermission: check,

      // Convenience methods
      canAccessDashboard: check("dashboard"),
      canAccessPOS: check("pos"),
      canGiveDiscount: check("pos.discount"),
      canRefund: check("pos.refund"),
      canEditProducts: check("products.edit"),
      canCreateProducts: check("products.create"),
      canDeleteProducts: check("products.delete"),
      canEditPrices: check("products.price"),
      canManageInventory: check("inventory.edit"),
      canManageTeam: check("team"),
      canViewReports: check("reports"),
      canAccessSettings: check("settings"),

      // Role checks
      isOwner: role === "owner" || role === "super_admin",
      isManager: role === "manager",
      isCashier: role === "cashier",
      isWarehouseManager: role === "warehouse_manager",
    }),
    [role, permissions, check]
  );
}

// Export for use in server components or non-hook contexts
export { hasPermission, ROLE_PERMISSIONS, ROLE_LABELS };
