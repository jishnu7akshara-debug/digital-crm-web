"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Bell,
  Plus,
  HelpCircle,
  User,
  Building,
  FolderPlus,
  Receipt,
  Users,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function SaasHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const displayName = user?.full_name || "Sai Varshith";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
                href="/internal/clients/new"
                onClick={() => setCreateMenuOpen(false)}
                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[13px] text-[#0F172A] hover:bg-[#F8F9FB] transition-colors"
              >
                <Building className="h-4 w-4 text-[#0284C7]" />
                <span>Add Client Account</span>
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
                href="/internal/agreements"
                onClick={() => setCreateMenuOpen(false)}
                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[13px] text-[#0F172A] hover:bg-[#F8F9FB] transition-colors"
              >
                <FileText className="h-4 w-4 text-[#7C3AED]" />
                <span>Create Proposal</span>
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
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div
              className="absolute right-0 top-12 w-80 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              onMouseLeave={() => setNotificationsOpen(false)}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E7EB]">
                <span className="text-[12px] font-bold text-[#0F172A]">Notifications</span>
                <span className="text-[10px] text-[#5B4BDB] font-semibold cursor-pointer">Mark all read</span>
              </div>
              <div className="space-y-2 text-[12px]">
                <div className="p-2 rounded-xl bg-[#F8F9FB] hover:bg-[#EEF2FF] transition-colors cursor-pointer">
                  <div className="font-semibold text-[#0F172A]">Peak Fitness signed agreement</div>
                  <div className="text-[#64748B] text-[11px]">DFA-2026-0001 is now Active · 10m ago</div>
                </div>
                <div className="p-2 rounded-xl hover:bg-[#F8F9FB] transition-colors cursor-pointer">
                  <div className="font-semibold text-[#0F172A]">New lead assigned</div>
                  <div className="text-[#64748B] text-[11px]">Aroma Dew catalogue enquiry · 1h ago</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help Icon */}
        <button
          onClick={() => router.push("/internal/reports")}
          className="h-10 w-10 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8F9FB] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors shadow-xs"
          title="Help & Knowledge Base"
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
              {user?.is_super_admin ? "Super Admin" : "Admin"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
