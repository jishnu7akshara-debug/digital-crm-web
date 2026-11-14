"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface NavTab {
  label: string;
  href: string;
}

const PORTAL_TABS: NavTab[] = [
  { label: "Home", href: "/portal" },
  { label: "My Projects", href: "/portal/projects" },
  { label: "Approvals", href: "/portal/approvals" },
  { label: "Agreements", href: "/portal/agreements" },
  { label: "Invoices", href: "/portal/invoices" },
  { label: "Support", href: "/portal/support" },
];

export function PortalHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const contactName = user?.full_name || "Client User";
  const clientName = user?.user_type === "client" ? "Partner Portal" : "Client Portal";
  const userInitials = contactName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 select-none bg-white border-b border-[#E5E7EB] shadow-card">
      <div className="h-16 px-8 flex items-center justify-between max-w-[1600px] mx-auto">
        {/* Left: Brand + Navigation Tabs */}
        <div className="flex items-center h-full space-x-8">
          <Link href="/portal" className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#0F172A] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-soft">
              DF
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[15px] text-[#0F172A] tracking-tight">
                  Digital Footprint
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-[10px] font-bold">
                  Client Portal
                </span>
              </div>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <nav className="flex items-center h-full space-x-1 overflow-x-auto">
            {PORTAL_TABS.map((tab) => {
              const isActive =
                tab.href === "/portal"
                  ? pathname === "/portal"
                  : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={`h-10 px-3.5 flex items-center text-[13.5px] font-medium rounded-xl transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#EEF2FF] text-[#5B4BDB] font-semibold"
                      : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8F9FB]"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: User info (Arjun S · Peak Fitness) */}
        <div className="relative flex items-center space-x-3">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2.5 p-1.5 rounded-full border border-[#E5E7EB] hover:bg-[#F8F9FB] transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs">
              {userInitials}
            </div>
            <span className="text-[13px] font-semibold text-[#0F172A] pr-2">
              {contactName} · {clientName}
            </span>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-12 mt-1 w-56 bg-white border border-[#E5E7EB] rounded-2xl shadow-dropdown py-2 z-50 text-[13px] text-[#0F172A]">
              <div className="px-4 py-2 border-b border-[#E5E7EB]">
                <p className="font-bold text-[#0F172A]">{contactName}</p>
                <p className="text-[12px] text-[#64748B]">{clientName}</p>
              </div>

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                className="w-full text-left flex items-center px-4 py-2 hover:bg-[#FFF1F2] text-[#E11D48] transition-colors"
              >
                <LogOut className="h-3.5 w-3.5 mr-2" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
