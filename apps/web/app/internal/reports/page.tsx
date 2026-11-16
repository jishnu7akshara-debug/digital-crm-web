"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  DollarSign,
  PieChart as PieIcon,
  CheckCircle2,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from "@/lib/api";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { PageReady } from "@/components/page-ready";

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("year");

  // Fetch real financial report analytics
  const { data: reportData, isLoading, error, refetch } = useQuery<any>({
    queryKey: ["reports-overview"],
    queryFn: async () => {
      return await api.get<any>("/reports/overview");
    },
  });

  const handleExportCsv = async () => {
    try {
      toast.info("Generating financial CSV export...");
      await api.downloadPdf("/reports/export/csv", `financial_report_${new Date().toISOString().split("T")[0]}.csv`);
      toast.success("Financial report downloaded.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to export report.");
    }
  };

  if (isLoading) return <PageSkeleton />;
  if (error || !reportData) return <ErrorState message={(error as any)?.message || "Failed to load reports"} onRetry={() => refetch()} />;

  const monthlyData = reportData.monthly_data || [];
  const serviceShare = reportData.service_share || [];

  return (
    <div className="space-y-6 select-none pb-12">
      <PageReady when={!isLoading && !!reportData} />
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              FINANCE & ANALYTICS
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              Live Ledger Analytics
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Executive Reports & Analytics
          </h2>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Cross-functional insights across real billings, collections, tax liabilities, and service shares.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleExportCsv}
            className="h-10 px-4 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FB] text-[#0F172A] text-[13px] font-medium rounded-xl transition-colors shadow-soft flex items-center space-x-2"
          >
            <Download className="h-4 w-4 text-[#64748B]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Total Invoiced
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-[#0F172A]">
              ₹{reportData.total_invoiced_rupees.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Total Collected
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-[#059669]">
              ₹{reportData.total_collected_rupees.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Outstanding Due
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-[#5B4BDB]">
              ₹{reportData.outstanding_rupees.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            GST Tax Accrued
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-[#0F172A]">
              ₹{reportData.total_tax_rupees.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue vs Collected Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E7EB]">
            <div>
              <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                CASH FLOW COMPARISON
              </span>
              <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                Monthly Invoiced vs Collected (₹)
              </h3>
            </div>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, "Amount"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0" }}
                />
                <Bar dataKey="invoiced_rupees" name="Invoiced" fill="#5B4BDB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected_rupees" name="Collected" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Share Donut Chart (1 col) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
          <div className="pb-3 mb-4 border-b border-[#E5E7EB]">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              PORTFOLIO SPLIT
            </span>
            <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
              Service Revenue Share
            </h3>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceShare}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="amount_rupees"
                >
                  {serviceShare.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-4 pt-3 border-t border-[#E5E7EB]">
            {serviceShare.map((item: any) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#0F172A] font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-[#0F172A]">
                  ₹{item.amount_rupees.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
