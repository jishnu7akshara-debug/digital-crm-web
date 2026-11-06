"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
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

  const clientName = "Peak Fitness";
  const contactName = user?.full_name && user.full_name !== "Digital SuperAdmin" ? user.full_name : "Arjun S";
  const userInitials = contactName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 select-none shadow-sm">
      {/* 56px Navy Bar: `#032D60` */}
      <div className="h-14 bg-[#032D60] px-6 flex items-center justify-between">
        <div className="flex items-center h-full space-x-6">
          <Link href="/portal" className="font-bold text-[15px] text-white tracking-wide">
            Digital Footprint
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
                  className={`h-14 px-3 flex items-center text-[13px] font-medium transition-colors relative whitespace-nowrap ${
                    isActive
                      ? "text-white font-bold border-b-4 border-[#0176D3]"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: User information (Arjun S · Peak Fitness) */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2 text-white text-[13px] hover:text-white/80 transition-colors"
          >
            <span>{contactName} · {clientName}</span>
            <div className="h-7 w-7 rounded-full bg-[#0176D3] text-white flex items-center justify-center font-bold text-xs ring-1 ring-white/50">
              {userInitials}
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-[#DDDBDA] rounded-[4px] shadow-lg py-1 z-50 text-[13px] text-[#181818]">
              <div className="px-3 py-2 border-b border-[#DDDBDA]">
                <p className="font-bold">{contactName}</p>
                <p className="text-[11px] text-[#5C5C5C]">{clientName}</p>
              </div>

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                className="w-full text-left flex items-center px-3 py-2 hover:bg-[#FEDED8] text-[#BA0517]"
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

