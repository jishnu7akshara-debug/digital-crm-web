"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Handshake,
  FileText,
  Calendar,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  UserPlus,
  FolderPlus,
  FileCheck,
  CheckSquare,
  Upload,
  Building,
  Monitor,
  Megaphone,
  Layers,
  LayoutGrid,
  MoreVertical,
  Check,
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
import { Header } from "@/components/layout/header";
import { api } from "@/lib/api";

interface PipelineStage {
  stage: string;
  label: string;
  count: number;
  value_rupees: number;
  is_active: boolean;
}

interface ServiceRevenue {
  service_name: string;
  percentage: number;
  amount_rupees: number;
  color: string;
}

interface ClientsByService {
  service_name: string;
  count: number;
  icon: string;
}

interface ActiveProject {
  id: string;
  project_name: string;
  client_name: string;
  service_name: string;
  progress_percent: number;
  due_date: string;
  status: string;
}

interface UpcomingTask {
  id: string;
  title: string;
  due_text: string;
  is_urgent: boolean;
  is_completed: boolean;
}

interface MonthlyTrend {
  month: string;
  revenue_rupees: number;
}

interface DashboardData {
  greeting_name: string;
  total_clients: number;
  clients_growth_percent: number;
  active_projects: number;
  projects_growth_percent: number;
  pipeline_value_rupees: number;
  pipeline_growth_percent: number;
  monthly_revenue_rupees: number;
  revenue_growth_percent: number;
  pipeline_total_deals: number;
  pipeline_stages: PipelineStage[];
  service_revenue: ServiceRevenue[];
  active_projects_list: ActiveProject[];
  revenue_trend: MonthlyTrend[];
  clients_by_service: ClientsByService[];
  upcoming_tasks: UpcomingTask[];
}

export default function DigitalFootprintDashboard() {
  const [taskChecked, setTaskChecked] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["executive-dashboard"],
    queryFn: () => api.get<DashboardData>("/dashboard/kpis"),
  });

  const d = data || {
    greeting_name: "Sai",
    total_clients: 142,
    clients_growth_percent: 12,
    active_projects: 38,
    projects_growth_percent: 18,
    pipeline_value_rupees: 2480000,
    pipeline_growth_percent: 32,
    monthly_revenue_rupees: 975000,
    revenue_growth_percent: 21,
    pipeline_total_deals: 46,
    pipeline_stages: [
      { stage: "leads", label: "Leads", count: 18, value_rupees: 420000, is_active: false },
      { stage: "qualified", label: "Qualified", count: 11, value_rupees: 610000, is_active: false },
      { stage: "proposal", label: "Proposal", count: 8, value_rupees: 750000, is_active: false },
      { stage: "negotiation", label: "Negotiation", count: 5, value_rupees: 400000, is_active: false },
      { stage: "won", label: "Won", count: 4, value_rupees: 300000, is_active: true },
    ],
    service_revenue: [
      { service_name: "Web Development", percentage: 40, amount_rupees: 390000, color: "#6C3BDB" },
      { service_name: "Digital Marketing", percentage: 25, amount_rupees: 243750, color: "#38BDF8" },
      { service_name: "CRM / ERP", percentage: 15, amount_rupees: 146250, color: "#10B981" },
      { service_name: "Branding & Media", percentage: 10, amount_rupees: 97500, color: "#F59E0B" },
      { service_name: "Others", percentage: 10, amount_rupees: 97500, color: "#EC4899" },
    ],
    active_projects_list: [
      {
        id: "proj-1",
        project_name: "Sashikiran Surveyors – Website",
        client_name: "Sashikiran Surveyors",
        service_name: "Website",
        progress_percent: 80,
        due_date: "Nov 10, 2026",
        status: "In Progress",
      },
      {
        id: "proj-2",
        project_name: "Talenty Consulting – Marketing",
        client_name: "Talenty Consulting",
        service_name: "Digital Marketing",
        progress_percent: 60,
        due_date: "Nov 15, 2026",
        status: "In Progress",
      },
      {
        id: "proj-3",
        project_name: "KalpaTouch – CRM Setup",
        client_name: "KalpaTouch",
        service_name: "CRM / ERP",
        progress_percent: 40,
        due_date: "Nov 20, 2026",
        status: "In Progress",
      },
      {
        id: "proj-4",
        project_name: "Delights – Branding & Media",
        client_name: "Delights",
        service_name: "Branding & Media",
        progress_percent: 90,
        due_date: "Nov 8, 2026",
        status: "Review",
      },
      {
        id: "proj-5",
        project_name: "Aroma Dew – Catalogue",
        client_name: "Aroma Dew",
        service_name: "Branding & Media",
        progress_percent: 100,
        due_date: "Nov 5, 2026",
        status: "Completed",
      },
    ],
    revenue_trend: [
      { month: "Jan", revenue_rupees: 220000 },
      { month: "Feb", revenue_rupees: 340000 },
      { month: "Mar", revenue_rupees: 410000 },
      { month: "Apr", revenue_rupees: 500000 },
      { month: "May", revenue_rupees: 580000 },
      { month: "Jun", revenue_rupees: 640000 },
      { month: "Jul", revenue_rupees: 710000 },
      { month: "Aug", revenue_rupees: 790000 },
      { month: "Sep", revenue_rupees: 850000 },
      { month: "Oct", revenue_rupees: 920000 },
      { month: "Nov", revenue_rupees: 975000 },
    ],
    clients_by_service: [
      { service_name: "Websites", count: 56, icon: "monitor" },
      { service_name: "Digital Marketing", count: 38, icon: "megaphone" },
      { service_name: "CRM / ERP", count: 22, icon: "layers" },
      { service_name: "Others", count: 26, icon: "grid" },
    ],
    upcoming_tasks: [
      { id: "t-1", title: "Follow up – Sashikiran Surveyors", due_text: "Today, 4:00 PM", is_urgent: true, is_completed: false },
      { id: "t-2", title: "Send proposal – New Lead", due_text: "Tomorrow", is_urgent: false, is_completed: false },
      { id: "t-3", title: "Project review – Talenty Consulting", due_text: "Nov 6", is_urgent: false, is_completed: false },
      { id: "t-4", title: "Invoice reminder – Aroma Dew", due_text: "Nov 6", is_urgent: false, is_completed: false },
    ],
  };

  const toggleTask = (id: string) => {
    setTaskChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <Header />

      <main className="flex-1 p-8 max-w-[1600px] w-full mx-auto space-y-6 bg-[#F6F7FB]">
        {/* Top Greeting & Date Range Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#15112B] flex items-center gap-2">
              Good Afternoon, {d.greeting_name} <span>👋</span>
            </h1>
            <p className="text-xs text-[#7A7593] mt-0.5">
              Here&apos;s what&apos;s happening at Digital Footprint today.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button className="bg-white border border-[#E7E4F0] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#15112B] shadow-sm flex items-center space-x-2 hover:bg-[#FAF9FD] transition-colors">
              <Calendar className="h-3.5 w-3.5 text-[#7A7593]" />
              <span>Nov 1, 2026 – Nov 30, 2026</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#7A7593]" />
            </button>
          </div>
        </div>

        {/* 1. Top 4 Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Clients */}
          <div className="bg-white rounded-2xl p-5 border border-[#ECE9F4] shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-[#F4EFFE] flex items-center justify-center text-[#6A3BE8]">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-[#15112B] leading-none">{d.total_clients}</h3>
                <p className="text-xs font-medium text-[#7A7593] mt-1">Total Clients</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center">
              ↑ +{d.clients_growth_percent}%
            </span>
          </div>

          {/* Active Projects */}
          <div className="bg-white rounded-2xl p-5 border border-[#ECE9F4] shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-[#EAF5FE] flex items-center justify-center text-[#2563EB]">
                <Handshake className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-[#15112B] leading-none">{d.active_projects}</h3>
                <p className="text-xs font-medium text-[#7A7593] mt-1">Active Projects</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center">
              ↑ +{d.projects_growth_percent}%
            </span>
          </div>

          {/* Pipeline Value */}
          <div className="bg-white rounded-2xl p-5 border border-[#ECE9F4] shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-[#F4EFFE] flex items-center justify-center text-[#6A3BE8]">
                <span className="text-xl font-bold">₹</span>
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-[#15112B] leading-none">
                  ₹{d.pipeline_value_rupees.toLocaleString("en-IN")}
                </h3>
                <p className="text-xs font-medium text-[#7A7593] mt-1">Pipeline Value</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center">
              ↑ +{d.pipeline_growth_percent}%
            </span>
          </div>

          {/* Revenue (This Month) */}
          <div className="bg-white rounded-2xl p-5 border border-[#ECE9F4] shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-[#F4EFFE] flex items-center justify-center text-[#6A3BE8]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-[#15112B] leading-none">
                  ₹{d.monthly_revenue_rupees.toLocaleString("en-IN")}
                </h3>
                <p className="text-xs font-medium text-[#7A7593] mt-1">Revenue (This Month)</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center">
              ↑ +{d.revenue_growth_percent}%
            </span>
          </div>
        </div>

        {/* 2. Middle Row: Sales Pipeline Chevron & Service-Wise Revenue Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sales Pipeline (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#ECE9F4] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#15112B]">Sales Pipeline</h3>
                <p className="text-xs text-[#7A7593] mt-0.5">
                  ₹{d.pipeline_value_rupees.toLocaleString("en-IN")} across {d.pipeline_total_deals} deals
                </p>
              </div>
              <Link
                href="/internal/opportunities"
                className="text-xs font-semibold text-[#6A3BE8] hover:text-[#5528DA] flex items-center"
              >
                View Pipeline <span className="ml-1">→</span>
              </Link>
            </div>

            {/* Stepper Pipeline Chevrons */}
            <div className="grid grid-cols-5 gap-2.5 pt-2">
              {d.pipeline_stages.map((stage) => {
                const isWon = stage.stage === "won";
                return (
                  <div
                    key={stage.stage}
                    className={`relative p-3.5 rounded-xl border transition-all ${
                      isWon
                        ? "bg-[#6A3BE8] text-white border-[#6A3BE8] shadow-md shadow-purple-900/20"
                        : "bg-[#F7F5FC] text-[#15112B] border-[#ECE7F8]"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-semibold block ${
                        isWon ? "text-purple-200" : "text-[#7A7593]"
                      }`}
                    >
                      {stage.label}
                    </span>
                    <div className="text-lg font-extrabold mt-1 leading-none">{stage.count}</div>
                    <div
                      className={`text-[11px] font-semibold mt-1.5 ${
                        isWon ? "text-purple-100" : "text-[#7A7593]"
                      }`}
                    >
                      ₹{stage.value_rupees.toLocaleString("en-IN")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Service-Wise Revenue (MTD) Donut Chart */}
          <div className="bg-white rounded-2xl p-6 border border-[#ECE9F4] shadow-sm flex flex-col justify-between">
            <h3 className="text-base font-bold text-[#15112B]">Service-Wise Revenue (MTD)</h3>

            <div className="flex items-center justify-between my-auto py-2">
              {/* Donut Chart with Centered Total */}
              <div className="relative h-44 w-44 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={d.service_revenue}
                      dataKey="percentage"
                      nameKey="service_name"
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {d.service_revenue.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-bold text-[#15112B]">₹9,75,000</span>
                  <span className="text-[10px] text-[#7A7593]">Total</span>
                </div>
              </div>

              {/* Legend with percentages */}
              <div className="space-y-2 text-xs flex-1 pl-4">
                {d.service_revenue.map((s) => (
                  <div key={s.service_name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-[#15112B] font-medium text-[11px] truncate max-w-[100px]">
                        {s.service_name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#15112B]">{s.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Row 3: Active Projects & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Active Projects Table (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#ECE9F4] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#15112B]">
                Active Projects ({d.active_projects_list.length})
              </h3>
              <Link
                href="/internal/projects"
                className="text-xs font-semibold text-[#6A3BE8] hover:text-[#5528DA] flex items-center"
              >
                View All <span className="ml-1">→</span>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#ECE9F4] text-[#7A7593] font-semibold text-[11px]">
                    <th className="pb-3 font-semibold">Project</th>
                    <th className="pb-3 font-semibold">Client</th>
                    <th className="pb-3 font-semibold">Service</th>
                    <th className="pb-3 font-semibold">Progress</th>
                    <th className="pb-3 font-semibold">Due Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EFF8]">
                  {d.active_projects_list.map((p) => {
                    // Service tag colors
                    let badgeClass = "bg-[#F4EFFE] text-[#6A3BE8]";
                    if (p.service_name.includes("Marketing")) badgeClass = "bg-[#FFF4E6] text-[#D97706]";
                    if (p.service_name.includes("CRM")) badgeClass = "bg-[#ECFDF5] text-[#059669]";
                    if (p.service_name.includes("Branding")) badgeClass = "bg-[#FDF2F8] text-[#DB2777]";

                    // Status pill colors
                    let statusClass = "bg-[#FEF3C7] text-[#B45309]";
                    if (p.status === "Review") statusClass = "bg-[#ECFDF5] text-[#059669]";
                    if (p.status === "Completed") statusClass = "bg-emerald-100 text-emerald-800";

                    return (
                      <tr key={p.id} className="hover:bg-[#FAF9FD] transition-colors">
                        <td className="py-3 font-semibold text-[#15112B] flex items-center space-x-2.5">
                          <div className="h-6 w-6 rounded-md bg-[#120B2E] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {p.client_name[0]}
                          </div>
                          <span className="truncate max-w-[200px]">{p.project_name}</span>
                        </td>
                        <td className="py-3 text-[#7A7593]">{p.client_name}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${badgeClass}`}>
                            {p.service_name}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-[#F0ECF8] rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#6A3BE8] h-1.5 rounded-full"
                                style={{ width: `${p.progress_percent}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-[#15112B]">
                              {p.progress_percent}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-[#7A7593] font-medium">{p.due_date}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusClass}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions (1 col: 4x2 grid) */}
          <div className="bg-white rounded-2xl p-6 border border-[#ECE9F4] shadow-sm flex flex-col justify-between">
            <h3 className="text-base font-bold text-[#15112B] mb-4">Quick Actions</h3>

            <div className="grid grid-cols-2 gap-3 flex-1">
              {/* Add Lead */}
              <Link
                href="/internal/leads"
                className="p-3 border border-[#ECE9F4] rounded-xl hover:border-[#6A3BE8] hover:bg-[#F9F8FD] transition-all flex flex-col items-center justify-center text-center group"
              >
                <div className="h-8 w-8 rounded-lg bg-[#F4EFFE] text-[#6A3BE8] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <UserPlus className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-[#15112B]">Add Lead</span>
              </Link>

              {/* Create Project */}
              <Link
                href="/internal/projects"
                className="p-3 border border-[#ECE9F4] rounded-xl hover:border-[#6A3BE8] hover:bg-[#F9F8FD] transition-all flex flex-col items-center justify-center text-center group"
              >
                <div className="h-8 w-8 rounded-lg bg-[#F4EFFE] text-[#6A3BE8] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <FolderPlus className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-[#15112B]">Create Project</span>
              </Link>

              {/* Create Invoice */}
              <Link
                href="/internal/invoices"
                className="p-3 border border-[#ECE9F4] rounded-xl hover:border-[#6A3BE8] hover:bg-[#F9F8FD] transition-all flex flex-col items-center justify-center text-center group"
              >
                <div className="h-8 w-8 rounded-lg bg-[#F4EFFE] text-[#6A3BE8] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-[#15112B]">Create Invoice</span>
              </Link>

              {/* Add Client */}
              <Link
                href="/internal/clients"
                className="p-3 border border-[#ECE9F4] rounded-xl hover:border-[#6A3BE8] hover:bg-[#F9F8FD] transition-all flex flex-col items-center justify-center text-center group"
              >
                <div className="h-8 w-8 rounded-lg bg-[#F4EFFE] text-[#6A3BE8] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Users className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-[#15112B]">Add Client</span>
              </Link>

              {/* Log Activity */}
              <Link
                href="/internal/attendance"
                className="p-3 border border-[#ECE9F4] rounded-xl hover:border-[#6A3BE8] hover:bg-[#F9F8FD] transition-all flex flex-col items-center justify-center text-center group"
              >
                <div className="h-8 w-8 rounded-lg bg-[#F4EFFE] text-[#6A3BE8] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-[#15112B]">Log Activity</span>
              </Link>

              {/* Create Proposal */}
              <Link
                href="/internal/opportunities"
                className="p-3 border border-[#ECE9F4] rounded-xl hover:border-[#6A3BE8] hover:bg-[#F9F8FD] transition-all flex flex-col items-center justify-center text-center group"
              >
                <div className="h-8 w-8 rounded-lg bg-[#F4EFFE] text-[#6A3BE8] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <FileCheck className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-[#15112B]">Create Proposal</span>
              </Link>

              {/* Assign Task */}
              <Link
                href="/internal/tasks"
                className="p-3 border border-[#ECE9F4] rounded-xl hover:border-[#6A3BE8] hover:bg-[#F9F8FD] transition-all flex flex-col items-center justify-center text-center group"
              >
                <div className="h-8 w-8 rounded-lg bg-[#F4EFFE] text-[#6A3BE8] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <CheckSquare className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-[#15112B]">Assign Task</span>
              </Link>

              {/* Upload Doc */}
              <Link
                href="/internal/contracts"
                className="p-3 border border-[#ECE9F4] rounded-xl hover:border-[#6A3BE8] hover:bg-[#F9F8FD] transition-all flex flex-col items-center justify-center text-center group"
              >
                <div className="h-8 w-8 rounded-lg bg-[#F4EFFE] text-[#6A3BE8] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Upload className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-[#15112B]">Upload Doc</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4. Bottom Row: Revenue Trend Bar Chart, Clients by Service & Upcoming Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Revenue Trend (Column 1) */}
          <div className="bg-white rounded-2xl p-6 border border-[#ECE9F4] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#15112B]">Revenue Trend</h3>
              <button className="text-xs font-semibold text-[#7A7593] border border-[#ECE9F4] px-2.5 py-1 rounded-lg flex items-center space-x-1">
                <span>This Year</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>

            <div className="h-52 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.revenue_trend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F2EFF8" />
                  <XAxis dataKey="month" stroke="#A298C5" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#A298C5"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val / 100000}L`}
                    domain={[0, 1200000]}
                  />
                  <Tooltip
                    formatter={(val: any) => [`₹${(Number(val) / 100000).toFixed(2)}L`, "Revenue"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #ECE9F4", fontSize: "11px" }}
                  />
                  <Bar dataKey="revenue_rupees" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Clients by Service (Column 2) */}
          <div className="bg-white rounded-2xl p-6 border border-[#ECE9F4] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#15112B]">Clients by Service</h3>
              <span className="text-[11px] font-medium text-[#7A7593]">Total {d.total_clients} Clients</span>
            </div>

            <div className="grid grid-cols-4 gap-3 my-auto">
              {/* Websites */}
              <div className="bg-[#F8F9FE] border border-[#E9EEFC] rounded-xl p-3 flex flex-col items-center text-center">
                <div className="h-8 w-8 rounded-lg bg-blue-100/60 text-blue-600 flex items-center justify-center mb-2">
                  <Monitor className="h-4 w-4" />
                </div>
                <span className="text-xl font-extrabold text-[#15112B] leading-none">56</span>
                <span className="text-[10px] font-semibold text-[#7A7593] mt-1">Websites</span>
              </div>

              {/* Digital Marketing */}
              <div className="bg-[#FAF8FE] border border-[#EDE7FC] rounded-xl p-3 flex flex-col items-center text-center">
                <div className="h-8 w-8 rounded-lg bg-purple-100/60 text-[#6A3BE8] flex items-center justify-center mb-2">
                  <Megaphone className="h-4 w-4" />
                </div>
                <span className="text-xl font-extrabold text-[#15112B] leading-none">38</span>
                <span className="text-[10px] font-semibold text-[#7A7593] mt-1">Digital Marketing</span>
              </div>

              {/* CRM / ERP */}
              <div className="bg-[#F7FDF9] border border-[#E3F6EC] rounded-xl p-3 flex flex-col items-center text-center">
                <div className="h-8 w-8 rounded-lg bg-emerald-100/60 text-emerald-600 flex items-center justify-center mb-2">
                  <Layers className="h-4 w-4" />
                </div>
                <span className="text-xl font-extrabold text-[#15112B] leading-none">22</span>
                <span className="text-[10px] font-semibold text-[#7A7593] mt-1">CRM / ERP</span>
              </div>

              {/* Others */}
              <div className="bg-[#F8F9FE] border border-[#E9EEFC] rounded-xl p-3 flex flex-col items-center text-center">
                <div className="h-8 w-8 rounded-lg bg-blue-100/60 text-blue-600 flex items-center justify-center mb-2">
                  <LayoutGrid className="h-4 w-4" />
                </div>
                <span className="text-xl font-extrabold text-[#15112B] leading-none">26</span>
                <span className="text-[10px] font-semibold text-[#7A7593] mt-1">Others</span>
              </div>
            </div>
          </div>

          {/* Upcoming Tasks (Column 3) */}
          <div className="bg-white rounded-2xl p-6 border border-[#ECE9F4] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#15112B]">Upcoming Tasks</h3>
              <Link
                href="/internal/tasks"
                className="text-xs font-semibold text-[#6A3BE8] hover:text-[#5528DA] flex items-center"
              >
                View All <span className="ml-1">→</span>
              </Link>
            </div>

            <div className="space-y-3">
              {d.upcoming_tasks.map((task) => {
                const isDone = !!taskChecked[task.id];
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-[#FAF9FD] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                          isDone
                            ? "bg-[#6A3BE8] border-[#6A3BE8] text-white"
                            : "border-[#D1CCE0] bg-white group-hover:border-[#6A3BE8]"
                        }`}
                      >
                        {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span
                        className={`truncate font-medium ${
                          isDone ? "line-through text-[#A298C5]" : "text-[#15112B]"
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          task.is_urgent
                            ? "text-rose-600 bg-rose-50"
                            : "text-[#7A7593] bg-[#F5F2FC]"
                        }`}
                      >
                        {task.due_text}
                      </span>
                      <button className="text-[#A298C5] hover:text-[#15112B]">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
