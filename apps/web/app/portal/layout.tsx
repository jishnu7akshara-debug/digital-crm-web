"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/lib/auth-context";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/portal/login";

  useEffect(() => {
    if (isLoading) return;

    if (isLoginPage) {
      if (user && user.user_type === "client") {
        router.push("/portal");
      }
    } else {
      if (!user) {
        router.push("/portal/login");
      } else if (user.user_type === "internal") {
        router.push("/internal/dashboard");
      }
    }
  }, [user, isLoading, isLoginPage, router]);

  // If viewing the login page, render the login form directly without sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F8FC]">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#6C3BDB] border-t-transparent animate-spin" />
          <span className="text-xs text-[#77738A] font-medium tracking-wide">Loading Client Portal...</span>
        </div>
      </div>
    );
  }

  if (!user || user.user_type !== "client") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F8FC]">
      <React.Suspense fallback={<aside className="w-64 bg-[#120B2E] border-r border-[#24174D]" />}>
        <Sidebar type="portal" />
      </React.Suspense>
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

