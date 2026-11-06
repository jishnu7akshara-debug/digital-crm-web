"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  AlertCircle,
  FileCheck,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface AttendanceRecordItem {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  check_in_local?: string;
  check_out_local?: string;
  status: string;
  working_minutes: number;
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

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [punching, setPunching] = useState(false);
  const [punchMessage, setPunchMessage] = useState<string | null>(null);

  const { data, isLoading } = useQuery<PaginatedAttendance>({
    queryKey: ["attendance-records"],
    queryFn: () => api.get<PaginatedAttendance>("/attendance/records"),
  });

  const handlePunch = async () => {
    setPunching(true);
    try {
      const res = await api.post<any>("/attendance/punch");
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
      setPunchMessage(
        `${res.punch_type.replace("_", " ").toUpperCase()} recorded at ${
          res.timestamp_local
        } (${res.status.toUpperCase()})`
      );
      setTimeout(() => setPunchMessage(null), 6000);
    } catch (err: any) {
      alert(err.message || "Attendance punch failed.");
    } finally {
      setPunching(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              OPERATIONS & TEAM
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              Asia/Kolkata (IST)
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Attendance & Work Logs
          </h2>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Late threshold (&gt; 10:30 AM), half-day (&gt; 11:00 AM or &lt; 7h), and Saturday rules.
          </p>
        </div>

        <button
          onClick={handlePunch}
          disabled={punching}
          className="h-10 px-5 bg-[#5B4BDB] hover:bg-[#4D3DC9] text-white text-[13px] font-semibold rounded-xl transition-all shadow-soft flex items-center space-x-2 shrink-0 active:scale-95 disabled:opacity-50"
        >
          <Clock className="h-4 w-4 stroke-[2]" />
          <span>{punching ? "Recording..." : "Record Punch"}</span>
        </button>
      </div>

      {punchMessage && (
        <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-semibold flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-[#059669]" />
          <span>{punchMessage}</span>
        </div>
      )}

      {/* Daily Attendance Records Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card overflow-hidden">
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
              Daily Logs ({data?.total || 0})
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Deterministic biometric & web check-ins for the active billing cycle
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#F1F5F9] bg-[#F8F9FB] text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Employee</th>
                <th className="py-3 px-5">Check In (IST)</th>
                <th className="py-3 px-5">Check Out (IST)</th>
                <th className="py-3 px-5">Hours Logged</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-center">Missing Punch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#64748B]">
                    Loading attendance records...
                  </td>
                </tr>
              )}
              {data?.items && data.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#64748B]">
                    No attendance records logged for today yet.
                  </td>
                </tr>
              )}
              {data?.items.map((rec) => (
                <tr key={rec.id} className="hover:bg-[#F8F9FB] transition-colors">
                  <td className="py-3.5 px-5 font-medium text-[#0F172A]">
                    {formatDate(rec.date)}
                  </td>
                  <td className="py-3.5 px-5 font-semibold text-[#0F172A]">
                    {rec.employee_name}
                  </td>
                  <td className="py-3.5 px-5 text-[#64748B] font-mono text-xs">
                    {rec.check_in_local || "—"}
                  </td>
                  <td className="py-3.5 px-5 text-[#64748B] font-mono text-xs">
                    {rec.check_out_local || "—"}
                  </td>
                  <td className="py-3.5 px-5 text-[#0F172A] font-semibold">
                    {Math.floor(rec.working_minutes / 60)}h {rec.working_minutes % 60}m
                  </td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        rec.status === "present"
                          ? "bg-[#ECFDF5] text-[#059669]"
                          : rec.status === "late"
                          ? "bg-[#FFFBEB] text-[#D97706]"
                          : "bg-[#FFF1F2] text-[#E11D48]"
                      }`}
                    >
                      {rec.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    {rec.is_missing_punch ? (
                      <span className="text-[#E11D48] font-semibold text-xs px-2 py-0.5 rounded-full bg-[#FFF1F2]">
                        Flagged
                      </span>
                    ) : (
                      <span className="text-[#059669] font-semibold text-xs px-2 py-0.5 rounded-full bg-[#ECFDF5]">
                        Complete
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}