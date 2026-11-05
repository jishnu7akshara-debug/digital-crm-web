"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FolderKanban,
  FileText,
  CreditCard,
  Clock,
  UserCog,
  Headphones,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  ShieldCheck,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  type: "internal" | "portal";
}

interface NavItem {
  label: string;
  href: string;
  icon: any;
  permission?: string;
  superAdminOnly?: boolean;
}

export function Sidebar({ type }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const internalNav: NavItem[] = [
    { label: "Dashboard", href: "/internal/dashboard", icon: LayoutDashboard },
    { label: "Leads", href: "/internal/leads", icon: Users, permission: "leads.read" },
    { label: "Clients", href: "/internal/clients", icon: Building2, permission: "clients.read" },
    { label: "Projects", href: "/internal/projects", icon: FolderKanban, permission: "projects.read" },
    { label: "Tasks", href: "/internal/tasks", icon: CheckSquare, permission: "tasks.read" },
    { label: "Invoices", href: "/internal/invoices", icon: FileText, permission: "invoices.read" },
    { label: "Attendance", href: "/internal/attendance", icon: Clock, permission: "attendance.read" },
    { label: "Support", href: "/internal/support", icon: Headphones, permission: "support.read" },
    { label: "Roles & RBAC", href: "/internal/settings/roles", icon: ShieldCheck, superAdminOnly: true },
  ];

  const portalNav: NavItem[] = [
    { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
    { label: "Projects", href: "/portal/projects", icon: FolderKanban },
    { label: "Invoices", href: "/portal/invoices", icon: FileText },
    { label: "Support", href: "/portal/support", icon: Headphones },
  ];

  const navItems = type === "internal" ? internalNav : portalNav;

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 bg-[#25124D] text-[#E9E5F0] border-r border-[#3F2577] transition-all duration-200 z-30 select-none",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#3F2577]">
        {!collapsed && (
          <Link href={type === "internal" ? "/internal/dashboard" : "/portal"} className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-[#6C3BDB] flex items-center justify-center font-bold text-white text-base shadow-sm">
              DF
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wide text-white leading-none">Digital Footprint</span>
              <span className="text-[10px] text-[#9D95B5] mt-1 font-mono uppercase tracking-wider">
                {type === "internal" ? "OS Console" : "Client Portal"}
              </span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="h-8 w-8 mx-auto rounded-lg bg-[#6C3BDB] flex items-center justify-center font-bold text-white text-base">
            DF
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1.5 rounded-md text-[#9D95B5] hover:text-white hover:bg-[#2F195C] transition-colors",
            collapsed && "mx-auto mt-2"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map((item) => {
          if (item.superAdminOnly && !user?.is_super_admin) return null;
          if (item.permission && !hasPermission(item.permission)) return null;

          const isActive = pathname === item.href || (item.href !== "/internal/dashboard" && item.href !== "/portal" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all group",
                isActive
                  ? "bg-[#381E6E] text-white shadow-sm font-semibold"
                  : "text-[#9D95B5] hover:bg-[#2F195C] hover:text-[#E9E5F0]"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0 transition-colors", isActive ? "text-[#6C3BDB]" : "text-[#9D95B5] group-hover:text-white")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-[#3F2577]">
        <div className="flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center space-x-2 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-[#381E6E] text-[#E9E5F0] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {user?.first_name?.[0] || "U"}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-medium text-white truncate">{user?.full_name || "Authenticated"}</span>
                <span className="text-[10px] text-[#9D95B5] truncate">
                  {user?.is_super_admin ? "Super Admin" : user?.roles?.[0] || "User"}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-8 w-8 mx-auto rounded-full bg-[#381E6E] text-[#E9E5F0] flex items-center justify-center text-xs font-semibold">
              {user?.first_name?.[0] || "U"}
            </div>
          )}

          {!collapsed && (
            <button
              onClick={() => logout()}
              className="p-1.5 rounded-md text-[#9D95B5] hover:text-rose-400 hover:bg-[#2F195C] transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
