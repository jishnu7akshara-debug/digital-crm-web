"use client";

import React, { useState } from "react";
import { Bell, Search, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();
  const [punching, setPunching] = useState(false);
  const [punchStatus, setPunchStatus] = useState<string | null>(null);

  const handlePunch = async () => {
    setPunching(true);
    try {
      const res = await api.post<any>("/attendance/punch");
      setPunchStatus(`${res.punch_type === "check_in" ? "In" : "Out"} @ ${res.timestamp_local}`);
      setTimeout(() => setPunchStatus(null), 5000);
    } catch (err: any) {
      alert(err.message || "Attendance punch failed.");
    } finally {
      setPunching(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#E9E5F0] px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        {title && <h1 className="text-lg font-semibold text-[#1D1930] leading-none">{title}</h1>}
        {subtitle && <p className="text-xs text-[#77738A] mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-3">
        {/* Attendance Punch (Internal staff only) */}
        {user?.user_type === "internal" && (
          <div className="flex items-center space-x-2">
            {punchStatus && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                {punchStatus}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePunch}
              isLoading={punching}
              className="border-[#E9E5F0] text-xs font-medium"
            >
              <Clock className="h-3.5 w-3.5 mr-1.5 text-[#6C3BDB]" />
              Quick Punch
            </Button>
          </div>
        )}

        {/* Notifications Bell */}
        <button className="p-2 rounded-full text-[#77738A] hover:bg-[#F5F1FF] hover:text-[#6C3BDB] transition-colors relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#6C3BDB]" />
        </button>

        {/* Organization / User Pill */}
        <div className="hidden sm:flex items-center pl-3 border-l border-[#E9E5F0] space-x-2">
          <div className="h-7 w-7 rounded-full bg-[#F5F1FF] text-[#6C3BDB] font-semibold text-xs flex items-center justify-center">
            {user?.first_name?.[0] || "U"}
          </div>
          <span className="text-xs font-medium text-[#1D1930]">{user?.full_name}</span>
        </div>
      </div>
    </header>
  );
}
