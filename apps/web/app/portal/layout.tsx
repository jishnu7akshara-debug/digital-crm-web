"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/lib/auth-context";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/portal/login");
    } else if (!isLoading && user && user.user_type === "internal") {
      router.push("/internal/dashboard");
    }
  }, [user, isLoading, router]);

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
      <Sidebar type="portal" />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
