"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  FolderKanban,
  FileText,
  Headphones,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatINRPrecise, formatDate } from "@/lib/utils";

export default function ClientPortalDashboard() {
  const { user } = useAuth();

  const { data: clientDetail, isLoading } = useQuery<any>({
    queryKey: ["portal-client-360", user?.client_id],
    queryFn: () => (user?.client_id ? api.get<any>(`/clients/${user.client_id}`) : null),
    enabled: !!user?.client_id,
  });

  return (
    <>
      <Header
        title="Client Portal"
        subtitle={`Welcome back, ${user?.full_name || "Valued Client"}`}
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {isLoading && (
          <div className="py-12 text-center text-xs text-[#77738A]">
            Loading your portal workspaces...
          </div>
        )}

        {clientDetail && (
          <>
            {/* Overview Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#77738A]">Active Projects</span>
                    <FolderKanban className="h-4 w-4 text-[#6C3BDB]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#1D1930] mt-1">
                    {clientDetail.projects?.length || 0}
                  </h3>
                  <p className="text-[11px] text-[#77738A] mt-1">Ongoing design & development</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#77738A]">Services Subscribed</span>
                    <ShieldCheck className="h-4 w-4 text-[#6C3BDB]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#1D1930] mt-1">
                    {clientDetail.services?.length || 0}
                  </h3>
                  <p className="text-[11px] text-[#77738A] mt-1">Active subscriptions & contracts</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#77738A]">Balance Outstanding</span>
                    <FileText className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-amber-600 mt-1">
                    {formatINRPrecise(clientDetail.metrics?.total_outstanding_rupees)}
                  </h3>
                  <p className="text-[11px] text-[#77738A] mt-1">Pending payment settlements</p>
                </CardContent>
              </Card>
            </div>

            {/* Active Projects */}
            <Card>
              <CardHeader className="p-4 border-b border-[#E9E5F0] flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#77738A]">
                  Your Project Workspaces
                </CardTitle>
                <Link href="/portal/projects">
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientDetail.projects?.map((p: any) => (
                  <div key={p.id} className="p-4 border border-[#E9E5F0] rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-[#77738A]">{p.code}</span>
                        <h4 className="text-sm font-bold text-[#1D1930]">{p.name}</h4>
                      </div>
                      <Badge variant="default">{p.status.replace("_", " ").toUpperCase()}</Badge>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs text-[#77738A] mb-1">
                        <span>Milestone Progress</span>
                        <span className="font-semibold text-[#1D1930]">{p.progress_percent}%</span>
                      </div>
                      <div className="w-full bg-[#F3F1F8] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#6C3BDB] h-1.5 rounded-full"
                          style={{ width: `${p.progress_percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Invoices */}
            <Card>
              <CardHeader className="p-4 border-b border-[#E9E5F0]">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#77738A]">
                  Recent Invoices
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E9E5F0] bg-[#F8F8FC] text-[#77738A] font-medium">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Total (INR)</th>
                      <th className="py-3 px-4 text-right">Balance Due</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9E5F0]">
                    {clientDetail.invoices?.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-[#F8F8FC]">
                        <td className="py-3 px-4 font-bold text-[#1D1930]">{inv.invoice_number}</td>
                        <td className="py-3 px-4 text-[#77738A]">{formatDate(inv.issue_date)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={inv.status === "paid" ? "success" : "warning"}>
                            {inv.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-[#1D1930]">
                          {formatINRPrecise(inv.total_rupees)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-amber-600">
                          {formatINRPrecise(inv.balance_rupees)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() =>
                              api.downloadPdf(
                                `/invoices/${inv.id}/pdf`,
                                `Invoice_${inv.invoice_number}.pdf`
                              )
                            }
                          >
                            <Download className="h-3 w-3 mr-1 text-[#6C3BDB]" /> PDF
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </>
  );
}
