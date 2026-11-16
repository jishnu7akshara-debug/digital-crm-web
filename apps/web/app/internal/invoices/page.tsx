"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, FileText, Download, Receipt, Building2, ExternalLink, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { PageReady } from "@/components/page-ready";

export default function InvoicesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: apiInvoices,
    isLoading,
    error,
    refetch,
  } = useQuery<any>({
    queryKey: ["invoices-list"],
    queryFn: async () => {
      const res = await api.get<any>("/invoices?page_size=100");
      return res?.items || [];
    },
  });

  const invoices = (apiInvoices || []).map((inv: any) => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    client_id: inv.client_id,
    client_name: inv.client_name || "Client Account",
    issue_date: inv.issue_date,
    due_date: inv.due_date,
    status: inv.status === "paid" ? "Paid" : `Due ${inv.due_date}`,
    total_rupees: inv.total_rupees || 0,
    balance_rupees: inv.balance_rupees || 0,
    isPaid: inv.status === "paid" || inv.balance_rupees === 0,
  }));

  const filtered = invoices.filter(
    (inv: any) =>
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message={(error as any)?.message || "Failed to load invoices."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageReady
        when={!isLoading}
        state={error ? "error" : invoices.length === 0 ? "empty" : "success"}
        dataLength={invoices.length}
      />

      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              FINANCE & BILLING
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              {invoices.length} Invoices Issued
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
            GST Tax Invoices & Collections
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Compliant Indian GST invoices with automated 9% CGST / 9% SGST math, ledger tracking, and payment receipts.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            href="/internal/invoices/new"
            className="h-10 px-4 bg-[#5B4BDB] hover:bg-[#4C3DC7] text-white text-[13px] font-semibold rounded-xl transition-all shadow-sm flex items-center space-x-1.5 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Generate Invoice</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search invoices or clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 bg-[#F8F9FB] border border-[#E5E7EB] rounded-xl pl-10 pr-4 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 transition-all"
          />
        </div>

        <div className="text-[13px] text-[#64748B]">
          {filtered.length} invoices · Sorted by issue date
        </div>
      </div>

      {/* Invoices Table */}
      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices found"
          description="Create your first GST invoice to bill clients and track payments."
          actionLabel="Generate Invoice"
          onAction={() => router.push("/internal/invoices/new")}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13.5px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8F9FB] text-[11px] text-[#94A3B8] uppercase font-bold tracking-wider">
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Invoice Number</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Client Account</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Issue Date</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Due Date</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Total (₹)</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Balance Due (₹)</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Status</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filtered.map((inv: any) => (
                  <tr
                    key={inv.id}
                    onClick={() => router.push(`/internal/invoices/${inv.invoice_number}`)}
                    className="hover:bg-[#F8F9FD] transition-colors group cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-[#5B4BDB]">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0F172A]">{inv.client_name}</td>
                    <td className="py-3.5 px-4 text-[#64748B]">{inv.issue_date}</td>
                    <td className="py-3.5 px-4 text-[#64748B]">{inv.due_date}</td>
                    <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                      ₹{Number(inv.total_rupees).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-[#0F172A]">
                      {inv.balance_rupees > 0 ? (
                        <span className="font-semibold text-[#E11D48]">
                          ₹{Number(inv.balance_rupees).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-[#059669] font-semibold text-xs">Settled</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          inv.isPaid
                            ? "bg-[#ECFDF5] text-[#059669]"
                            : "bg-[#FFF1F2] text-[#E11D48]"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/internal/invoices/${inv.invoice_number}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#F0EDFD] hover:bg-[#5B4BDB] text-[#5B4BDB] hover:text-white text-xs font-semibold transition-all shadow-xs"
                      >
                        <span>View Invoice</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
