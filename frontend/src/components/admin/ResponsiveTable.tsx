"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Responsive Table Component
 * Desktop: Shows full table
 * Mobile: Shows card list instead
 */

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  mobileLabel?: string; // Label for mobile card view
  mobilePriority?: number; // Higher = shown first on mobile
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  mobileCardRender?: (item: T) => ReactNode; // Custom mobile card render
  className?: string;
  emptyMessage?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  mobileCardRender,
  className,
  emptyMessage = "Ma'lumot topilmadi",
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  // Sort columns by mobile priority (higher first)
  const sortedColumns = [...columns].sort(
    (a, b) => (b.mobilePriority || 0) - (a.mobilePriority || 0)
  );

  return (
    <>
      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className={cn("w-full border-collapse", className)}>
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-gray-900">
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List - Hidden on desktop */}
      <div className="md:hidden space-y-4">
        {data.map((item) => {
          if (mobileCardRender) {
            return (
              <div key={keyExtractor(item)}>
                {mobileCardRender(item)}
              </div>
            );
          }

          // Default card render
          return (
            <div
              key={keyExtractor(item)}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="space-y-3">
                {sortedColumns
                  .filter((col) => col.mobilePriority !== undefined && col.mobilePriority > 0)
                  .slice(0, 4) // Show top 4 columns on mobile
                  .map((column) => (
                    <div key={column.key} className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 mb-1">
                        {column.mobileLabel || column.header}
                      </span>
                      <div className="text-sm font-semibold text-gray-900">
                        {column.render(item)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
