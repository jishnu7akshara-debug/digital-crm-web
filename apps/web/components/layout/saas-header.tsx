"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Bell,
  Plus,
  HelpCircle,
  Building,
  FolderPlus,
  Receipt,
  Users,
  FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link_url: string | null;
  notification_type: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export function SaasHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const displayName = user?.full_name || "Digital Admin";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Fetch real notifications
  const { data: notifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      try {
        const res = await api.get<NotificationItem[]>("/notifications?limit=10");
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.post("/notifications/read-all", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/internal/clients?search=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] px-8 flex items-center justify-between sticky top-0 z-20 select-none shadow-xs">
      {/* Left: Global Search Input */}
      <form onSubmit={handleSearch} className="relative w-[440px] max-w-full">
        <div className="relative flex items-center">
          <Search className="h-4 w-4 text-[#94A3B8] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search clients, projects, leads, invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 bg-[#F8F9FB] border border-[#E5E7EB] rounded-xl pl-10 pr-4 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:bg-white transition-all shadow-inner"
          />
        </div>
      </form>

      {/* Right: + Create Button, Bell, Help, User Profile */}
      <div className="flex items-center space-x-4">
        {/* + Create Action Button */}
        <div className="relative">
          <button
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
            className="h-10 px-4 bg-[#5B4BDB] hover:bg-[#4C3DC7] text-white text-[13px] font-semibold rounded-xl transition-all flex items-center space-x-1.5 shadow-sm active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.2]" />
            <span>Create</span>
          </button>

          {/* Quick Create Dropdown Menu */}
          {createMenuOpen && (
            <div
              className="absolute right-0 top-12 w-52 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              onMouseLeave={() => setCreateMenuOpen(false)}
            >
              <div className="px-3 py-1.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                Quick Actions
              </div>
              <Link
                href="/internal/leads"
                onClick={() => setCreateMenuOpen(false)}
                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[13px] text-[#0F172A] hover:bg-[#F8F9FB] transition-colors"
              >
                <Users className="h-4 w-4 text-[#5B4BDB]" />
                <span>New Lead</span>
              </Link>
              <Link
                href="/internal/clients"
                onClick={() => setCreateMenuOpen(false)}
                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[13px] text-[#0F172A] hover:bg-[#F8F9FB] transition-colors"
              >
                <Building className="h-4 w-4 text-[#0284C7]" />
                <span>Clients</span>
              </Link>
              <Link
                href="/internal/projects"
                onClick={() => setCreateMenuOpen(false)}
                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[13px] text-[#0F172A] hover:bg-[#F8F9FB] transition-colors"
              >
                <FolderPlus className="h-4 w-4 text-[#059669]" />
                <span>Create Project</span>
              </Link>
              <Link
                href="/internal/invoices"
                onClick={() => setCreateMenuOpen(false)}
                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[13px] text-[#0F172A] hover:bg-[#F8F9FB] transition-colors"
              >
                <Receipt className="h-4 w-4 text-[#D97706]" />
                <span>Draft Invoice</span>
              </Link>
              <Link
                href="/internal/opportunities"
                onClick={() => setCreateMenuOpen(false)}
                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[13px] text-[#0F172A] hover:bg-[#F8F9FB] transition-colors"
              >
                <FileText className="h-4 w-4 text-[#7C3AED]" />
                <span>New Proposal</span>
              </Link>
            </div>
          )}
        </div>

        {/* Notifications Icon with Indicator */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="h-10 w-10 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8F9FB] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] relative transition-colors shadow-xs"
            title="Notifications"
          >
            <Bell className="h-4 w-4 stroke-[1.8]" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[#EF4444] ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div
              className="absolute right-0 top-12 w-80 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              onMouseLeave={() => setNotificationsOpen(false)}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E7EB]">
                <span className="text-[12px] font-bold text-[#0F172A]">
                  Notifications ({unreadCount} new)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-[10px] text-[#5B4BDB] font-semibold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-2 text-[12px] max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#94A3B8]">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!item.is_read) markReadMutation.mutate(item.id);
                        if (item.link_url) router.push(item.link_url);
                      }}
                      className={`p-2.5 rounded-xl transition-colors cursor-pointer border ${
                        item.is_read
                          ? "bg-white border-[#F1F5F9] text-[#64748B]"
                          : "bg-[#F8F9FB] border-[#EEF2FF] hover:bg-[#EEF2FF]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`text-[12px] ${item.is_read ? "font-medium" : "font-semibold text-[#0F172A]"}`}>
                          {item.title}
                        </span>
                        {!item.is_read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#5B4BDB] shrink-0 mt-1" />
                        )}
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2">
                        {item.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Help Icon */}
        <button
          onClick={() => router.push("/internal/reports")}
          className="h-10 w-10 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8F9FB] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors shadow-xs"
          title="Help & Reports"
        >
          <HelpCircle className="h-4 w-4 stroke-[1.8]" />
        </button>

        {/* User Avatar + Profile Info */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-[#E5E7EB]">
          <div className="h-9 w-9 rounded-full bg-[#5B4BDB] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-[#EEF2FF]">
            {initials}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[13px] font-bold text-[#0F172A] leading-tight">
              {displayName}
            </span>
            <span className="text-[11px] text-[#64748B] font-medium leading-none mt-0.5">
              {user?.is_super_admin ? "Super Admin" : "Staff"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
