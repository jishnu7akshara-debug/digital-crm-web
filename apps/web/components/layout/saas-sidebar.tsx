"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  TrendingUp,
  FolderKanban,
  Briefcase,
  CalendarCheck,
  Receipt,
  FileText,
  BarChart3,
  UserCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Rocket,
  Plus,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface NavSubItem {
  label: string;
  href: string;
  category: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  matchPrefixes?: string[];
  subItems?: NavSubItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/internal/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Leads",
    href: "/internal/leads",
    icon: Users,
    badge: "8",
  },
  {
    label: "Clients",
    href: "/internal/clients",
    icon: Building2,
    badge: "142",
    matchPrefixes: ["/internal/clients"],
  },
  {
    label: "Opportunities",
    href: "/internal/opportunities",
    icon: TrendingUp,
    badge: "46",
  },
  {
    label: "Projects",
    href: "/internal/projects",
    icon: FolderKanban,
    badge: "38",
    matchPrefixes: ["/internal/projects"],
  },
  {
    label: "Services",
    href: "/internal/services",
    icon: Briefcase,
    matchPrefixes: ["/internal/services"],
    subItems: [
      { label: "Websites", href: "/internal/services?category=websites", category: "websites" },
      { label: "Digital Marketing", href: "/internal/services?category=digital-marketing", category: "digital-marketing" },
      { label: "CRM / ERP", href: "/internal/services?category=crm-erp", category: "crm-erp" },
      { label: "Branding & Media", href: "/internal/services?category=branding", category: "branding" },
      { label: "Others", href: "/internal/services?category=others", category: "others" },
    ],
  },
  {
    label: "Tasks & Meetings",
    href: "/internal/attendance",
    icon: CalendarCheck,
  },
  {
    label: "Billing & Invoices",
    href: "/internal/invoices",
    icon: Receipt,
    badge: "3",
  },
  {
    label: "Contracts & Docs",
    href: "/internal/agreements",
    icon: FileText,
    badge: "7",
  },
  {
    label: "Reports & Analytics",
    href: "/internal/reports",
    icon: BarChart3,
  },
  {
    label: "Team",
    href: "/internal/attendance",
    icon: UserCheck,
  },
  {
    label: "Settings",
    href: "/internal/settings/roles",
    icon: Settings,
  },
];

export function SaasSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [servicesOpen, setServicesOpen] = useState(true);

  const displayName = user?.full_name || "Sai Varshith";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="w-[260px] h-screen bg-[#0B0E23] text-white flex flex-col justify-between shrink-0 select-none sticky top-0 z-30 border-r border-[#1B1F3B] shadow-2xl">
      {/* Top Section */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center border-b border-[#1A1F3D]">
          <Link href="/internal/dashboard" className="flex items-center space-x-3 group">
            {/* White stylized DF Logo */}
            <div className="h-9 w-9 rounded-xl bg-white text-[#0B0E23] flex items-center justify-center font-black text-lg tracking-tighter shadow-md group-hover:scale-105 transition-transform">
              <span className="font-sans font-black italic">D</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[15px] text-white tracking-tight leading-tight">
                Digital Footprint
              </span>
              <span className="text-[10px] text-[#8E9BB5] font-medium tracking-wide">
                OPERATIONAL OS
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items (Dark Theme matching image) */}
        <div className="px-3 py-4 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const hasSub = item.subItems && item.subItems.length > 0;
            const isDirectActive = item.matchPrefixes
              ? item.matchPrefixes.some((p) => pathname.startsWith(p))
              : pathname === item.href;

            const Icon = item.icon;

            if (hasSub) {
              return (
                <div key={item.label} className="space-y-1">
                  <div
                    onClick={() => setServicesOpen(!servicesOpen)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all cursor-pointer ${
                      isDirectActive
                        ? "bg-[#5B4BDB] text-white shadow-md font-semibold"
                        : "text-[#94A3B8] hover:text-white hover:bg-[#151938]"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`h-[18px] w-[18px] stroke-[1.8] ${
                          isDirectActive ? "text-white" : "text-[#8E9BB5]"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {servicesOpen ? (
                      <ChevronDown className="h-4 w-4 text-[#8E9BB5]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#8E9BB5]" />
                    )}
                  </div>

                  {servicesOpen && (
                    <div className="pl-9 pr-2 py-1 space-y-1">
                      {item.subItems!.map((sub) => {
                        return (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            className="flex items-center space-x-2.5 py-1.5 px-2 rounded-lg text-[13px] text-[#8E9BB5] hover:text-white hover:bg-[#151938] transition-colors group"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-[#5B4BDB] group-hover:scale-125 transition-transform" />
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all ${
                  isDirectActive
                    ? "bg-[#5B4BDB] text-white shadow-md font-semibold"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#151938]"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`h-[18px] w-[18px] stroke-[1.8] ${
                      isDirectActive ? "text-white" : "text-[#8E9BB5]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                      isDirectActive
                        ? "bg-white/20 text-white"
                        : "bg-[#1E2448] text-[#8E9BB5]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Promo Card at Bottom: "Grow with Digital Footprint" */}
        <div className="p-3 mx-3 mb-3 rounded-2xl bg-gradient-to-br from-[#1E1B4B] to-[#141233] border border-[#3730A3]/30 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-1.5">
            <div className="h-8 w-8 rounded-xl bg-[#5B4BDB] text-white flex items-center justify-center shadow-md">
              <Rocket className="h-4 w-4" />
            </div>
            <div className="text-[13px] font-bold text-white tracking-tight">
              Grow with Digital Footprint
            </div>
            <div className="text-[11px] text-[#94A3B8] leading-snug">
              Manage clients, projects, marketing and more — in one place.
            </div>
          </div>
          {/* Subtle background glow */}
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#5B4BDB]/20 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* User Card at Very Bottom */}
      <div className="p-3 border-t border-[#1A1F3D] bg-[#090C1F]">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#151938] transition-colors">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-[#5B4BDB] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="truncate">
              <div className="text-[13px] font-semibold text-white truncate leading-tight">
                {displayName}
              </div>
              <div className="text-[11px] text-[#8E9BB5] truncate">
                {user?.is_super_admin ? "Super Admin" : "Admin"}
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="p-1.5 text-[#8E9BB5] hover:text-[#EF4444] hover:bg-[#2A1828] rounded-lg transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4 w-4 stroke-[1.8]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
