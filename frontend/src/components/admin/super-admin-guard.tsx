"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/api-admin";
import { getToken } from "@/lib/api";

interface SuperAdminGuardProps {
  children: React.ReactNode;
}

export function SuperAdminGuard({ children }: SuperAdminGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthorization = async () => {
      const token = getToken();
      
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const user = await getCurrentUser();
        
        if (user.role !== 'super_admin') {
          // Not a super admin, redirect to dashboard
          router.push("/dashboard");
          return;
        }

        setIsAuthorized(true);
      } catch (error: any) {
        console.error("Authorization check failed:", error);
        if (error.message === 'Unauthorized') {
          router.push("/login");
        } else {
          router.push("/dashboard");
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Tekshirilmoqda...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
