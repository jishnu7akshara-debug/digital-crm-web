"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Receipt,
  Printer,
  Send,
  CreditCard,
  Check,
  FileText,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { PageReady } from "@/components/page-ready";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = (params?.id as string) || "";

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("bank_transfer");
  const [payRef, setPayRef] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch invoice from FastAPI
  const {
    data: invoice,
    isLoading,
    error,
    refetch,
  } = useQuery<any>({
    queryKey: ["invoice-detail", invoiceId],
    queryFn: async () => {
      return await api.get<any>(`/invoices/${invoiceId}`);
    },
    enabled: !!invoiceId,
  });

  const isPaid = invoice && (invoice.status === "paid" || invoice.balance_rupees === 0);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    const amountVal = Number(payAmount || invoice.balance_rupees);

    try {
      await api.post(`/invoices/${invoice.id}/payments`, {
        amount_paise: Math.round(amountVal * 100),
        payment_method: payMethod,
        transaction_reference: payRef.trim() || `TXN-${Date.now()}`,
        payment_date: new Date().toISOString().split("T")[0],
      });
      await refetch();
      setIsRecordModalOpen(false);
      setNotification(`Payment of ₹${amountVal.toLocaleString("en-IN")} recorded successfully.`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification(err?.message || "Failed to record payment.");
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error || !invoice) {
    return (
      <ErrorState
        message={(error as any)?.message || "Invoice not found."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageReady when={!isLoading && !!invoice} />

      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs text-[#64748B]">
        <Link
          href="/internal/invoices"
          className="hover:text-[#5B4BDB] font-medium flex items-center space-x-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Invoices Directory</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#0F172A]">{invoice.invoice_number}</span>
      </div>

      {notification && (
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] p-3.5 rounded-xl text-xs text-[#065F46] font-semibold flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-[#059669]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              TAX INVOICE
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isPaid
                  ? "bg-[#ECFDF5] text-[#059669]"
                  : "bg-[#FFF1F2] text-[#E11D48]"
              }`}
            >
              {isPaid ? "Paid & Settled" : `Due on ${invoice.due_date}`}
            </span>
            {invoice.gst_type && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase">
                {invoice.gst_type}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            {invoice.invoice_number}
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#94A3B8]" />
            <Link
              href={`/internal/clients/${invoice.client_id}`}
              className="font-semibold text-[#5B4BDB] hover:underline"
            >
              {invoice.client_name}
            </Link>
            <span>·</span>
            <span>Issued on {invoice.issue_date}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleDownloadPdf}
            className="h-10 px-4 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FB] text-[#0F172A] text-[13px] font-medium rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
          >
            <Printer className="h-4 w-4 text-[#64748B]" />
            <span>Print / PDF</span>
          </button>

          {!isPaid && (
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="h-10 px-4 bg-[#5B4BDB] hover:bg-[#4C3DC7] text-white text-[13px] font-semibold rounded-xl transition-all shadow-sm flex items-center space-x-1.5 active:scale-95"
            >
              <CreditCard className="h-4 w-4" />
              <span>Record Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* Invoice Sheet */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 md:p-12 shadow-card max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-start border-b border-[#E5E7EB] pb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A]">TAX INVOICE</h2>
            <p className="text-xs text-[#64748B] font-mono mt-1">{invoice.invoice_number}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-[#0F172A]">Digital Footprint Technologies</p>
            <p className="text-xs text-[#64748B]">HSR Layout, Sector 4, Bengaluru - 560102</p>
            <p className="text-xs text-[#64748B]">GSTIN: 29AAAAA0000A1Z5</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-xs text-[#475569]">
          <div>
            <span className="font-bold text-[#94A3B8] uppercase block mb-1">Billed To</span>
            <p className="font-bold text-[#0F172A] text-sm">{invoice.client_name}</p>
            <p>{invoice.client_address || "Bengaluru, Karnataka"}</p>
            <p>GSTIN: {invoice.client_gstin || "Unregistered"}</p>
          </div>
          <div className="text-right">
            <p><span className="text-[#94A3B8]">Issue Date:</span> <span className="font-semibold text-[#0F172A]">{invoice.issue_date}</span></p>
            <p><span className="text-[#94A3B8]">Due Date:</span> <span className="font-semibold text-[#0F172A]">{invoice.due_date}</span></p>
            <p><span className="text-[#94A3B8]">Status:</span> <span className="font-semibold uppercase">{invoice.status}</span></p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#94A3B8] uppercase">
                <th className="py-2.5 font-semibold">Description</th>
                <th className="py-2.5 font-semibold">HSN/SAC</th>
                <th className="py-2.5 font-semibold text-right">Qty</th>
                <th className="py-2.5 font-semibold text-right">Rate (₹)</th>
                <th className="py-2.5 font-semibold text-right">Tax (₹)</th>
                <th className="py-2.5 font-semibold text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {(invoice.line_items || []).map((item: any) => (
                <tr key={item.id}>
                  <td className="py-3 font-medium text-[#0F172A]">{item.description}</td>
                  <td className="py-3 text-[#64748B] font-mono">{item.hsn_sac_code || "998314"}</td>
                  <td className="py-3 text-right">{item.quantity}</td>
                  <td className="py-3 text-right">₹{Number(item.unit_price_rupees).toFixed(2)}</td>
                  <td className="py-3 text-right">₹{Number(item.tax_rupees).toFixed(2)} ({item.tax_rate_percent}%)</td>
                  <td className="py-3 text-right font-semibold text-[#0F172A]">₹{Number(item.total_rupees).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end pt-4 border-t border-[#E5E7EB]">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between text-[#64748B]">
              <span>Taxable Subtotal:</span>
              <span className="font-semibold text-[#0F172A]">₹{Number(invoice.subtotal_rupees).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>GST Tax Amount:</span>
              <span className="font-semibold text-[#0F172A]">₹{Number(invoice.tax_rupees).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#0F172A] pt-2 border-t border-[#E5E7EB]">
              <span>Total Invoice Amount:</span>
              <span>₹{Number(invoice.total_rupees).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#059669]">
              <span>Amount Paid:</span>
              <span className="font-semibold">₹{Number(invoice.amount_paid_rupees || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#E11D48] pt-1">
              <span>Balance Due:</span>
              <span>₹{Number(invoice.balance_rupees || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
