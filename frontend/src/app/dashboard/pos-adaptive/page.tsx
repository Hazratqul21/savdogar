"use client";

import { AdaptivePosLayout } from "@/components/pos/AdaptivePosLayout";

/**
 * Adaptive POS Page
 * 
 * This page uses the AdaptivePosLayout component which adapts
 * based on the tenant's business_type setting.
 * 
 * Routes:
 * - For Next.js App Router: /dashboard/pos-adaptive
 * - For Pages Router: Use pages/pos/index.tsx (see alternative file)
 */
export default function AdaptivePosPage() {
  return <AdaptivePosLayout />;
}





