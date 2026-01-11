"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken, getSettings } from "@/lib/api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      
      if (!token) {
        router.push("/login");
        setIsLoading(false);
        return;
      }

      // Skip onboarding check if already on onboarding page
      if (pathname === "/onboarding") {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      try {
        // Check if onboarding is completed
        const settings = await getSettings();
        
        // Store user data in localStorage for quick access
        if (settings.user) {
          localStorage.setItem("user_role", settings.user.role || "");
          localStorage.setItem("user_permissions", JSON.stringify(settings.user.permissions || []));
        }
        if (settings.tenant) {
          localStorage.setItem("tenant_id", settings.tenant.id?.toString() || "");
          localStorage.setItem("business_type", settings.tenant.business_type || "");
          
          // Redirect to onboarding if not completed
          if (!settings.tenant.onboarding_completed) {
            router.replace("/onboarding");
            setIsLoading(false);
            return;
          }
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        // On error, still allow access but don't redirect
        setIsAuthenticated(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
