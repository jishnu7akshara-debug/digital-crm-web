"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Fingerprint,
  ChevronDown,
  Eye,
  X,
  Home,
  Check,
  CalendarDays,
  ShieldAlert,
  ArrowRight,
  Filter,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast as sonnerToast } from "sonner";

interface AttendanceRecordItem {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_designation: string;
  employee_initials: string;
  date: string;
  day_of_week: string;
  check_in_local?: string;
  check_out_local?: string;
  status: string;
  working_minutes: number;
  working_hours_display: string;
  is_missing_punch: boolean;
  is_correction: boolean;
  correction_status?: string;
}

interface PaginatedAttendance {
  items: AttendanceRecordItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface TodayPunchStatus {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  designation: string;
  current_date_ist: string;
  current_time_ist: string;
  day_of_week: string;
  state: "not_punched_in" | "punched_in" | "completed";
  can_punch_in: boolean;
  can_punch_out: boolean;
  is_completed: boolean;
  check_in_local?: string;
  check_out_local?: string;
  working_minutes: number;
  working_hours_display: string;
  status?: string;
}

interface AttendanceSummary {
  total_days: number;
  present_days: number;
  half_days: number;
  leave_days: number;
  period_label: string;
}

interface AttendanceRecordDetail {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  designation: string;
  department: string;
  date: string;
  day_of_week: string;
  check_in_local?: string;
  check_out_local?: string;
  check_in_utc?: string;
  check_out_utc?: string;
  working_minutes: number;
  working_hours_display: string;
  status: string;
  status_rule_explanation: string;
  is_missing_punch: boolean;
  is_correction: boolean;
  correction_status?: string;
  correction_reason?: string;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Filters
  const [filterRange, setFilterRange] = useState<string>("this_month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  // Modals state
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [viewDetailModalOpen, setViewDetailModalOpen] = useState(false);

  // Live IST Clock
  const [liveIstTime, setLiveIstTime] = useState("");

  // Notification Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Admin correction inside View Details
  const [adminStatusCorrection, setAdminStatusCorrection] = useState("");
  const [adminCorrectionReason, setAdminCorrectionReason] = useState("");
  const [correctionSuccessMsg, setCorrectionSuccessMsg] = useState<string | null>(null);

  // Live timer for IST time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format in Asia/Kolkata
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      const dateOptions: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
      };
      const timeStr = new Intl.DateTimeFormat("en-US", options).format(now);
      const dateStr = new Intl.DateTimeFormat("en-US", dateOptions).format(now);
      setLiveIstTime(`${timeStr}, ${dateStr} (IST)`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 1. Fetch Today's Punch Status
  const { data: punchStatusData, refetch: refetchPunchStatus } = useQuery<TodayPunchStatus>({
    queryKey: ["today-punch-status"],
    queryFn: async () => {
      const res = await api.get<TodayPunchStatus>("/attendance/today-status");
      return res;
    },
  });

  // 2. Fetch Summary Statistics
  const { data: summaryData, refetch: refetchSummary } = useQuery<AttendanceSummary>({
    queryKey: ["attendance-summary", filterRange, startDate, endDate],
    queryFn: async () => {
      let url = `/attendance/summary?filter_range=${filterRange}`;
      if (filterRange === "custom" && startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }
      return api.get<AttendanceSummary>(url);
    },
  });

  // 3. Fetch Attendance Logs Table
  const { data: recordsData, isLoading: isRecordsLoading, refetch: refetchRecords } = useQuery<PaginatedAttendance>({
    queryKey: ["attendance-records", filterRange, startDate, endDate],
    queryFn: async () => {
      let url = `/attendance/records?filter_range=${filterRange}&page_size=50`;
      if (filterRange === "custom" && startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }
      return api.get<PaginatedAttendance>(url);
    },
  });

  // 4. Fetch Record Detail for View Modal
  const { data: detailData, isLoading: isDetailLoading, refetch: refetchDetail } = useQuery<AttendanceRecordDetail>({
    queryKey: ["attendance-detail", selectedRecordId],
    queryFn: async () => {
      if (!selectedRecordId) throw new Error("No record selected");
      return api.get<AttendanceRecordDetail>(`/attendance/records/${selectedRecordId}`);
    },
    enabled: !!selectedRecordId,
  });

  // Punch Mutation
  const punchMutation = useMutation({
    mutationFn: async (action: "check_in" | "check_out") => {
      return api.post<any>("/attendance/punch", { action });
    },
    onSuccess: (res: any) => {
      const actionTitle = res.punch_type === "check_in" ? "Punch In" : "Punch Out";
      setToast({
        type: "success",
        message: `${actionTitle} recorded successfully at ${res.timestamp_local} (${res.status.toUpperCase()}).`,
      });
      setTimeout(() => setToast(null), 5000);

      setIsPunchModalOpen(false);

      // Invalidate and refresh queries smoothly
      queryClient.invalidateQueries({ queryKey: ["today-punch-status"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
    },
    onError: (err: any) => {
      setToast({
        type: "error",
        message: err.message || "Failed to record punch. Please try again.",
      });
      setTimeout(() => setToast(null), 6000);
    },
  });

  // Admin Correction Mutation
  const adminCorrectMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRecordId) return;
      return api.put<any>(`/attendance/records/${selectedRecordId}/admin-correct`, {
        status: adminStatusCorrection || undefined,
        reason: adminCorrectionReason || "Administrative verification adjustment",
      });
    },
    onSuccess: () => {
      setCorrectionSuccessMsg("Record updated successfully with audit trail.");
      setTimeout(() => setCorrectionSuccessMsg(null), 4000);
      refetchDetail();
      refetchRecords();
      refetchSummary();
    },
    onError: (err: any) => {
      sonnerToast.error(err.message || "Admin correction failed.");
    },
  });

  // Body scroll lock & Escape listener for open modals
  useEffect(() => {
    if (isPunchModalOpen || viewDetailModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPunchModalOpen, viewDetailModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPunchModalOpen(false);
        setViewDetailModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleOpenPunchModal = () => {
    refetchPunchStatus();
    setViewDetailModalOpen(false);
    setIsPunchModalOpen(true);
  };

  const handleViewRecord = (id: string) => {
    setIsPunchModalOpen(false);
    setSelectedRecordId(id);
    setViewDetailModalOpen(true);
    setAdminStatusCorrection("");
    setAdminCorrectionReason("");
    setCorrectionSuccessMsg(null);
  };

  const formatDisplayDate = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoDate;
    }
  };

  const filterLabels: Record<string, string> = {
    today: "Today",
    this_week: "This Week",
    this_month: "This Month",
    custom: "Custom Date",
  };

  return (
    <div className="space-y-6 select-none max-w-[1550px] mx-auto pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-[13px] font-semibold border animate-in fade-in slide-in-from-bottom-4 duration-200 ${
            toast.type === "success"
              ? "bg-[#0F172A] text-white border-emerald-500/30"
              : "bg-[#7F1D1D] text-white border-red-500/40"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-300 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. Breadcrumb + Hero Banner with Calendar Graphic */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 md:p-8 shadow-card relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-[12px] font-medium text-[#64748B] mb-2">
            <Home className="h-3.5 w-3.5 text-[#94A3B8]" />
            <span>/</span>
            <span>Operations & Team</span>
            <span>&gt;</span>
            <span className="text-[#5B4BDB] font-semibold">Attendance & Work Logs</span>
          </div>

          <h1 className="text-2xl md:text-[28px] font-extrabold text-[#0F172A] tracking-tight">
            Attendance & Work Logs
          </h1>
          <p className="text-[14px] text-[#64748B] mt-1.5 leading-relaxed">
            Track your attendance and view daily work logs in one place.
          </p>
        </div>

        {/* Modern 3D Calendar & Clock Vector Illustration */}
        <div className="relative z-10 shrink-0 flex items-center justify-end">
          <div className="w-56 h-28 relative flex items-center justify-center">
            {/* Soft decorative background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#EEF2FF] to-[#E0E7FF] rounded-2xl blur-lg opacity-70" />

            {/* SVG Calendar & Clock Illustration */}
            <svg
              className="w-48 h-28 drop-shadow-md relative"
              viewBox="0 0 200 110"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Back foliage / leaves */}
              <path
                d="M175 40C185 30 195 45 190 60C185 70 170 65 175 40Z"
                fill="#C7D2FE"
                opacity="0.8"
              />
              <path
                d="M165 65C175 60 185 75 180 85C175 92 162 85 165 65Z"
                fill="#A5B4FC"
                opacity="0.7"
              />

              {/* Main Calendar Card */}
              <rect x="25" y="15" width="120" height="85" rx="14" fill="#FFFFFF" stroke="#E0E7FF" strokeWidth="2" />
              <rect x="25" y="15" width="120" height="26" rx="14" fill="#5B4BDB" />
              {/* Calendar binder rings */}
              <rect x="45" y="8" width="6" height="14" rx="3" fill="#4338CA" />
              <rect x="75" y="8" width="6" height="14" rx="3" fill="#4338CA" />
              <rect x="105" y="8" width="6" height="14" rx="3" fill="#4338CA" />

              {/* Grid dots on calendar */}
              <circle cx="45" cy="55" r="3.5" fill="#EEF2FF" stroke="#5B4BDB" strokeWidth="1.5" />
              <circle cx="65" cy="55" r="3.5" fill="#E2E8F0" />
              <circle cx="85" cy="55" r="3.5" fill="#E2E8F0" />
              <circle cx="105" cy="55" r="3.5" fill="#E2E8F0" />
              <circle cx="125" cy="55" r="3.5" fill="#E2E8F0" />

              <circle cx="45" cy="72" r="3.5" fill="#E2E8F0" />
              <circle cx="65" cy="72" r="3.5" fill="#5B4BDB" />
              <circle cx="85" cy="72" r="3.5" fill="#E2E8F0" />
              <circle cx="105" cy="72" r="3.5" fill="#E2E8F0" />
              <circle cx="125" cy="72" r="3.5" fill="#E2E8F0" />

              <circle cx="45" cy="88" r="3.5" fill="#E2E8F0" />
              <circle cx="65" cy="88" r="3.5" fill="#E2E8F0" />
              <circle cx="85" cy="88" r="3.5" fill="#E2E8F0" />
              <circle cx="105" cy="88" r="3.5" fill="#E2E8F0" />

              {/* Floating Clock */}
              <circle cx="145" cy="62" r="26" fill="#FFFFFF" stroke="#5B4BDB" strokeWidth="3.5" />
              <circle cx="145" cy="62" r="21" fill="#EEF2FF" />
              {/* Clock hands pointing at 10:30 */}
              <line x1="145" y1="62" x2="137" y2="48" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
              <line x1="145" y1="62" x2="155" y2="62" stroke="#5B4BDB" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="145" cy="62" r="3" fill="#0F172A" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Top Summary Cards + Action Button Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Days */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-card hover:shadow-dropdown transition-all flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-[#F0EDFD] text-[#5B4BDB] flex items-center justify-center shrink-0">
            <CalendarDays className="h-6 w-6 stroke-[2]" />
          </div>
          <div>
            <span className="text-[12px] font-semibold text-[#64748B]">Total Days</span>
            <div className="text-2xl font-black text-[#0F172A] mt-0.5 tracking-tight">
              {summaryData?.total_days ?? 1}
            </div>
            <span className="text-[11px] text-[#94A3B8] font-medium">
              {summaryData?.period_label || "This Month"}
            </span>
          </div>
        </div>

        {/* Card 2: Present Days */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-card hover:shadow-dropdown transition-all flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-[#E8FAF0] text-[#10B981] flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[12px] font-semibold text-[#64748B]">Present Days</span>
            <div className="text-2xl font-black text-[#0F172A] mt-0.5 tracking-tight">
              {summaryData?.present_days ?? 1}
            </div>
            <span className="text-[11px] text-[#94A3B8] font-medium">
              {summaryData?.period_label || "This Month"}
            </span>
          </div>
        </div>

        {/* Card 3: Half Days */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-card hover:shadow-dropdown transition-all flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-[#FFF2E8] text-[#F97316] flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6 stroke-[2]" />
          </div>
          <div>
            <span className="text-[12px] font-semibold text-[#64748B]">Half Days</span>
            <div className="text-2xl font-black text-[#0F172A] mt-0.5 tracking-tight">
              {summaryData?.half_days ?? 0}
            </div>
            <span className="text-[11px] text-[#94A3B8] font-medium">
              {summaryData?.period_label || "This Month"}
            </span>
          </div>
        </div>

        {/* Card 4: Leaves */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-card hover:shadow-dropdown transition-all flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-[#EBF5FF] text-[#0284C7] flex items-center justify-center shrink-0">
            <Briefcase className="h-6 w-6 stroke-[2]" />
          </div>
          <div>
            <span className="text-[12px] font-semibold text-[#64748B]">Leaves</span>
            <div className="text-2xl font-black text-[#0F172A] mt-0.5 tracking-tight">
              {summaryData?.leave_days ?? 0}
            </div>
            <span className="text-[11px] text-[#94A3B8] font-medium">
              {summaryData?.period_label || "This Month"}
            </span>
          </div>
        </div>

        {/* Card 5: Record Punch Button (Matching exact image button) */}
        <div className="flex items-center justify-center">
          <button
            onClick={handleOpenPunchModal}
            className="w-full h-full min-h-[82px] bg-[#5B4BDB] hover:bg-[#4C3DC7] text-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-3 active:scale-98 group cursor-pointer"
          >
            <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Fingerprint className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-[15px] font-bold tracking-tight flex items-center space-x-1.5">
                <span>Record Punch</span>
                <ChevronDown className="h-4 w-4 text-white/80 group-hover:translate-y-0.5 transition-transform" />
              </div>
              <span className="text-[11px] text-white/80 font-normal">
                {punchStatusData?.state === "punched_in"
                  ? "Punched In · Click to Out"
                  : punchStatusData?.state === "completed"
                  ? "Completed for Today"
                  : "Check In for Today"}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Daily Logs Card with Date Filter & Styled Table */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-card overflow-hidden">
        {/* Card Header */}
        <div className="p-6 border-b border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="h-9 w-9 rounded-xl bg-[#F0EDFD] text-[#5B4BDB] flex items-center justify-center mt-0.5 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A] tracking-tight">
                Daily Logs ({recordsData?.total ?? 0})
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Detailed log of your attendance and work activity.
              </p>
            </div>
          </div>

          {/* Date Filter Dropdown */}
          <div className="relative self-start sm:self-auto">
            <button
              onClick={() => setFilterMenuOpen(!filterMenuOpen)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-2xl text-[13px] font-semibold text-[#0F172A] hover:bg-[#F8F9FB] shadow-soft transition-all"
            >
              <Calendar className="h-4 w-4 text-[#5B4BDB]" />
              <span>{filterLabels[filterRange] || "This Month"}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8]" />
            </button>

            {filterMenuOpen && (
              <div
                className="absolute right-0 top-12 w-48 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-2 z-30 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setFilterMenuOpen(false)}
              >
                {(["today", "this_week", "this_month", "custom"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setFilterRange(r);
                      setFilterMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-[13px] font-medium transition-colors flex items-center justify-between ${
                      filterRange === r
                        ? "bg-[#EEF2FF] text-[#5B4BDB] font-semibold"
                        : "text-[#0F172A] hover:bg-[#F8F9FB]"
                    }`}
                  >
                    <span>{filterLabels[r]}</span>
                    {filterRange === r && <Check className="h-3.5 w-3.5 text-[#5B4BDB]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Custom Date Pickers (if Custom Date selected) */}
        {filterRange === "custom" && (
          <div className="p-4 bg-[#F8F9FD] border-b border-[#E5E7EB] flex flex-wrap items-center gap-4 text-xs font-semibold text-[#64748B]">
            <div className="flex items-center space-x-2">
              <span>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#5B4BDB]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#5B4BDB]"
              />
            </div>
            <button
              onClick={() => {
                refetchRecords();
                refetchSummary();
              }}
              className="px-3.5 py-1.5 bg-[#5B4BDB] text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-[#4C3DC7]"
            >
              Apply Filter
            </button>
          </div>
        )}

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              {/* Lavender Tinted Header (matching user reference mockup) */}
              <tr className="bg-[#F0EDFD] text-[#5B4BDB] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-6">Check In (IST)</th>
                <th className="py-3.5 px-6">Check Out (IST)</th>
                <th className="py-3.5 px-6">Hours Logged</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Missing Punch</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {isRecordsLoading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#64748B]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-6 w-6 rounded-full border-2 border-[#5B4BDB] border-t-transparent animate-spin" />
                      <span>Loading attendance records...</span>
                    </div>
                  </td>
                </tr>
              )}

              {recordsData?.items && recordsData.items.length === 0 && !isRecordsLoading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#64748B]">
                    <div className="max-w-sm mx-auto text-center space-y-2">
                      <Calendar className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
                      <div className="font-semibold text-[#0F172A]">No records found for this period</div>
                      <p className="text-xs text-[#94A3B8]">
                        Use the &ldquo;Record Punch&rdquo; button above to mark your check-in.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {recordsData?.items?.map((rec) => {
                const isPresent = rec.status === "present";
                const isLate = rec.status === "late";
                const isHalfDay = rec.status === "half_day";

                return (
                  <tr
                    key={rec.id}
                    className="hover:bg-[#F8F9FD] transition-colors group cursor-pointer"
                    onClick={() => handleViewRecord(rec.id)}
                  >
                    {/* Date + Day */}
                    <td className="py-4 px-6 font-semibold text-[#0F172A] whitespace-nowrap">
                      <div>{formatDisplayDate(rec.date)}</div>
                      <div className="text-[11px] font-normal text-[#64748B] mt-0.5">
                        {rec.day_of_week || "Thu"}
                      </div>
                    </td>

                    {/* Employee Avatar + Name + Designation */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-[#5B4BDB] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {rec.employee_initials || "SV"}
                        </div>
                        <div>
                          <div className="font-bold text-[#0F172A] text-[13px] leading-tight">
                            {rec.employee_name}
                          </div>
                          <div className="text-[11px] text-[#64748B] mt-0.5">
                            {rec.employee_designation || "Super Admin"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Check In (IST) */}
                    <td className="py-4 px-6 whitespace-nowrap font-medium text-[#0F172A]">
                      {rec.check_in_local ? (
                        <div className="flex items-center space-x-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                          <span>{rec.check_in_local}</span>
                        </div>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </td>

                    {/* Check Out (IST) */}
                    <td className="py-4 px-6 whitespace-nowrap font-medium text-[#0F172A]">
                      {rec.check_out_local ? (
                        <div className="flex items-center space-x-2">
                          <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                          <span>{rec.check_out_local}</span>
                        </div>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </td>

                    {/* Hours Logged */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#F0EDFD] text-[#5B4BDB] text-xs font-semibold">
                        <Clock className="h-3 w-3" />
                        <span>{rec.working_hours_display || "0h 0m"}</span>
                      </span>
                    </td>

                    {/* Status Pill Badge */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          isPresent
                            ? "bg-[#ECFDF5] text-[#059669]"
                            : isLate
                            ? "bg-[#FFFBEB] text-[#D97706]"
                            : isHalfDay
                            ? "bg-[#FFF7ED] text-[#EA580C]"
                            : "bg-[#FFF1F2] text-[#E11D48]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isPresent
                              ? "bg-[#059669]"
                              : isLate
                              ? "bg-[#D97706]"
                              : isHalfDay
                              ? "bg-[#EA580C]"
                              : "bg-[#E11D48]"
                          }`}
                        />
                        <span>{rec.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                      </span>
                    </td>

                    {/* Missing Punch */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {rec.is_missing_punch ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFF1F2] text-[#E11D48] text-xs font-semibold border border-[#FEE2E2]">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Flagged</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#059669] text-xs font-semibold border border-[#A7F3D0]">
                          <Check className="h-3 w-3 stroke-[2.5]" />
                          <span>Complete</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewRecord(rec.id);
                        }}
                        className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] text-[#0F172A] hover:border-[#5B4BDB] hover:text-[#5B4BDB] text-xs font-semibold rounded-xl transition-all shadow-xs inline-flex items-center space-x-1.5"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#5B4BDB]" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. RECORD PUNCH CONFIRMATION MODAL (CRITICAL BEHAVIOUR FIX) */}
      {/* ========================================================================= */}
      {isPunchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop dismiss */}
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setIsPunchModalOpen(false)}
            aria-hidden="true"
          />

          <div className="bg-white border border-[#E5E7EB] rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[88vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 relative">
            {/* Modal Header (Fixed at top) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] shrink-0 bg-white">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-2xl bg-[#EEF2FF] text-[#5B4BDB] flex items-center justify-center shadow-xs shrink-0">
                  <Fingerprint className="h-6 w-6 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0F172A] tracking-tight">
                    Record Punch
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Mark your attendance for today
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPunchModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1.5 rounded-xl hover:bg-[#F8F9FB] transition-colors cursor-pointer shrink-0 ml-2"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable if needed) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Employee Summary Card */}
              <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-[#E5E7EB] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-[#5B4BDB] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    {punchStatusData?.employee_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "SV"}
                  </div>
                  <div>
                    <div className="font-bold text-[#0F172A] text-[14px]">
                      {punchStatusData?.employee_name || "Sai Varshith"}
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      {punchStatusData?.designation || "Super Admin"} · {punchStatusData?.employee_code || "EMP-DIG-01"}
                    </div>
                  </div>
                </div>

                {/* State Tag */}
                <div className="shrink-0 ml-2">
                  {punchStatusData?.state === "not_punched_in" && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F1F5F9] text-[#64748B]">
                      Not Punched In
                    </span>
                  )}
                  {punchStatusData?.state === "punched_in" && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#059669]">
                      In: {punchStatusData.check_in_local}
                    </span>
                  )}
                  {punchStatusData?.state === "completed" && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EEF2FF] text-[#5B4BDB]">
                      Completed ({punchStatusData.working_hours_display})
                    </span>
                  )}
                </div>
              </div>

              {/* Attendance Flow State Action */}
              <div className="pt-1">
                {punchStatusData?.state === "not_punched_in" && (
                  <button
                    onClick={() => punchMutation.mutate("check_in")}
                    disabled={punchMutation.isPending}
                    className="w-full h-12 bg-[#5B4BDB] hover:bg-[#4C3DC7] text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    <Fingerprint className="h-5 w-5" />
                    <span>
                      {punchMutation.isPending ? "Recording Punch..." : "Confirm Punch In"}
                    </span>
                  </button>
                )}

                {punchStatusData?.state === "punched_in" && (
                  <button
                    onClick={() => punchMutation.mutate("check_out")}
                    disabled={punchMutation.isPending}
                    className="w-full h-12 bg-[#5B4BDB] hover:bg-[#4C3DC7] text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    <Fingerprint className="h-5 w-5" />
                    <span>
                      {punchMutation.isPending ? "Recording Punch..." : "Confirm Punch Out"}
                    </span>
                  </button>
                )}

                {punchStatusData?.state === "completed" && (
                  <div className="w-full p-4 bg-[#F8F9FD] border border-[#E5E7EB] rounded-2xl text-center space-y-1">
                    <div className="font-bold text-[#0F172A] text-sm flex items-center justify-center space-x-1.5 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Completed</span>
                    </div>
                    <p className="text-xs text-[#64748B]">
                      Today&apos;s attendance is already completed. Both check-in and check-out are recorded.
                    </p>
                  </div>
                )}
              </div>

              {/* Centered OR Divider matching user reference image */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-[#E5E7EB] w-full" />
                <span className="bg-white px-3 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider absolute">
                  OR
                </span>
              </div>

              {/* Current Time Display matching exact reference image */}
              <div className="text-center pt-1 pb-1">
                <div className="inline-flex items-center space-x-1.5 text-xs text-[#64748B] font-medium bg-[#F8F9FD] px-3.5 py-2 rounded-xl border border-[#E5E7EB]">
                  <Clock className="h-3.5 w-3.5 text-[#5B4BDB]" />
                  <span>Current Time: {liveIstTime || "Loading time..."}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. VIEW DETAILS MODAL */}
      {/* ========================================================================= */}
      {viewDetailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop dismiss */}
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setViewDetailModalOpen(false)}
            aria-hidden="true"
          />

          <div className="bg-white border border-[#E5E7EB] rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[88vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 relative">
            {/* Modal Header (Fixed at top) */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-[#E5E7EB] shrink-0 bg-white">
              <div>
                <span className="text-[10px] font-bold text-[#5B4BDB] uppercase tracking-wider block">
                  ATTENDANCE AUDIT RECORD
                </span>
                <h3 className="font-extrabold text-base sm:text-lg text-[#0F172A] tracking-tight mt-0.5">
                  Record Details — {detailData?.date ? formatDisplayDate(detailData.date) : "Loading..."}
                </h3>
                <p className="text-xs text-[#64748B]">
                  {detailData?.day_of_week} · Asia/Kolkata Business Rules
                </p>
              </div>

              <button
                onClick={() => setViewDetailModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1.5 rounded-xl hover:bg-[#F8F9FB] transition-colors cursor-pointer shrink-0 ml-3"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {isDetailLoading ? (
                <div className="py-12 text-center text-[#64748B]">
                  <div className="h-6 w-6 rounded-full border-2 border-[#5B4BDB] border-t-transparent animate-spin mx-auto mb-2" />
                  <span>Loading record audit trail...</span>
                </div>
              ) : detailData ? (
                <>
                  {/* Employee Info Header */}
                  <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-[#E5E7EB] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#0F172A] text-sm">
                        {detailData.employee_name}
                      </div>
                      <div className="text-xs text-[#64748B]">
                        {detailData.designation} · {detailData.department}
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white border border-[#E5E7EB] text-[#5B4BDB]">
                      {detailData.employee_code}
                    </span>
                  </div>

                  {/* Timing Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-2xl">
                      <span className="text-[11px] text-[#64748B] font-semibold block">Check In (IST)</span>
                      <span className="text-base font-bold text-[#0F172A] mt-0.5 block">
                        {detailData.check_in_local || "—"}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">
                        UTC: {detailData.check_in_utc ? detailData.check_in_utc.slice(11, 19) : "—"}
                      </span>
                    </div>

                    <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-2xl">
                      <span className="text-[11px] text-[#64748B] font-semibold block">Check Out (IST)</span>
                      <span className="text-base font-bold text-[#0F172A] mt-0.5 block">
                        {detailData.check_out_local || "—"}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">
                        UTC: {detailData.check_out_utc ? detailData.check_out_utc.slice(11, 19) : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Working Hours & Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-2xl">
                      <span className="text-[11px] text-[#64748B] font-semibold block">Total Logged Time</span>
                      <span className="text-base font-bold text-[#5B4BDB] mt-0.5 block">
                        {detailData.working_hours_display}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">{detailData.working_minutes} total minutes</span>
                    </div>

                    <div className="p-3.5 bg-white border border-[#E5E7EB] rounded-2xl">
                      <span className="text-[11px] text-[#64748B] font-semibold block">Calculated Status</span>
                      <span className="text-base font-bold text-[#0F172A] mt-0.5 block capitalize">
                        {detailData.status.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">
                        {detailData.is_missing_punch ? "⚠️ Missing Punch" : "✓ Complete"}
                      </span>
                    </div>
                  </div>

                  {/* Rule Evaluation Explanation Box */}
                  <div className="p-3.5 rounded-2xl bg-[#EEF2FF] border border-[#5B4BDB]/20 text-xs">
                    <div className="font-bold text-[#5B4BDB] mb-1 flex items-center space-x-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Kolkata Business Rule Evaluation:</span>
                    </div>
                    <p className="text-[#3730A3] leading-relaxed">
                      {detailData.status_rule_explanation}
                    </p>
                  </div>

                  {/* Admin Correction Tool */}
                  {user?.is_super_admin && (
                    <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-[#E5E7EB] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0F172A] flex items-center space-x-1.5">
                          <ShieldAlert className="h-3.5 w-3.5 text-[#5B4BDB]" />
                          <span>Admin Attendance Correction</span>
                        </span>
                        {correctionSuccessMsg && (
                          <span className="text-[11px] text-emerald-600 font-semibold">
                            {correctionSuccessMsg}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] text-[#64748B] mb-1 font-semibold">Adjust Status</label>
                          <select
                            value={adminStatusCorrection}
                            onChange={(e) => setAdminStatusCorrection(e.target.value)}
                            className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#5B4BDB] focus:ring-1 focus:ring-[#5B4BDB]"
                          >
                            <option value="">Leave as is ({detailData.status})</option>
                            <option value="present">Present</option>
                            <option value="late">Late</option>
                            <option value="half_day">Half Day</option>
                            <option value="absent">Absent</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#64748B] mb-1 font-semibold">Correction Reason</label>
                          <input
                            type="text"
                            placeholder="e.g. Approved biometric fix"
                            value={adminCorrectionReason}
                            onChange={(e) => setAdminCorrectionReason(e.target.value)}
                            className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#5B4BDB] focus:ring-1 focus:ring-[#5B4BDB]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => adminCorrectMutation.mutate()}
                          disabled={adminCorrectMutation.isPending || (!adminStatusCorrection && !adminCorrectionReason)}
                          className="px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-40 transition-all cursor-pointer"
                        >
                          {adminCorrectMutation.isPending ? "Applying..." : "Apply Admin Adjustment"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer (Fixed at bottom) */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#F1F5F9] bg-[#F8F9FB] rounded-b-3xl shrink-0">
              <span className="text-[11px] text-[#94A3B8]">
                Asia/Kolkata (IST) Audit Trail
              </span>
              <button
                onClick={() => setViewDetailModalOpen(false)}
                className="px-5 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
