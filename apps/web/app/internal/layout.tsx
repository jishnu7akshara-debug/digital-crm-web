"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { SaasSidebar } from "@/components/layout/saas-sidebar";
import { SaasHeader } from "@/components/layout/saas-header";
import { useAuth } from "@/lib/auth-context";
import { ServiceUnavailable } from "@/components/ui/states";

const ROUTE_PERMISSIONS = [
  { prefix: "/internal/settings", permission: "settings.read" },
  { prefix: "/internal/team", permission: "employees.read" },
  { prefix: "/internal/reports", permission: "reports.read" },
  { prefix: "/internal/attendance", permission: "attendance.read" },
  { prefix: "/internal/invoices", permission: "invoices.read" },
  { prefix: "/internal/leads", permission: "leads.read" },
  { prefix: "/internal/clients", permission: "clients.read" },
  { prefix: "/internal/projects", permission: "projects.read" },
  { prefix: "/internal/opportunities", permission: "proposals.read" },
  { prefix: "/internal/services", permission: "services.read" },
  { prefix: "/internal/support", permission: "support.read" },
];

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const { user, status, isLoading, hasPermission, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/internal/login";

  useEffect(() => {
    if (isLoading || status === "loading" || status === "unavailable") return;

    if (isLoginPage) {
      if (status === "authenticated" && user && user.user_type === "internal") {
        router.push(user.home_route || "/internal/dashboard");
      }
    } else {
      if (status === "unauthenticated") {
        router.push("/internal/login");
      } else if (status === "authenticated" && user && user.user_type === "client") {
        router.push("/portal");
      }
    }
  }, [user, status, isLoading, isLoginPage, router]);

  // If viewing login page, render login form directly without shell
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
        className="flex items-center justify-center min-h-screen bg-[#F8F9FB]"
      >
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

  // Check route-level RBAC permission
  const matchingRule = ROUTE_PERMISSIONS.find((r) => pathname.startsWith(r.prefix));
  const hasRouteAccess = !matchingRule || hasPermission(matchingRule.permission);

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex text-[#0F172A] font-sans">
      {/* 1. Dark Midnight Sidebar (260px) */}
      <React.Suspense fallback={<div className="w-[260px] h-screen bg-[#0B0E23] border-r border-[#1A1F3D]" />}>
        <SaasSidebar />
      </React.Suspense>

      {/* 2. Main Area: Sticky Header + Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <React.Suspense fallback={<div className="h-16 bg-white border-b border-[#E5E7EB]" />}>
          <SaasHeader />
        </React.Suspense>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto space-y-6">
          {!hasRouteAccess ? (
            <div
              data-testid="access-denied-403"
              className="bg-white border border-[#E5E7EB] rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm space-y-4 my-12"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#FFF1F2] border border-[#FFE4E6] text-[#E11D48] flex items-center justify-center mx-auto shadow-inner">
                <ShieldAlert className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFF1F2] text-[#E11D48] text-[11px] font-bold uppercase tracking-wider">
                  403 Forbidden
                </span>
                <h2 className="text-lg font-bold text-[#0F172A] mt-2">
                  Access Denied
                </h2>
                <p className="text-[13px] text-[#64748B] mt-1">
                  You do not have the required permission (
                  <code className="text-[#5B4BDB] font-mono font-semibold">{matchingRule?.permission}</code>
                  ) to view this section.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/internal/dashboard"
                  className="inline-flex items-center space-x-2 h-9 px-4 bg-[#5B4BDB] hover:bg-[#4C3DC7] text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Dashboard</span>
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
