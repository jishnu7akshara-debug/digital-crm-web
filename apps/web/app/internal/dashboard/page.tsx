"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  FolderKanban,
  Receipt,
  TrendingUp,
  ArrowRight,
  Calendar,
  ChevronDown,
  Building,
  CheckSquare,
  FileText,
  Monitor,
  Megaphone,
  Layers,
  LayoutGrid,
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
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";

export default function SaasDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real KPIs from FastAPI /dashboard/kpis
  const { data: kpiData, isLoading, error, refetch } = useQuery<any>({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      return await api.get<any>("/dashboard/kpis");
    },
  });

  if (!mounted || isLoading) return <PageSkeleton />;
  if (error || !kpiData) return <ErrorState message={(error as any)?.message || "Failed to load dashboard"} onRetry={() => refetch()} />;

  const displayName = user?.full_name?.split(" ")[0] || kpiData.greeting_name || "Sai";

  return (
    <div className="space-y-6 select-none pb-12">
      {/* 1. Page Header (Greeting + Date Picker Pill) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-[26px] font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
            <span>Good Afternoon, {displayName}</span>
            <span className="text-2xl animate-pulse">👋</span>
          </h1>
          <p className="text-[13.5px] text-[#64748B] mt-1 font-normal">
            Here&apos;s live operational data from Digital Footprint OS today.
          </p>
        </div>

        {/* Date Filter Pill */}
        <div className="flex items-center space-x-2 bg-white border border-[#E5E7EB] px-3.5 py-2 rounded-xl text-[13px] font-medium text-[#0F172A] shadow-soft cursor-pointer hover:bg-[#F8F9FB] transition-colors self-start sm:self-auto">
          <Calendar className="h-4 w-4 text-[#64748B]" />
          <span>Current FY ({new Date().getFullYear()})</span>
          <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8]" />
        </div>
      </div>

      {/* 2. Top 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Clients */}
        <Link
          href="/internal/clients"
          className="bg-white border border-[#E5E7EB] hover:border-[#5B4BDB]/40 rounded-2xl p-5 shadow-card hover:shadow-dropdown transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[#F0EDFF] text-[#5B4BDB] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5 stroke-[2]" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <span>↑</span>
              <span>+{kpiData.clients_growth_percent}%</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-[28px] font-bold text-[#0F172A] tracking-tight group-hover:text-[#5B4BDB] transition-colors">
              {kpiData.total_clients}
            </div>
            <div className="text-[13px] text-[#64748B] mt-0.5 font-medium flex items-center justify-between">
              <span>Total Clients</span>
              <span className="text-xs text-[#5B4BDB] opacity-0 group-hover:opacity-100 transition-opacity">View All →</span>
            </div>
          </div>
        </Link>

        {/* Active Projects */}
        <Link
          href="/internal/projects"
          className="bg-white border border-[#E5E7EB] hover:border-[#5B4BDB]/40 rounded-2xl p-5 shadow-card hover:shadow-dropdown transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[#F0EDFF] text-[#5B4BDB] flex items-center justify-center group-hover:scale-105 transition-transform">
              <FolderKanban className="h-5 w-5 stroke-[2]" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <span>↑</span>
              <span>+{kpiData.projects_growth_percent}%</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-[28px] font-bold text-[#0F172A] tracking-tight group-hover:text-[#5B4BDB] transition-colors">
              {kpiData.active_projects}
            </div>
            <div className="text-[13px] text-[#64748B] mt-0.5 font-medium flex items-center justify-between">
              <span>Active Projects</span>
              <span className="text-xs text-[#5B4BDB] opacity-0 group-hover:opacity-100 transition-opacity">Directory →</span>
            </div>
          </div>
        </Link>

        {/* Pipeline Value */}
        <Link
          href="/internal/leads"
          className="bg-white border border-[#E5E7EB] hover:border-[#5B4BDB]/40 rounded-2xl p-5 shadow-card hover:shadow-dropdown transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[#F0EDFF] text-[#5B4BDB] flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
              ₹
            </div>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <span>↑</span>
              <span>+{kpiData.pipeline_growth_percent}%</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-[28px] font-bold text-[#0F172A] tracking-tight group-hover:text-[#5B4BDB] transition-colors">
              ₹{kpiData.pipeline_value_rupees.toLocaleString("en-IN")}
            </div>
            <div className="text-[13px] text-[#64748B] mt-0.5 font-medium flex items-center justify-between">
              <span>Pipeline Value</span>
              <span className="text-xs text-[#5B4BDB] opacity-0 group-hover:opacity-100 transition-opacity">Pipeline →</span>
            </div>
          </div>
        </Link>

        {/* Revenue (Total Billed) */}
        <Link
          href="/internal/invoices"
          className="bg-white border border-[#E5E7EB] hover:border-[#5B4BDB]/40 rounded-2xl p-5 shadow-card hover:shadow-dropdown transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[#F0EDFF] text-[#5B4BDB] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Receipt className="h-5 w-5 stroke-[2]" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <span>↑</span>
              <span>+{kpiData.revenue_growth_percent}%</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-[28px] font-bold text-[#0F172A] tracking-tight group-hover:text-[#5B4BDB] transition-colors">
              ₹{kpiData.monthly_revenue_rupees.toLocaleString("en-IN")}
            </div>
            <div className="text-[13px] text-[#64748B] mt-0.5 font-medium flex items-center justify-between">
              <span>Total Invoiced</span>
              <span className="text-xs text-[#5B4BDB] opacity-0 group-hover:opacity-100 transition-opacity">Ledger →</span>
            </div>
          </div>
        </Link>
      </div>

      {/* 3. Main Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Pipeline & Active Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pipeline Funnel */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                  Pipeline Status ({kpiData.pipeline_total_deals} Active Deals)
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Commercial progression through sales stages
                </p>
              </div>
              <Link
                href="/internal/leads"
                className="text-[13px] font-semibold text-[#5B4BDB] hover:underline flex items-center gap-1"
              >
                <span>View Leads</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
              {kpiData.pipeline_stages.map((stage: any) => (
                <div
                  key={stage.stage}
                  className={`rounded-xl p-3 text-center border transition-all ${
                    stage.is_active
                      ? "bg-[#5B4BDB] text-white border-[#5B4BDB] shadow-soft"
                      : "bg-[#F8F9FA] text-[#0F172A] border-[#E5E7EB]"
                  }`}
                >
                  <div className={`text-[11px] font-semibold ${stage.is_active ? "text-white/90" : "text-[#64748B]"}`}>
                    {stage.label}
                  </div>
                  <div className={`text-lg font-bold mt-1 ${stage.is_active ? "text-white" : "text-[#0F172A]"}`}>
                    {stage.count}
                  </div>
                  <div className={`text-[10px] font-medium mt-0.5 ${stage.is_active ? "text-white/80" : "text-[#64748B]"}`}>
                    ₹{stage.value_rupees.toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Projects Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                  Active Projects
                </h2>
              </div>
              <Link
                href="/internal/projects"
                className="text-[13px] font-semibold text-[#5B4BDB] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Project</th>
                    <th className="pb-3 font-semibold">Client</th>
                    <th className="pb-3 font-semibold">Progress</th>
                    <th className="pb-3 font-semibold">Due Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {kpiData.active_projects_list.map((proj: any) => (
                    <tr
                      key={proj.id}
                      onClick={() => router.push(`/internal/projects/${proj.id}`)}
                      className="hover:bg-[#F8F9FD] transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 pr-3 font-semibold text-[#0F172A] group-hover:text-[#5B4BDB]">
                        {proj.project_name}
                      </td>
                      <td className="py-3.5 px-3 text-[#64748B]">{proj.client_name}</td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-2 w-28">
                          <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#5B4BDB] h-full rounded-full"
                              style={{ width: `${proj.progress_percent}%` }}
                            />
                          </div>
                          <span className="font-semibold text-xs text-[#64748B]">{proj.progress_percent}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-[#64748B] text-xs">{proj.due_date}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669]">
                          {proj.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Service Revenue & Upcoming Tasks */}
        <div className="space-y-6">
          {/* Service-Wise Revenue */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-card">
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight pb-3 border-b border-[#E5E7EB]">
              Service Revenue Share
            </h2>

            <div className="h-48 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kpiData.service_revenue}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="amount_rupees"
                  >
                    {kpiData.service_revenue.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Revenue"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-4 pt-3 border-t border-[#E5E7EB]">
              {kpiData.service_revenue.map((s: any) => (
                <div key={s.service_name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-[#0F172A] font-medium">{s.service_name}</span>
                  </div>
                  <span className="font-bold text-[#0F172A]">
                    ₹{s.amount_rupees.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Priority Tasks */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Upcoming Tasks
              </h2>
              <Link
                href="/internal/tasks"
                className="text-xs font-semibold text-[#5B4BDB] hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="space-y-3 mt-4">
              {kpiData.upcoming_tasks.map((task: any) => (
                <div
                  key={task.id}
                  className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold text-[#0F172A] block">{task.title}</span>
                    <span className="text-[10px] text-[#94A3B8]">Due: {task.due_text}</span>
                  </div>
                  {task.is_urgent && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-700">
                      Urgent
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
