"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatINRPrecise, formatDate } from "@/lib/utils";

export default function PortalInvoicesPage() {
  const { data: invoices, isLoading } = useQuery<any>({
    queryKey: ["portal-invoices"],
    queryFn: () => api.get<any>("/invoices?page_size=50"),
  });

  return (
    <>
      <Header
        title="Billing & Tax Invoices"
        subtitle="GST compliant tax invoices, payment histories, and official receipts"
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <Card>
          <CardHeader className="p-4 border-b border-[#E9E5F0]">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#77738A]">
              Tax Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E9E5F0] bg-[#F8F8FC] text-[#77738A] font-medium">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total (INR)</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E5F0]">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#77738A]">
                      Loading invoices...
                    </td>
                  </tr>
                )}
                {invoices?.items?.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-[#F8F8FC]">
                    <td className="py-3 px-4 font-bold text-[#1D1930]">{inv.invoice_number}</td>
                    <td className="py-3 px-4 text-[#77738A]">{formatDate(inv.issue_date)}</td>
                    <td className="py-3 px-4 text-[#77738A]">{formatDate(inv.due_date)}</td>
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
      </main>
    </>
  );
}
