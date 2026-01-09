"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllTenants, getCurrentUser } from "@/lib/api-admin";
import { Building2, Users, Package, TrendingUp } from "lucide-react";

export default function AdminDashboardPage() {
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: getAllTenants,
  });

  const stats = {
    totalTenants: tenants.length,
    activeTenants: tenants.filter((t) => t.is_active).length,
    inactiveTenants: tenants.filter((t) => !t.is_active).length,
    totalUsers: 0, // TODO: Add API endpoint to get total users
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome, {user?.full_name || user?.username || "Admin"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Tenants"
          value={stats.totalTenants}
          icon={<Building2 className="text-blue-600" />}
        />
        <StatsCard
          title="Active Stores"
          value={stats.activeTenants}
          icon={<TrendingUp className="text-green-600" />}
        />
        <StatsCard
          title="Inactive Stores"
          value={stats.inactiveTenants}
          icon={<Building2 className="text-gray-400" />}
        />
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users className="text-purple-600" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            title="Manage Tenants"
            description="View and manage all registered stores"
            href="/admin/tenants"
            icon={<Building2 />}
          />
          <QuickActionCard
            title="Global Catalog"
            description="Add products to global catalog"
            href="/admin/global-catalog"
            icon={<Package />}
          />
          <QuickActionCard
            title="Platform Settings"
            description="Configure platform-wide settings"
            href="/admin/settings"
            icon={<TrendingUp />}
            disabled
          />
        </div>
      </div>

      {/* Recent Activity (Placeholder) */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-gray-500 text-sm">Activity log will appear here</p>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-lg bg-gray-50">{icon}</div>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
  disabled,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 opacity-50">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-gray-400">{icon}</div>
          <h3 className="font-semibold text-gray-600">{title}</h3>
        </div>
        <p className="text-sm text-gray-500">{description}</p>
        <span className="text-xs text-gray-400 mt-2 block">Coming soon</span>
      </div>
    );
  }

  return (
    <a
      href={href}
      className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="text-blue-600">{icon}</div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </a>
  );
}
