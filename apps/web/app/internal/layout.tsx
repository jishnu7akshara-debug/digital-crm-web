"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SalesforceHeader } from "@/components/layout/sf-header";
import { useAuth } from "@/lib/auth-context";

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/internal/login";

  useEffect(() => {
    if (isLoading) return;

    if (isLoginPage) {
      if (user && user.user_type === "internal") {
        router.push("/internal/dashboard");
      }
    } else {
      if (!user) {
        router.push("/internal/login");
      } else if (user.user_type === "client") {
        router.push("/portal");
      }
    }
  }, [user, isLoading, isLoginPage, router]);

  // If viewing the login page, render the login form directly without header
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F3F3F3]">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#0176D3] border-t-transparent animate-spin" />
          <span className="text-xs text-[#5C5C5C] font-medium tracking-wide">Loading Digital Footprint...</span>
        </div>
      </div>
    );
  }

  if (!user || user.user_type !== "internal") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F3F3F3] flex flex-col text-[#181818]">
      <React.Suspense fallback={<div className="h-[88px] bg-[#EAF5FE]" />}>
        <SalesforceHeader />
      </React.Suspense>
      <div className="flex-1 p-3 overflow-y-auto max-w-[1600px] w-full mx-auto">
        {children}
      </div>
    </div>
  );
}

