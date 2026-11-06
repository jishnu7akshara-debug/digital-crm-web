"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SaasSidebar } from "@/components/layout/saas-sidebar";
import { SaasHeader } from "@/components/layout/saas-header";
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

  // If viewing login page, render login form directly without shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FB]">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#5B4BDB] border-t-transparent animate-spin" />
          <span className="text-xs text-[#64748B] font-medium tracking-wide">
            Loading Digital Footprint OS...
          </span>
        </div>
      </div>
    );
  }

  if (!user || user.user_type !== "internal") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex text-[#0F172A] font-sans">
      {/* 1. Dark Midnight Sidebar (260px) */}
      <React.Suspense fallback={<div className="w-[260px] h-screen bg-[#0B0E23] border-r border-[#1A1F3D]" />}>
        <SaasSidebar />
      </React.Suspense>

      {/* 2. Main Area: Sticky Header + Generous Padded Canvas */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <React.Suspense fallback={<div className="h-16 bg-white border-b border-[#E5E7EB]" />}>
          <SaasHeader />
        </React.Suspense>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
