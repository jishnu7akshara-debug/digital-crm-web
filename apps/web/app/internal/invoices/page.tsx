"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  Download,
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { formatINRPrecise, formatDate } from "@/lib/utils";

interface InvoiceSummaryItem {
  id: string;
  invoice_number: string;
  client_id: string;
  client_name: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal_rupees: number;
  tax_rupees: number;
  total_rupees: number;
  amount_paid_rupees: number;
  balance_rupees: number;
  gst_type: string;
}

interface PaginatedInvoices {
  items: InvoiceSummaryItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Record Payment Modal State
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceSummaryItem | null>(null);
  const [paymentAmountRupees, setPaymentAmountRupees] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentRef, setPaymentRef] = useState("");

  const { data, isLoading } = useQuery<PaginatedInvoices>({
    queryKey: ["invoices-list", statusFilter],
    queryFn: () => api.get<PaginatedInvoices>(`/invoices?status_filter=${statusFilter}`),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!paymentInvoice) return;
      return api.post(`/invoices/${paymentInvoice.id}/payments`, {
        amount_paise: Math.round(paymentAmountRupees * 100),
        payment_method: paymentMethod,
        transaction_reference: paymentRef || undefined,
        payment_date: new Date().toISOString().split("T")[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
      setPaymentInvoice(null);
      setPaymentAmountRupees(0);
      setPaymentRef("");
    },
    onError: (err: any) => alert(err.message || "Failed to record payment."),
  });

  return (
    <>
      <Header
        title="Finance & Invoices"
        subtitle="Indian GST tax invoices (CGST/SGST/IGST), integer paise math, and payment allocations"
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <select
              className="text-xs rounded-md border border-[#E9E5F0] p-2 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader className="p-4 border-b border-[#E9E5F0]">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#77738A]">
              Issued GST Invoices ({data?.total || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E9E5F0] bg-[#F8F8FC] text-[#77738A] font-medium">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">GST Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total (INR)</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E5F0]">
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#77738A]">
                      Loading invoices...
                    </td>
                  </tr>
                )}
                {data?.items.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F8F8FC]">
                    <td className="py-3 px-4 font-bold text-[#1D1930]">{inv.invoice_number}</td>
                    <td className="py-3 px-4 font-medium text-[#1D1930]">{inv.client_name}</td>
                    <td className="py-3 px-4 text-[#77738A]">
                      <div>Issue: {formatDate(inv.issue_date)}</div>
                      <div className="text-[10px]">Due: {formatDate(inv.due_date)}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-[#77738A]">
                      {inv.gst_type.toUpperCase()}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={inv.status === "paid" ? "success" : "warning"}>
                        {inv.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-[#1D1930]">
                      {formatINRPrecise(inv.total_rupees)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-600">
                      {formatINRPrecise(inv.balance_rupees)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() =>
                          api.downloadPdf(
                            `/invoices/${inv.id}/pdf`,
                            `Tax_Invoice_${inv.invoice_number}.pdf`
                          )
                        }
                      >
                        <Download className="h-3 w-3 mr-1 text-[#6C3BDB]" /> PDF
                      </Button>

                      {inv.balance_rupees > 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs"
                          onClick={() => {
                            setPaymentInvoice(inv);
                            setPaymentAmountRupees(inv.balance_rupees);
                          }}
                        >
                          <CreditCard className="h-3 w-3 mr-1" /> Pay
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Record Payment Modal */}
        <Modal
          isOpen={!!paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          title={`Record Payment for ${paymentInvoice?.invoice_number}`}
          description={`Outstanding balance: ${formatINRPrecise(paymentInvoice?.balance_rupees)}`}
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">Amount to Pay (INR) *</label>
              <Input
                type="number"
                value={paymentAmountRupees || ""}
                onChange={(e) => setPaymentAmountRupees(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">Payment Method</label>
              <select
                className="w-full text-xs rounded-md border border-[#E9E5F0] p-2 bg-white"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="bank_transfer">Bank Wire / NEFT / RTGS</option>
                <option value="upi">UPI</option>
                <option value="card">Credit / Debit Card</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">Transaction Ref / UTR #</label>
              <Input
                placeholder="e.g. UTR20261105998811"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setPaymentInvoice(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => recordPaymentMutation.mutate()}
                isLoading={recordPaymentMutation.isPending}
                disabled={paymentAmountRupees <= 0 || Boolean(paymentInvoice && paymentAmountRupees > paymentInvoice.balance_rupees)}
              >
                Confirm Payment
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </>
  );
}
