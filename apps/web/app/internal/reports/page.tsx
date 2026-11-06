"use client";

import React, { useState } from "react";
import Link from "next/link";
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

const MONTHLY_DATA = [
  { month: "Jan", revenue: 120000, collected: 110000 },
  { month: "Feb", revenue: 190000, collected: 180000 },
  { month: "Mar", revenue: 260000, collected: 240000 },
  { month: "Apr", revenue: 380000, collected: 350000 },
  { month: "May", revenue: 470000, collected: 450000 },
  { month: "Jun", revenue: 560000, collected: 530000 },
  { month: "Jul", revenue: 680000, collected: 650000 },
  { month: "Aug", revenue: 750000, collected: 710000 },
  { month: "Sep", revenue: 840000, collected: 800000 },
  { month: "Oct", revenue: 910000, collected: 890000 },
  { month: "Nov", revenue: 975000, collected: 920000 },
];

const SERVICE_SHARE = [
  { name: "Web Development", value: 40, amount: "₹3,90,000", color: "#5B4BDB" },
  { name: "Digital Marketing", value: 25, amount: "₹2,43,750", color: "#06B6D4" },
  { name: "CRM / ERP", value: 15, amount: "₹1,46,250", color: "#10B981" },
  { name: "Branding & Media", value: 10, amount: "₹97,500", color: "#F59E0B" },
  { name: "Others", value: 10, amount: "₹97,500", color: "#C084FC" },
];

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("year");

  return (
    <div className="space-y-6 select-none">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              FINANCE & ANALYTICS
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              FY 2026 MTD
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Executive Reports & Analytics
          </h2>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Cross-functional insights across billings, service margins, pipeline velocity, and client retention.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => alert("Exporting Financial & Operational Report (CSV)...")}
            className="h-10 px-4 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FB] text-[#0F172A] text-[13px] font-medium rounded-xl transition-colors shadow-soft flex items-center space-x-2"
          >
            <Download className="h-4 w-4 text-[#64748B]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => alert("Generating Executive PDF Brief...")}
            className="h-10 px-4 bg-[#5B4BDB] hover:bg-[#4D3DC9] text-white text-[13px] font-semibold rounded-xl transition-all shadow-soft flex items-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Download PDF Summary</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            YTD Gross Revenue
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-[#0F172A]">₹61,05,000</span>
            <span className="text-xs font-semibold text-emerald-600">+28% YoY</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Cash Collected (MTD)
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-emerald-600">₹9,20,000</span>
            <span className="text-xs font-medium text-[#64748B]">94.3%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Average Deal Size
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-[#5B4BDB]">₹1,74,500</span>
            <span className="text-xs font-semibold text-emerald-600">+15%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Client Retention Rate
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-[#0F172A]">96.4%</span>
            <span className="text-xs font-semibold text-emerald-600">Top Quartile</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Collection Growth */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5E7EB]">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Revenue vs. Cash Collection Trend
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Invoiced volume against cash collected per month in FY 2026
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-semibold">
              <div className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded-md bg-[#5B4BDB]" />
                <span className="text-[#0F172A]">Invoiced</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded-md bg-[#06B6D4]" />
                <span className="text-[#0F172A]">Collected</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_DATA} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, ""]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB" }}
                />
                <Bar dataKey="revenue" fill="#5B4BDB" radius={[4, 4, 0, 0]} name="Invoiced" />
                <Bar dataKey="collected" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Collected" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Share Donut */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">
              Service-Wise Revenue Share
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Breakdown of gross earnings by business line
            </p>
          </div>

          <div className="h-52 w-full my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SERVICE_SHARE}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {SERVICE_SHARE.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number, name: string) => [`${val}%`, name]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-[#F1F5F9] pt-3 text-xs">
            {SERVICE_SHARE.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#0F172A] font-medium">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#0F172A]">{item.amount}</span>
                  <span className="text-[10px] text-[#64748B] ml-1.5 font-semibold">({item.value}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}