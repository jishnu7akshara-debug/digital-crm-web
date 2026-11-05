"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Building2,
  FolderKanban,
  CheckSquare,
  FileText,
  CreditCard,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatINR, formatINRPrecise, formatDateTime } from "@/lib/utils";

interface DashboardKpiData {
  total_leads: number;
  active_clients: number;
  active_projects: number;
  pending_tasks: number;
  total_invoiced_rupees: number;
  total_collected_rupees: number;
  total_outstanding_rupees: number;
  monthly_revenue: {
    month: string;
    invoiced_rupees: number;
    collected_rupees: number;
  }[];
  upcoming_deadlines: {
    id: string;
    title: string;
    due_date: string;
    progress_percent: number;
    status: string;
  }[];
  recent_activity: {
    id: string;
    action: string;
    resource_type: string;
    resource_id: string;
    user_email: string;
    timestamp: string;
  }[];
}

export default function InternalDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery<DashboardKpiData>({
    queryKey: ["dashboard-kpis"],
    queryFn: () => api.get<DashboardKpiData>("/dashboard/kpis"),
  });

  return (
    <>
      <Header
        title="Executive Overview"
        subtitle="Operational metrics, project delivery tracking, and revenue health"
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Loading / Error States */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white border border-[#E9E5F0] rounded-lg" />
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Failed to load real-time KPI metrics.</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {data && (
          <>
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#77738A]">Active Clients</p>
                    <h3 className="text-2xl font-bold text-[#1D1930] mt-1">{data.active_clients}</h3>
                    <Link
                      href="/internal/clients"
                      className="text-[11px] text-[#6C3BDB] font-medium mt-1 flex items-center hover:underline"
                    >
                      View Client 360 <ArrowUpRight className="h-3 w-3 ml-0.5" />
                    </Link>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-[#F5F1FF] flex items-center justify-center text-[#6C3BDB]">
                    <Building2 className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#77738A]">Active Projects</p>
                    <h3 className="text-2xl font-bold text-[#1D1930] mt-1">{data.active_projects}</h3>
                    <Link
                      href="/internal/projects"
                      className="text-[11px] text-[#6C3BDB] font-medium mt-1 flex items-center hover:underline"
                    >
                      View Workspaces <ArrowUpRight className="h-3 w-3 ml-0.5" />
                    </Link>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-[#F5F1FF] flex items-center justify-center text-[#6C3BDB]">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#77738A]">Pending Tasks</p>
                    <h3 className="text-2xl font-bold text-[#1D1930] mt-1">{data.pending_tasks}</h3>
                    <Link
                      href="/internal/projects"
                      className="text-[11px] text-[#77738A] font-medium mt-1 flex items-center"
                    >
                      Across all milestones
                    </Link>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-[#F3F1F8] flex items-center justify-center text-[#77738A]">
                    <CheckSquare className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#77738A]">Sales Leads</p>
                    <h3 className="text-2xl font-bold text-[#1D1930] mt-1">{data.total_leads}</h3>
                    <Link
                      href="/internal/leads"
                      className="text-[11px] text-[#6C3BDB] font-medium mt-1 flex items-center hover:underline"
                    >
                      Open Pipeline <ArrowUpRight className="h-3 w-3 ml-0.5" />
                    </Link>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-[#F5F1FF] flex items-center justify-center text-[#6C3BDB]">
                    <Users className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Financial Health Snapshot Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-[#6C3BDB]">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#77738A]">Total Invoiced (GST Incl.)</span>
                    <Badge variant="default">All Time</Badge>
                  </div>
                  <h2 className="text-2xl font-bold text-[#1D1930] mt-2">
                    {formatINRPrecise(data.total_invoiced_rupees)}
                  </h2>
                  <p className="text-[11px] text-[#77738A] mt-1">Recognized invoiced revenue</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#77738A]">Cash Collected</span>
                    <Badge variant="success">Liquidated</Badge>
                  </div>
                  <h2 className="text-2xl font-bold text-emerald-600 mt-2">
                    {formatINRPrecise(data.total_collected_rupees)}
                  </h2>
                  <p className="text-[11px] text-[#77738A] mt-1">Verified payment receipts</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#77738A]">Outstanding Receivables</span>
                    <Badge variant="warning">Due</Badge>
                  </div>
                  <h2 className="text-2xl font-bold text-amber-600 mt-2">
                    {formatINRPrecise(data.total_outstanding_rupees)}
                  </h2>
                  <p className="text-[11px] text-[#77738A] mt-1">Pending client reconciliation</p>
                </CardContent>
              </Card>
            </div>

            {/* Middle Section: Revenue Chart & Deadlines */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Revenue Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Revenue Trend (Last 6 Months)</span>
                    <TrendingUp className="h-4 w-4 text-[#6C3BDB]" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.monthly_revenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9E5F0" />
                        <XAxis dataKey="month" stroke="#77738A" fontSize={11} tickLine={false} />
                        <YAxis stroke="#77738A" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                        <Tooltip
                          formatter={(value: any) => [formatINRPrecise(Number(value)), ""]}
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderRadius: "8px",
                            border: "1px solid #E9E5F0",
                            fontSize: "12px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                        <Bar dataKey="invoiced_rupees" name="Invoiced (INR)" fill="#6C3BDB" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="collected_rupees" name="Collected (INR)" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Deadlines */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Upcoming Deadlines</span>
                    <Clock className="h-4 w-4 text-[#77738A]" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  {data.upcoming_deadlines.length === 0 ? (
                    <p className="text-xs text-[#77738A] py-6 text-center">No upcoming project deadlines.</p>
                  ) : (
                    data.upcoming_deadlines.map((item) => (
                      <Link
                        key={item.id}
                        href={`/internal/projects/${item.id}`}
                        className="block p-3 rounded-lg border border-[#E9E5F0] hover:border-[#6C3BDB] transition-colors group"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="text-xs font-semibold text-[#1D1930] group-hover:text-[#6C3BDB] line-clamp-1">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-[#77738A] font-mono whitespace-nowrap ml-2">
                            {item.due_date}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-[#77738A]">
                          <span>Progress</span>
                          <span className="font-semibold text-[#1D1930]">{item.progress_percent}%</span>
                        </div>
                        <div className="w-full bg-[#F3F1F8] rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className="bg-[#6C3BDB] h-1.5 rounded-full"
                            style={{ width: `${item.progress_percent}%` }}
                          />
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bottom Section: Immutable Security Audit Log */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <ShieldCheck className="h-4 w-4 text-[#6C3BDB]" />
                    <span>Real-Time Security & Audit Activity</span>
                  </CardTitle>
                  <p className="text-xs text-[#77738A] mt-0.5">
                    Immutable activity log of user authentication, invoices, and permission changes
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[#E9E5F0]">
                  {data.recent_activity.map((log) => (
                    <div key={log.id} className="p-4 flex items-center justify-between text-xs hover:bg-[#F8F8FC]">
                      <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 rounded-full bg-[#6C3BDB]" />
                        <span className="font-mono font-medium text-[#1D1930] bg-[#F5F1FF] text-[#6C3BDB] px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                        <span className="text-[#77738A]">
                          Resource <span className="font-mono">{log.resource_type}</span> (#{log.resource_id.slice(0, 8)})
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-[#77738A]">
                        <span>{log.user_email}</span>
                        <span className="font-mono text-[11px]">{formatDateTime(log.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </>
  );
}
