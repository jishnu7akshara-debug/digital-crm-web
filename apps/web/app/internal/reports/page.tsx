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
  LineChart,
  Line,
} from "recharts";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";

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
  { name: "Web Development", value: 40, amount: "₹3,90,000", color: "#6C3BDB" },
  { name: "Digital Marketing", value: 25, amount: "₹2,43,750", color: "#38BDF8" },
  { name: "CRM / ERP", value: 15, amount: "₹1,46,250", color: "#10B981" },
  { name: "Branding & Media", value: 10, amount: "₹97,500", color: "#F59E0B" },
  { name: "Others", value: 10, amount: "₹97,500", color: "#EC4899" },
];

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("year");

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F8FC]">
      <Header />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Title & Export */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-[#77738A] mb-1">
              <Link href="/internal/dashboard" className="hover:text-[#6437EA]">Dashboard</Link>
              <span>/</span>
              <span className="text-[#1D1930] font-medium">Reports & Analytics</span>
            </div>
            <h1 className="text-2xl font-black text-[#1D1930] tracking-tight">
              Executive Reports & Performance Analytics
            </h1>
            <p className="text-xs text-[#77738A] mt-1">
              Cross-functional insights across billings, service margins, pipeline velocity, and client retention.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => alert("Exporting Financial & Operational Report (CSV)...")}
              className="text-xs px-4 py-2.5 rounded-xl border-[#EBE8F3] text-[#1D1930] flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
            <Button
              onClick={() => alert("Generating Executive PDF Brief...")}
              className="bg-[#6437EA] hover:bg-[#5528DA] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Download PDF Summary</span>
            </Button>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#EBE8F3] shadow-sm">
            <span className="text-[10px] font-bold text-[#77738A] uppercase tracking-wider block">YTD Gross Revenue</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-2xl font-black text-[#1D1930]">₹61,05,000</span>
              <span className="text-xs font-bold text-emerald-600">+28% YoY</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EBE8F3] shadow-sm">
            <span className="text-[10px] font-bold text-[#77738A] uppercase tracking-wider block">Cash Collected (MTD)</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-2xl font-black text-emerald-600">₹9,20,000</span>
              <span className="text-xs font-bold text-[#77738A]">94.3% Collection</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EBE8F3] shadow-sm">
            <span className="text-[10px] font-bold text-[#77738A] uppercase tracking-wider block">Average Deal Size</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-2xl font-black text-[#6437EA]">₹1,74,500</span>
              <span className="text-xs font-bold text-emerald-600">+15%</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#EBE8F3] shadow-sm">
            <span className="text-[10px] font-bold text-[#77738A] uppercase tracking-wider block">Client Retention Rate</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-2xl font-black text-[#1D1930]">96.4%</span>
              <span className="text-xs font-bold text-emerald-600">Top Quartile</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue & Collection Growth */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#EBE8F3] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#1D1930]">Revenue vs. Cash Collection Trend</h3>
                <p className="text-[11px] text-[#77738A]">Invoiced volume against cash collected per month in FY 2026</p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-semibold">
                <div className="flex items-center space-x-1.5">
                  <span className="h-3 w-3 rounded-sm bg-[#6437EA]" />
                  <span>Invoiced</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-3 w-3 rounded-sm bg-[#38BDF8]" />
                  <span>Collected</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_DATA} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EDF7" />
                  <XAxis dataKey="month" stroke="#9D95B5" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#9D95B5"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, ""]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #ECE9F4" }}
                  />
                  <Bar dataKey="revenue" fill="#6437EA" radius={[4, 4, 0, 0]} name="Invoiced" />
                  <Bar dataKey="collected" fill="#38BDF8" radius={[4, 4, 0, 0]} name="Collected" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Service Share Donut */}
          <div className="bg-white p-6 rounded-2xl border border-[#EBE8F3] shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1D1930]">Service-Wise Revenue Share</h3>
              <p className="text-[11px] text-[#77738A]">Breakdown of gross earnings by business line</p>
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
                    contentStyle={{ borderRadius: "12px", border: "1px solid #ECE9F4" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 border-t border-[#F0EDF7] pt-3 text-xs">
              {SERVICE_SHARE.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[#1D1930] font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#1D1930]">{item.amount}</span>
                    <span className="text-[10px] text-[#77738A] ml-1.5 font-semibold">({item.value}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
