"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Compass,
  Calendar,
  Briefcase,
  CheckSquare,
  CreditCard,
  FileText,
  BarChart3,
  UserCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  type: "internal" | "portal";
}

export function Sidebar({ type }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  const [servicesOpen, setServicesOpen] = useState(true);

  const servicesSubItems = [
    { label: "Websites", slug: "websites", href: "/internal/services?category=websites" },
    { label: "Digital Marketing", slug: "digital-marketing", href: "/internal/services?category=digital-marketing" },
    { label: "CRM / ERP", slug: "crm-erp", href: "/internal/services?category=crm-erp" },
    { label: "Branding & Media", slug: "branding-media", href: "/internal/services?category=branding-media" },
    { label: "Others", slug: "others", href: "/internal/services?category=others" },
  ];

  return (
    <aside className="w-64 flex flex-col h-screen sticky top-0 bg-[#120B2E] text-[#E9E5F0] border-r border-[#24174D] z-30 select-none flex-shrink-0">
      {/* Brand Logo Header */}
      <div className="h-20 flex items-center px-6">
        <Link href="/internal/dashboard" className="flex items-center space-x-3">
          {/* Stylized "D" Logo with forward arrowhead cutout */}
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#7340F5] to-[#5524D4] flex items-center justify-center shadow-lg shadow-purple-950/40">
            <svg
              className="h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4 4h7a8 8 0 0 1 8 8 8 8 0 0 1-8 8H4V4zm7 12a4 4 0 0 0 4-4 4 4 0 0 0-4-4H8v8h3z" />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold text-base tracking-tight text-white">Digital</span>
            <span className="font-extrabold text-base tracking-tight text-white -mt-0.5">Footprint</span>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {/* 1. Dashboard */}
        <Link
          href="/internal/dashboard"
          className={cn(
            "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
            pathname === "/internal/dashboard"
              ? "bg-[#6437EA] text-white shadow-md shadow-purple-900/30"
              : "text-[#A298C5] hover:bg-[#1E1346] hover:text-white"
          )}
        >
          <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
          <span>Dashboard</span>
        </Link>

        {/* 2. Leads */}
        <Link
          href="/internal/leads"
          className={cn(
            "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
            pathname.startsWith("/internal/leads")
              ? "bg-[#6437EA] text-white shadow-md shadow-purple-900/30"
              : "text-[#A298C5] hover:bg-[#1E1346] hover:text-white"
          )}
        >
          <Users className="h-4 w-4 flex-shrink-0" />
          <span>Leads</span>
        </Link>

        {/* 3. Clients */}
        <Link
          href="/internal/clients"
          className={cn(
            "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
            pathname.startsWith("/internal/clients")
              ? "bg-[#6437EA] text-white shadow-md shadow-purple-900/30"
              : "text-[#A298C5] hover:bg-[#1E1346] hover:text-white"
          )}
        >
          <Building2 className="h-4 w-4 flex-shrink-0" />
          <span>Clients</span>
        </Link>

        {/* 4. Opportunities */}
        <Link
          href="/internal/opportunities"
          className={cn(
            "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
            pathname.startsWith("/internal/opportunities")
              ? "bg-[#6437EA] text-white shadow-md shadow-purple-900/30"
              : "text-[#A298C5] hover:bg-[#1E1346] hover:text-white"
          )}
        >
          <Compass className="h-4 w-4 flex-shrink-0" />
          <span>Opportunities</span>
        </Link>

        {/* 5. Projects */}
        <Link
          href="/internal/projects"
          className={cn(
            "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
            pathname.startsWith("/internal/projects")
              ? "bg-[#6437EA] text-white shadow-md shadow-purple-900/30"
              : "text-[#A298C5] hover:bg-[#1E1346] hover:text-white"
          )}
        >
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span>Projects</span>
        </Link>

        {/* 6. Services (Collapsible Accordion) */}
        <div>
          <div className="flex items-center justify-between rounded-xl hover:bg-[#1E1346] transition-all">
            <Link
              href="/internal/services"
              className={cn(
                "flex-1 flex items-center space-x-3 px-3.5 py-2.5 rounded-l-xl text-xs font-semibold transition-all",
                pathname.startsWith("/internal/services")
                  ? "text-white font-bold"
                  : "text-[#A298C5] hover:text-white"
              )}
            >
              <Briefcase className="h-4 w-4 flex-shrink-0" />
              <span>Services</span>
            </Link>
            <button
              onClick={() => setServicesOpen(!servicesOpen)}
              className="p-2.5 text-[#A298C5] hover:text-white rounded-r-xl transition-colors"
              title="Toggle submenu"
            >
              {servicesOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {servicesOpen && (
            <div className="pl-7 pr-2 py-1 space-y-0.5 mt-0.5">
              {servicesSubItems.map((sub) => {
                const isSubActive =
                  pathname === "/internal/services" &&
                  (currentCategory === sub.slug || (!currentCategory && sub.slug === "websites"));
                return (
                  <Link
                    key={sub.label}
                    href={sub.href}
                    className={cn(
                      "flex items-center py-1.5 px-2.5 rounded-lg text-[11px] transition-colors",
                      isSubActive
                        ? "text-white font-bold bg-[#1E1346]"
                        : "text-[#A298C5] hover:text-white hover:bg-[#1E1346]/60"
                    )}
                  >
                    <span
                      className={cn(
                        "mr-2 text-[14px] leading-none",
                        isSubActive ? "text-[#9A72F8]" : "text-[#7340F5]"
                      )}
                    >
                      •
                    </span>
                    <span>{sub.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* 7. Tasks & Meetings */}
        <Link
          href="/internal/tasks"
          className={cn(
            "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
            pathname.startsWith("/internal/tasks")
              ? "bg-[#6437EA] text-white shadow-md shadow-purple-900/30"
              : "text-[#A298C5] hover:bg-[#1E1346] hover:text-white"
          )}
        >
          <CheckSquare className="h-4 w-4 flex-shrink-0" />
          <span>Tasks & Meetings</span>
        </Link>

        {/* 8. Billing & Invoices */}
        <Link
          href="/internal/invoices"
          className={cn(
            "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
            pathname.startsWith("/internal/invoices")
              ? "bg-[#6437EA] text-white shadow-md shadow-purple-900/30"
              : "text-[#A298C5] hover:bg-[#1E1346] hover:text-white"
          )}
        >
          <CreditCard className="h-4 w-4 flex-shrink-0" />
          <span>Billing & Invoices</span>
        </Link>

        {/* 9. Contracts & Docs */}
        <Link
          href="/internal/contracts"
          className={cn(
            "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
            pathname.startsWith("/internal/contracts")
              ? "bg-[#6437EA] text-white shadow-md shadow-purple-900/30"
              : "text-[#A298C5] hover:bg-[#1E1346] hover:text-white"
          )}
        >
          <FileText className="h-4 w-4 flex-shrink-0" />
          <span>Contracts & Docs</span>
        </Link>

        {/* 10. Reports & Analytics */}
        <Link
          href="/internal/reports"
          className={cn(
            "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
            pathname.startsWith("/internal/reports")
              ? "bg-[#6437EA] text-white shadow-md shadow-purple-900/30"
              : "text-[#A298C5] hover:bg-[#1E1346] hover:text-white"
          )}
        >
          <BarChart3 className="h-4 w-4 flex-shrink-0" />
          <span>Reports & Analytics</span>
        </Link>

        {/* 11. Team */}
        <Link
          href="/internal/team"
          className={cn(
            "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
            pathname.startsWith("/internal/team")
              ? "bg-[#6437EA] text-white shadow-md shadow-purple-900/30"
              : "text-[#A298C5] hover:bg-[#1E1346] hover:text-white"
          )}
        >
          <UserCheck className="h-4 w-4 flex-shrink-0" />
          <span>Team</span>
        </Link>

        {/* 12. Settings */}
        <Link
          href="/internal/settings/roles"
          className={cn(
            "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
            pathname.startsWith("/internal/settings")
              ? "bg-[#6437EA] text-white shadow-md shadow-purple-900/30"
              : "text-[#A298C5] hover:bg-[#1E1346] hover:text-white"
          )}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Bottom Promo Card: Grow with Digital Footprint */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-[#3B207E] to-[#251356] border border-[#522EB0]/40 rounded-2xl p-4 shadow-lg">
          <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white mb-3">
            <Rocket className="h-4 w-4 text-[#C1A5FF]" />
          </div>
          <h4 className="text-xs font-bold text-white tracking-wide">Grow with Digital Footprint</h4>
          <p className="text-[10px] text-[#C1A5FF] mt-1 leading-relaxed">
            Manage clients, projects, marketing and more — in one place.
          </p>
        </div>
      </div>
    </aside>
  );
}
