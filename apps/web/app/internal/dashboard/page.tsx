"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  FolderKanban,
  Receipt,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  Calendar,
  ChevronDown,
  Check,
  MoreVertical,
  UserPlus,
  FolderPlus,
  FilePlus,
  Building,
  CheckSquare,
  UploadCloud,
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

// Revenue Trend Bar Data (Jan to Nov, up to ₹12L)
const REVENUE_TREND_DATA = [
  { month: "Jan", revenue: 2.1 },
  { month: "Feb", revenue: 2.8 },
  { month: "Mar", revenue: 3.5 },
  { month: "Apr", revenue: 4.2 },
  { month: "May", revenue: 5.1 },
  { month: "Jun", revenue: 6.4 },
  { month: "Jul", revenue: 7.2 },
  { month: "Aug", revenue: 8.0 },
  { month: "Sep", revenue: 8.9 },
  { month: "Oct", revenue: 9.4 },
  { month: "Nov", revenue: 9.75 },
];

// Donut Chart Data: Service-Wise Revenue (MTD)
const SERVICE_REVENUE_DATA = [
  { name: "Web Development", value: 40, color: "#5B4BDB" },
  { name: "Digital Marketing", value: 25, color: "#06B6D4" },
  { name: "CRM / ERP", value: 15, color: "#10B981" },
  { name: "Branding & Media", value: 10, color: "#F59E0B" },
  { name: "Others", value: 10, color: "#C084FC" },
];

// Active Projects Table Data matching mockup
const ACTIVE_PROJECTS = [
  {
    id: "p-1",
    name: "Sashikiran Surveyors – Website",
    client: "Sashikiran Surveyors",
    service: "Website",
    serviceColor: "bg-[#EEF2FF] text-[#5B4BDB]",
    progress: 80,
    dueDate: "Nov 10, 2026",
    status: "In Progress",
    statusColor: "bg-[#FFFBEB] text-[#D97706]",
    initials: "SS",
    iconBg: "bg-emerald-800",
  },
  {
    id: "p-2",
    name: "Talenty Consulting – Marketing",
    client: "Talenty Consulting",
    service: "Digital Marketing",
    serviceColor: "bg-[#FFF7ED] text-[#EA580C]",
    progress: 60,
    dueDate: "Nov 15, 2026",
    status: "In Progress",
    statusColor: "bg-[#FFFBEB] text-[#D97706]",
    initials: "TC",
    iconBg: "bg-indigo-950",
  },
  {
    id: "p-3",
    name: "KalpaTouch – CRM Setup",
    client: "KalpaTouch",
    service: "CRM / ERP",
    serviceColor: "bg-[#ECFDF5] text-[#059669]",
    progress: 40,
    dueDate: "Nov 20, 2026",
    status: "In Progress",
    statusColor: "bg-[#FFFBEB] text-[#D97706]",
    initials: "KT",
    iconBg: "bg-cyan-900",
  },
  {
    id: "p-4",
    name: "Delights – Branding & Media",
    client: "Delights",
    service: "Branding & Media",
    serviceColor: "bg-[#FDF2F8] text-[#DB2777]",
    progress: 90,
    dueDate: "Nov 8, 2026",
    status: "Review",
    statusColor: "bg-[#EFF6FF] text-[#2563EB]",
    initials: "DG",
    iconBg: "bg-amber-800",
  },
  {
    id: "p-5",
    name: "Aroma Dew – Catalogue",
    client: "Aroma Dew",
    service: "Branding & Media",
    serviceColor: "bg-[#FDF2F8] text-[#DB2777]",
    progress: 100,
    dueDate: "Nov 5, 2026",
    status: "Completed",
    statusColor: "bg-[#ECFDF5] text-[#059669]",
    initials: "AD",
    iconBg: "bg-yellow-700",
  },
];

// Tasks Data with checkable state
const INITIAL_TASKS = [
  {
    id: "t-1",
    title: "Follow up – Sashikiran Surveyors",
    time: "Today, 4:00 PM",
    badgeColor: "bg-[#FFF1F2] text-[#E11D48]",
    done: false,
  },
  {
    id: "t-2",
    title: "Send proposal – New Lead",
    time: "Tomorrow",
    badgeColor: "bg-[#F1F5F9] text-[#64748B]",
    done: false,
  },
  {
    id: "t-3",
    title: "Project review – Talenty Consulting",
    time: "Nov 6",
    badgeColor: "bg-[#F1F5F9] text-[#64748B]",
    done: false,
  },
  {
    id: "t-4",
    title: "Invoice reminder – Aroma Dew",
    time: "Nov 6",
    badgeColor: "bg-[#F1F5F9] text-[#64748B]",
    done: false,
  },
];

export default function SaasDashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [trendRange, setTrendRange] = useState("This Year");

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const displayName = user?.full_name?.split(" ")[0] || "Sai";

  return (
    <div className="space-y-6 select-none">
      {/* 1. Page Header (Greeting + Date Picker Pill) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-[26px] font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
            <span>Good Afternoon, {displayName}</span>
            <span className="text-2xl animate-pulse">👋</span>
          </h1>
          <p className="text-[13.5px] text-[#64748B] mt-1 font-normal">
            Here&apos;s what&apos;s happening at Digital Footprint today.
          </p>
        </div>

        {/* Date Filter Pill */}
        <div className="flex items-center space-x-2 bg-white border border-[#E5E7EB] px-3.5 py-2 rounded-xl text-[13px] font-medium text-[#0F172A] shadow-soft cursor-pointer hover:bg-[#F8F9FB] transition-colors self-start sm:self-auto">
          <Calendar className="h-4 w-4 text-[#64748B]" />
          <span>Nov 1, 2026 – Nov 30, 2026</span>
          <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8]" />
        </div>
      </div>

      {/* 2. Top 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Clients */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card hover:shadow-dropdown transition-shadow">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[#F0EDFF] text-[#5B4BDB] flex items-center justify-center">
              <Users className="h-5 w-5 stroke-[2]" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <span>↑</span>
              <span>+12%</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-[28px] font-bold text-[#0F172A] tracking-tight">
              142
            </div>
            <div className="text-[13px] text-[#64748B] mt-0.5 font-medium">
              Total Clients
            </div>
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card hover:shadow-dropdown transition-shadow">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[#F0EDFF] text-[#5B4BDB] flex items-center justify-center">
              <FolderKanban className="h-5 w-5 stroke-[2]" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <span>↑</span>
              <span>+18%</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-[28px] font-bold text-[#0F172A] tracking-tight">
              38
            </div>
            <div className="text-[13px] text-[#64748B] mt-0.5 font-medium">
              Active Projects
            </div>
          </div>
        </div>

        {/* Pipeline Value */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card hover:shadow-dropdown transition-shadow">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[#F0EDFF] text-[#5B4BDB] flex items-center justify-center font-bold text-lg">
              ₹
            </div>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <span>↑</span>
              <span>+32%</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-[28px] font-bold text-[#0F172A] tracking-tight">
              ₹24,80,000
            </div>
            <div className="text-[13px] text-[#64748B] mt-0.5 font-medium">
              Pipeline Value
            </div>
          </div>
        </div>

        {/* Revenue (This Month) */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card hover:shadow-dropdown transition-shadow">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-[#F0EDFF] text-[#5B4BDB] flex items-center justify-center">
              <Receipt className="h-5 w-5 stroke-[2]" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <span>↑</span>
              <span>+21%</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-[28px] font-bold text-[#0F172A] tracking-tight">
              ₹9,75,000
            </div>
            <div className="text-[13px] text-[#64748B] mt-0.5 font-medium">
              Revenue (This Month)
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Sales Pipeline + Active Projects (Left) vs Revenue Donut + Quick Actions + Tasks (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Pipeline Chevron Funnel Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                  Sales Pipeline
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  ₹24,80,000 across 46 deals
                </p>
              </div>
              <Link
                href="/internal/opportunities"
                className="text-[13px] font-semibold text-[#5B4BDB] hover:underline flex items-center gap-1"
              >
                <span>View Pipeline</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Funnel Chevron Flow */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
              {/* Step 1: Leads */}
              <div className="bg-[#F8F9FD] border border-[#E5E7EB] rounded-xl p-3.5 text-center relative overflow-hidden group hover:border-[#5B4BDB]/40 transition-colors">
                <div className="text-xs font-semibold text-[#64748B]">Leads</div>
                <div className="text-xl font-bold text-[#0F172A] mt-1">18</div>
                <div className="text-[11px] text-[#64748B] font-medium mt-0.5">
                  ₹4,20,000
                </div>
              </div>

              {/* Step 2: Qualified */}
              <div className="bg-[#F8F9FD] border border-[#E5E7EB] rounded-xl p-3.5 text-center relative overflow-hidden group hover:border-[#5B4BDB]/40 transition-colors">
                <div className="text-xs font-semibold text-[#64748B]">Qualified</div>
                <div className="text-xl font-bold text-[#0F172A] mt-1">11</div>
                <div className="text-[11px] text-[#64748B] font-medium mt-0.5">
                  ₹6,10,000
                </div>
              </div>

              {/* Step 3: Proposal */}
              <div className="bg-[#F8F9FD] border border-[#E5E7EB] rounded-xl p-3.5 text-center relative overflow-hidden group hover:border-[#5B4BDB]/40 transition-colors">
                <div className="text-xs font-semibold text-[#64748B]">Proposal</div>
                <div className="text-xl font-bold text-[#0F172A] mt-1">8</div>
                <div className="text-[11px] text-[#64748B] font-medium mt-0.5">
                  ₹7,50,000
                </div>
              </div>

              {/* Step 4: Negotiation */}
              <div className="bg-[#F8F9FD] border border-[#E5E7EB] rounded-xl p-3.5 text-center relative overflow-hidden group hover:border-[#5B4BDB]/40 transition-colors">
                <div className="text-xs font-semibold text-[#64748B]">Negotiation</div>
                <div className="text-xl font-bold text-[#0F172A] mt-1">5</div>
                <div className="text-[11px] text-[#64748B] font-medium mt-0.5">
                  ₹4,00,000
                </div>
              </div>

              {/* Step 5: Won (Highlighted Purple as in mockup) */}
              <div className="bg-[#5B4BDB] text-white rounded-xl p-3.5 text-center relative overflow-hidden shadow-md col-span-2 sm:col-span-1">
                <div className="text-xs font-semibold text-white/90">Won</div>
                <div className="text-xl font-bold text-white mt-1">4</div>
                <div className="text-[11px] text-white/90 font-medium mt-0.5">
                  ₹3,00,000
                </div>
              </div>
            </div>
          </div>

          {/* Active Projects (38) Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                  Active Projects (38)
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

            {/* Clean Projects Table */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Project</th>
                    <th className="pb-3 font-semibold">Client</th>
                    <th className="pb-3 font-semibold">Service</th>
                    <th className="pb-3 font-semibold">Progress</th>
                    <th className="pb-3 font-semibold">Due Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {ACTIVE_PROJECTS.map((proj) => (
                    <tr
                      key={proj.id}
                      className="hover:bg-[#F8F9FB] transition-colors group cursor-pointer"
                    >
                      {/* Project Name + Icon */}
                      <td className="py-3.5 pr-3 font-semibold text-[#0F172A] flex items-center space-x-2.5">
                        <div
                          className={`h-6 w-6 rounded-md ${proj.iconBg} text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs`}
                        >
                          {proj.initials}
                        </div>
                        <span className="truncate group-hover:text-[#5B4BDB] transition-colors">
                          {proj.name}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 pr-3 text-[#64748B]">
                        {proj.client}
                      </td>

                      {/* Service Badge */}
                      <td className="py-3.5 pr-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${proj.serviceColor}`}
                        >
                          {proj.service}
                        </span>
                      </td>

                      {/* Progress Bar */}
                      <td className="py-3.5 pr-3">
                        <div className="flex items-center space-x-2 w-28">
                          <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#5B4BDB] h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${proj.progress}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-[#64748B]">
                            {proj.progress}%
                          </span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 pr-3 text-[#64748B] text-xs font-normal">
                        {proj.dueDate}
                      </td>

                      {/* Status */}
                      <td className="py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${proj.statusColor}`}
                        >
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

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* Service-Wise Revenue (MTD) Donut Chart */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-card">
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight mb-4">
              Service-Wise Revenue (MTD)
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Donut Chart with Center Text */}
              <div className="relative w-40 h-40 shrink-0">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={SERVICE_REVENUE_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {SERVICE_REVENUE_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full rounded-full border-4 border-[#5B4BDB] animate-pulse" />
                )}

                {/* Center Label inside Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[14px] font-bold text-[#0F172A] leading-tight">
                    ₹9,75,000
                  </span>
                  <span className="text-[10px] text-[#64748B] font-medium">
                    Total
                  </span>
                </div>
              </div>

              {/* Legend with percent */}
              <div className="space-y-2 text-xs flex-1">
                {SERVICE_REVENUE_DATA.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-[#64748B]"
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[12px] font-normal">{item.name}</span>
                    </div>
                    <span className="font-semibold text-[#0F172A]">
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions (8 button grid) */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-card">
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight mb-4">
              Quick Actions
            </h2>

            <div className="grid grid-cols-4 gap-2.5">
              <Link
                href="/internal/leads"
                className="flex flex-col items-center justify-center p-2.5 border border-[#E5E7EB] rounded-xl hover:border-[#5B4BDB] hover:bg-[#F8F9FD] transition-all text-center group"
              >
                <UserPlus className="h-4 w-4 text-[#5B4BDB] group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[11px] font-medium text-[#0F172A] leading-tight">
                  Add Lead
                </span>
              </Link>

              <Link
                href="/internal/projects"
                className="flex flex-col items-center justify-center p-2.5 border border-[#E5E7EB] rounded-xl hover:border-[#5B4BDB] hover:bg-[#F8F9FD] transition-all text-center group"
              >
                <FolderPlus className="h-4 w-4 text-[#0284C7] group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[11px] font-medium text-[#0F172A] leading-tight">
                  Create Project
                </span>
              </Link>

              <Link
                href="/internal/invoices"
                className="flex flex-col items-center justify-center p-2.5 border border-[#E5E7EB] rounded-xl hover:border-[#5B4BDB] hover:bg-[#F8F9FD] transition-all text-center group"
              >
                <Receipt className="h-4 w-4 text-[#059669] group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[11px] font-medium text-[#0F172A] leading-tight">
                  Create Invoice
                </span>
              </Link>

              <Link
                href="/internal/clients/new"
                className="flex flex-col items-center justify-center p-2.5 border border-[#E5E7EB] rounded-xl hover:border-[#5B4BDB] hover:bg-[#F8F9FD] transition-all text-center group"
              >
                <Building className="h-4 w-4 text-[#D97706] group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[11px] font-medium text-[#0F172A] leading-tight">
                  Add Client
                </span>
              </Link>

              <Link
                href="/internal/attendance"
                className="flex flex-col items-center justify-center p-2.5 border border-[#E5E7EB] rounded-xl hover:border-[#5B4BDB] hover:bg-[#F8F9FD] transition-all text-center group"
              >
                <Calendar className="h-4 w-4 text-[#7C3AED] group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[11px] font-medium text-[#0F172A] leading-tight">
                  Log Activity
                </span>
              </Link>

              <Link
                href="/internal/agreements"
                className="flex flex-col items-center justify-center p-2.5 border border-[#E5E7EB] rounded-xl hover:border-[#5B4BDB] hover:bg-[#F8F9FD] transition-all text-center group"
              >
                <FileText className="h-4 w-4 text-[#E11D48] group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[11px] font-medium text-[#0F172A] leading-tight">
                  Create Proposal
                </span>
              </Link>

              <Link
                href="/internal/projects"
                className="flex flex-col items-center justify-center p-2.5 border border-[#E5E7EB] rounded-xl hover:border-[#5B4BDB] hover:bg-[#F8F9FD] transition-all text-center group"
              >
                <CheckSquare className="h-4 w-4 text-[#0284C7] group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[11px] font-medium text-[#0F172A] leading-tight">
                  Assign Task
                </span>
              </Link>

              <Link
                href="/internal/agreements"
                className="flex flex-col items-center justify-center p-2.5 border border-[#E5E7EB] rounded-xl hover:border-[#5B4BDB] hover:bg-[#F8F9FD] transition-all text-center group"
              >
                <UploadCloud className="h-4 w-4 text-[#5B4BDB] group-hover:scale-110 transition-transform mb-1" />
                <span className="text-[11px] font-medium text-[#0F172A] leading-tight">
                  Upload Doc
                </span>
              </Link>
            </div>
          </div>

          {/* Upcoming Tasks Checklist */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-3">
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Upcoming Tasks
              </h2>
              <Link
                href="/internal/attendance"
                className="text-[12px] font-semibold text-[#5B4BDB] hover:underline flex items-center gap-0.5"
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F8F9FB] transition-colors group cursor-pointer"
                  onClick={() => toggleTask(task.id)}
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <div
                      className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${task.done
                          ? "bg-[#5B4BDB] border-[#5B4BDB] text-white"
                          : "border-[#CBD5E1] bg-white group-hover:border-[#5B4BDB]"
                        }`}
                    >
                      {task.done && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span
                      className={`text-[12.5px] truncate ${task.done
                          ? "line-through text-[#94A3B8]"
                          : "text-[#0F172A] font-medium"
                        }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0 pl-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${task.badgeColor}`}
                    >
                      {task.time}
                    </span>
                    <MoreVertical className="h-3.5 w-3.5 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Revenue Trend Bar Chart + Clients by Service */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Revenue Trend (2 cols or 3 cols) */}
        <div className="lg:col-span-3 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] mb-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Revenue Trend
              </h2>
            </div>
            {/* Filter Dropdown */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#F8F9FB] border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#0F172A] cursor-pointer hover:bg-[#F1F5F9] transition-colors">
              <span>{trendRange}</span>
              <ChevronDown className="h-3 w-3 text-[#64748B]" />
            </div>
          </div>

          <div className="h-56 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={REVENUE_TREND_DATA}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="purpleBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C5CFC" />
                      <stop offset="100%" stopColor="#5B4BDB" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F1F5F9"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    axisLine={{ stroke: "#E5E7EB" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    axisLine={{ stroke: "#E5E7EB" }}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}L`}
                    domain={[0, 12]}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(91, 75, 219, 0.05)" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#0F172A] text-white p-2.5 rounded-xl text-xs shadow-xl border border-white/10">
                            <span className="font-semibold block">
                              {payload[0].payload.month} 2026
                            </span>
                            <span className="text-[#A5B4FC] font-bold">
                              ₹{payload[0].value} Lakhs
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="url(#purpleBar)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-[#F8F9FD] rounded-xl animate-pulse" />
            )}
          </div>
        </div>

        {/* Clients by Service (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] mb-4">
            <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
              Clients by Service
            </h2>
            <span className="text-xs text-[#64748B] font-medium">
              Total 142 Clients
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-auto">
            {/* Websites */}
            <div className="bg-[#F0F9FF] border border-[#E0F2FE] p-4 rounded-xl text-center flex flex-col items-center justify-center hover:shadow-sm transition-shadow">
              <Monitor className="h-5 w-5 text-[#0284C7] mb-2" />
              <div className="text-2xl font-bold text-[#0F172A]">56</div>
              <div className="text-[11px] text-[#64748B] font-medium mt-0.5">
                Websites
              </div>
            </div>

            {/* Digital Marketing */}
            <div className="bg-[#FAF5FF] border border-[#F3E8FF] p-4 rounded-xl text-center flex flex-col items-center justify-center hover:shadow-sm transition-shadow">
              <Megaphone className="h-5 w-5 text-[#9333EA] mb-2" />
              <div className="text-2xl font-bold text-[#0F172A]">38</div>
              <div className="text-[11px] text-[#64748B] font-medium mt-0.5">
                Digital Marketing
              </div>
            </div>

            {/* CRM / ERP */}
            <div className="bg-[#ECFDF5] border border-[#D1FAE5] p-4 rounded-xl text-center flex flex-col items-center justify-center hover:shadow-sm transition-shadow">
              <Layers className="h-5 w-5 text-[#059669] mb-2" />
              <div className="text-2xl font-bold text-[#0F172A]">22</div>
              <div className="text-[11px] text-[#64748B] font-medium mt-0.5">
                CRM / ERP
              </div>
            </div>

            {/* Others */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl text-center flex flex-col items-center justify-center hover:shadow-sm transition-shadow">
              <LayoutGrid className="h-5 w-5 text-[#475569] mb-2" />
              <div className="text-2xl font-bold text-[#0F172A]">26</div>
              <div className="text-[11px] text-[#64748B] font-medium mt-0.5">
                Others
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E7EB] mt-4 flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Updated 10 mins ago</span>
            <Link
              href="/internal/services"
              className="text-[#5B4BDB] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Explore catalogue</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
