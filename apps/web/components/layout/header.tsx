"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Bell,
  HelpCircle,
  User,
  UserPlus,
  FolderPlus,
  FilePlus,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const displayName = user?.full_name && user.full_name !== "Digital SuperAdmin" ? user.full_name : "Sai Varshith";
  const displayRole = user?.is_super_admin ? "Admin" : user?.roles?.[0] || "Admin";

  return (
    <header className="h-16 bg-white border-b border-[#EBE8F3] px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Global Search Bar */}
      <div className="relative w-96">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#9D95B5]" />
        <input
          type="text"
          placeholder="Search clients, projects, leads, invoices..."
          className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl pl-10 pr-4 py-2 text-xs text-[#1D1930] placeholder:text-[#9D95B5] focus:outline-none focus:ring-1 focus:ring-[#6437EA] focus:border-[#6437EA] transition-all"
        />
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center space-x-4">
        {/* + Create Button with Dropdown */}
        <div className="relative">
          <Button
            size="sm"
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
            className="bg-[#6437EA] hover:bg-[#5528DA] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-purple-900/10 flex items-center space-x-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Create</span>
          </Button>

          {createMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#ECE9F4] rounded-xl shadow-xl py-2 z-50 text-xs">
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  router.push("/internal/leads");
                }}
                className="w-full text-left px-4 py-2 hover:bg-[#F6F5FA] flex items-center space-x-2 text-[#1D1930]"
              >
                <UserPlus className="h-3.5 w-3.5 text-[#6437EA]" />
                <span>Add Lead</span>
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  router.push("/internal/projects");
                }}
                className="w-full text-left px-4 py-2 hover:bg-[#F6F5FA] flex items-center space-x-2 text-[#1D1930]"
              >
                <FolderPlus className="h-3.5 w-3.5 text-[#6437EA]" />
                <span>Create Project</span>
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  router.push("/internal/invoices");
                }}
                className="w-full text-left px-4 py-2 hover:bg-[#F6F5FA] flex items-center space-x-2 text-[#1D1930]"
              >
                <FilePlus className="h-3.5 w-3.5 text-[#6437EA]" />
                <span>Create Invoice</span>
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  router.push("/internal/clients");
                }}
                className="w-full text-left px-4 py-2 hover:bg-[#F6F5FA] flex items-center space-x-2 text-[#1D1930]"
              >
                <Building className="h-3.5 w-3.5 text-[#6437EA]" />
                <span>Add Client</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon with Red Dot */}
        <button className="relative p-2 rounded-xl text-[#77738A] hover:bg-[#F6F5FA] transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* Help Circle */}
        <button className="p-2 rounded-xl text-[#77738A] hover:bg-[#F6F5FA] transition-colors">
          <HelpCircle className="h-4 w-4" />
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center space-x-3 pl-2 border-l border-[#ECE9F4]">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#7340F5] to-[#FF8DAA] p-0.5 shadow-sm">
            <div className="h-full w-full rounded-full bg-white flex items-center justify-center font-bold text-xs text-[#6437EA]">
              SV
            </div>
          </div>
          <div className="flex flex-col text-left leading-tight">
            <span className="text-xs font-bold text-[#1D1930]">{displayName}</span>
            <span className="text-[10px] text-[#77738A] font-medium">{displayRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
