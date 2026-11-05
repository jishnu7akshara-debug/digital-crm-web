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
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      setPunchMessage(`${res.punch_type.replace("_", " ").toUpperCase()} recorded at ${res.timestamp_local} (${res.status.toUpperCase()})`);
      setTimeout(() => setPunchMessage(null), 6000);
    } catch (err: any) {
      alert(err.message || "Attendance punch failed.");
    } finally {
      setPunching(false);
    }
  };

  return (
    <>
      <Header
        title="Attendance & Time"
        subtitle="Asia/Kolkata timezone: Late threshold (> 10:30), Half-day (> 11:00 or < 7h), Absent (< 4h), and Saturday rules"
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Quick Punch Action Card */}
        <Card className="border-[#E9E5F0] bg-white">
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-[#6C3BDB]" />
                <h3 className="text-base font-bold text-[#1D1930]">Daily Biometric / Web Punch</h3>
              </div>
              <p className="text-xs text-[#77738A] mt-1">
                Timestamps stored in UTC with deterministic Asia/Kolkata business rules. Missing punches are audited.
              </p>
              {punchMessage && (
                <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 inline-block">
                  ✓ {punchMessage}
                </div>
              )}
            </div>

            <Button
              size="lg"
              onClick={handlePunch}
              isLoading={punching}
              className="bg-[#6C3BDB] hover:bg-[#5A2EC0] text-sm font-semibold shadow"
            >
              <Clock className="h-4 w-4 mr-2" /> Record Punch
            </Button>
          </CardContent>
        </Card>

        {/* Daily Attendance Records */}
        <Card>
          <CardHeader className="p-4 border-b border-[#E9E5F0]">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#77738A]">
              Daily Logs ({data?.total || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E9E5F0] bg-[#F8F8FC] text-[#77738A] font-medium">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Check In (IST)</th>
                  <th className="py-3 px-4">Check Out (IST)</th>
                  <th className="py-3 px-4">Hours Logged</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Missing Punch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E5F0]">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#77738A]">
                      Loading attendance records...
                    </td>
                  </tr>
                )}
                {data?.items.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#F8F8FC]">
                    <td className="py-3 px-4 font-mono font-medium text-[#1D1930]">{formatDate(rec.date)}</td>
                    <td className="py-3 px-4 font-medium text-[#1D1930]">{rec.employee_name}</td>
                    <td className="py-3 px-4 font-mono text-[#77738A]">{rec.check_in_local || "—"}</td>
                    <td className="py-3 px-4 font-mono text-[#77738A]">{rec.check_out_local || "—"}</td>
                    <td className="py-3 px-4 font-mono text-[#1D1930]">
                      {Math.floor(rec.working_minutes / 60)}h {rec.working_minutes % 60}m
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          rec.status === "present"
                            ? "success"
                            : rec.status === "late"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {rec.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {rec.is_missing_punch ? (
                        <span className="text-rose-600 font-semibold text-xs">Flagged</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-xs">Complete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

