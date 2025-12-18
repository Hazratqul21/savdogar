"use client";

import { useEffect, useState } from 'react';
import { usePosState, type BusinessType } from '@/stores/pos-state';
import { useQuery } from '@tanstack/react-query';
import { getTenantInfo } from '@/lib/api-pos';
import { ScannerView } from './views/ScannerView';
import { VisualGridView } from './views/VisualGridView';
import { TraderView } from './views/TraderView';

/**
 * PosLayout - "Chameleon" Layout Architecture
 * Adapts UI based on business_type (Retail/Fashion vs Cafe vs Wholesale)
 */
export function PosLayout() {
  const { businessType, setBusinessType, setTenantId } = usePosState();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tenant info on mount
  const { data: tenantInfo } = useQuery({
    queryKey: ['tenant-info'],
    queryFn: getTenantInfo,
    retry: 1,
  });

  useEffect(() => {
    if (tenantInfo) {
      setTenantId(tenantInfo.id);
      setBusinessType(tenantInfo.business_type as BusinessType);
      setIsLoading(false);
    }
  }, [tenantInfo, setTenantId, setBusinessType]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // Render appropriate view based on business type
  switch (businessType) {
    case 'retail':
    case 'fashion':
      return <ScannerView />;

    case 'horeca':
      return <VisualGridView />;

    case 'wholesale':
      return <TraderView />;

    default:
      return (
        <div className="h-full flex items-center justify-center bg-slate-950">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-2">Xatolik</p>
            <p className="text-slate-300">
              Business type aniqlanmadi. Iltimos, tenant sozlamalarini tekshiring.
            </p>
          </div>
        </div>
      );
  }
}








