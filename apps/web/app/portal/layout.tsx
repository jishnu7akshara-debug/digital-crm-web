"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PortalHeader } from "@/components/layout/portal-header";
import { useAuth } from "@/lib/auth-context";
import { ServiceUnavailable } from "@/components/ui/states";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, status, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/portal/login";

  useEffect(() => {
    if (isLoading || status === "loading" || status === "unavailable") return;

    if (isLoginPage) {
      if (status === "authenticated" && user && user.user_type === "client") {
        router.push("/portal");
      }
    } else {
      if (status === "unauthenticated") {
        router.push("/portal/login");
      } else if (status === "authenticated" && user && user.user_type === "internal") {
        router.push("/internal/dashboard");
      }
    }
  }, [user, status, isLoading, isLoginPage, router]);

  // If viewing the login page, render the login form directly without header
  if (isLoginPage) {
    return <>{children}</>;
  }

  // If backend server is unreachable, render dedicated ServiceUnavailable state
  if (status === "unavailable") {
    return <ServiceUnavailable onRetry={refreshUser} />;
  }

  if (isLoading || status === "loading") {
    return (
      <div
        data-testid="loading-spinner"
        className="flex items-center justify-center min-h-screen bg-[#F3F3F3]"
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#0176D3] border-t-transparent animate-spin" />
          <span className="text-xs text-[#5C5C5C] font-medium tracking-wide">Loading Client Portal...</span>
        </div>
      </div>
    );
  }

  if (!user || user.user_type !== "client") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col text-[#0F172A] font-sans">
      <React.Suspense fallback={<div className="h-16 bg-white border-b border-[#E5E7EB]" />}>
        <PortalHeader />
      </React.Suspense>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
