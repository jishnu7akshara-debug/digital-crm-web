"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ChevronDown, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface NavTab {
  label: string;
  href: string;
  matchPrefixes: string[];
}

const STAFF_TABS: NavTab[] = [
  { label: "Home", href: "/internal/dashboard", matchPrefixes: ["/internal/dashboard"] },
  { label: "Leads", href: "/internal/leads", matchPrefixes: ["/internal/leads"] },
  { label: "Accounts", href: "/internal/clients", matchPrefixes: ["/internal/clients", "/internal/accounts", "/internal/agreements"] },
  { label: "Opportunities", href: "/internal/opportunities", matchPrefixes: ["/internal/opportunities"] },
  { label: "Projects", href: "/internal/projects", matchPrefixes: ["/internal/projects"] },
  { label: "Invoices", href: "/internal/invoices", matchPrefixes: ["/internal/invoices"] },
  { label: "Reports", href: "/internal/reports", matchPrefixes: ["/internal/reports"] },
];

export function SalesforceHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/internal/clients?search=${encodeURIComponent(searchTerm)}`);
  };

  const initials = user?.first_name && user?.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : "AM";

  return (
    <header className="sticky top-0 z-40 select-none shadow-sm">
      {/* 1. Global Header: 48px `#EAF5FE` */}
      <div className="h-12 bg-[#EAF5FE] border-b border-[#DDDBDA] px-4 flex items-center justify-between">
        {/* Left: Round DF Logo */}
        <Link href="/internal/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-[#0176D3] flex items-center justify-center text-white font-black text-xs shadow-sm hover:opacity-95 transition-opacity">
            DF
          </div>
        </Link>

        {/* Center: 440px Search Pill */}
        <form onSubmit={handleSearch} className="relative w-[440px] max-w-full">
          <input
            type="text"
            placeholder="Search leads, accounts, projects"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 bg-white border border-[#DDDBDA] rounded-full pl-4 pr-9 text-[13px] text-[#181818] placeholder:text-[#706E6B] focus:outline-none focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3] transition-all shadow-inner"
          />
          <button type="submit" className="absolute right-3 top-2 text-[#706E6B] hover:text-[#0176D3]">
            <Search className="h-4 w-4" />
          </button>
        </form>

        {/* Right: User Avatar */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="h-8 w-8 rounded-full bg-[#032D60] text-white flex items-center justify-center font-bold text-xs ring-2 ring-white/60 hover:ring-[#0176D3] transition-all"
            title={user?.full_name || "User Profile"}
          >
            {initials}
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#DDDBDA] rounded-[4px] shadow-lg py-1.5 z-50 text-[13px] text-[#181818]">
              <div className="px-3.5 py-2 border-b border-[#DDDBDA] bg-[#F3F3F3]/50">
                <p className="font-bold text-[#181818] truncate">{user?.full_name || "Sai Varshith"}</p>
                <p className="text-[11px] text-[#5C5C5C] truncate">{user?.email || "admin@digitalfootprint.in"}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded-[3px] bg-[#EAF5FE] text-[#0176D3] text-[10px] font-bold">
                  {user?.is_super_admin ? "Super Admin" : "Admin"}
                </span>
              </div>

              <Link
                href="/internal/settings/roles"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center px-3.5 py-2 hover:bg-[#F3F3F3] text-[#181818]"
              >
                <User className="h-3.5 w-3.5 mr-2 text-[#5C5C5C]" />
                <span>Roles & Settings</span>
              </Link>

              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                className="w-full text-left flex items-center px-3.5 py-2 hover:bg-[#FEDED8] text-[#BA0517]"
              >
                <LogOut className="h-3.5 w-3.5 mr-2" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. White App Bar: 40px `#FFFFFF` */}
      <div className="h-10 bg-white border-b border-[#DDDBDA] px-4 flex items-center justify-between">
        <div className="flex items-center h-full space-x-1">
          <span className="font-bold text-[14px] text-[#181818] pr-5 whitespace-nowrap tracking-tight">
            Digital Footprint
          </span>

          {/* Navigation Tabs */}
          <nav className="flex items-center h-full space-x-0.5 overflow-x-auto">
            {STAFF_TABS.map((tab) => {
              const isActive = tab.matchPrefixes.some((p) => pathname.startsWith(p));
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={`h-10 px-3 flex items-center text-[13px] font-normal transition-colors relative whitespace-nowrap ${
                    isActive
                      ? "text-[#181818] font-bold border-b-[3px] border-[#0176D3]"
                      : "text-[#181818] hover:bg-[#F3F3F3] hover:text-[#0176D3]"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

