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

const INVOICE_DATA: Record<string, any> = {
  "inv-1": {
    id: "inv-1",
    invoice_number: "DF-2026-0001",
    client_name: "Peak Fitness",
    client_id: "CLI-PEAK-001",
    client_address: "12th Main, Indiranagar, Bengaluru, Karnataka - 560038",
    client_gstin: "29AABCP1234D1Z2",
    issue_date: "Oct 05, 2026",
    due_date: "Oct 25, 2026",
    status: "paid",
    subtotal_rupees: 76271.19,
    tax_rupees: 13728.81,
    total_rupees: 90000,
    amount_paid_rupees: 90000,
    balance_rupees: 0,
    line_items: [
      {
        id: "li-1",
        description: "Custom Website Redesign & Mobile Optimization (Milestone 1)",
        hsn_sac_code: "998314",
        quantity: 1,
        unit_price_rupees: 76271.19,
        tax_rate_percent: 18,
        tax_rupees: 13728.81,
        total_rupees: 90000,
      },
    ],
    payments: [
      {
        id: "pay-1",
        amount_rupees: 90000,
        payment_method: "bank_transfer",
        transaction_reference: "HDFC98472918471",
        payment_date: "Oct 24, 2026",
        notes: "Full payment received via NEFT",
      },
    ],
  },
  "inv-2": {
    id: "inv-2",
    invoice_number: "DF-2026-0002",
    client_name: "Peak Fitness",
    client_id: "CLI-PEAK-001",
    client_address: "12th Main, Indiranagar, Bengaluru, Karnataka - 560038",
    client_gstin: "29AABCP1234D1Z2",
    issue_date: "Nov 01, 2026",
    due_date: "Nov 20, 2026",
    status: "due",
    subtotal_rupees: 59322.03,
    tax_rupees: 10677.97,
    total_rupees: 70000,
    amount_paid_rupees: 0,
    balance_rupees: 70000,
    line_items: [
      {
        id: "li-2",
        description: "Monthly Digital Marketing & SEO Growth Retainer (Nov 2026)",
        hsn_sac_code: "998314",
        quantity: 1,
        unit_price_rupees: 59322.03,
        tax_rate_percent: 18,
        tax_rupees: 10677.97,
        total_rupees: 70000,
      },
    ],
    payments: [],
  },
  "inv-3": {
    id: "inv-3",
    invoice_number: "DF-2026-0003",
    client_name: "Akshara Enterprises",
    client_id: "CLI-AKSH-001",
    client_address: "Jubilee Hills, Hyderabad, Telangana - 500033",
    client_gstin: "36AAGCA5678B1Z9",
    issue_date: "Oct 22, 2026",
    due_date: "Nov 15, 2026",
    status: "due",
    subtotal_rupees: 101694.92,
    tax_rupees: 18305.08,
    total_rupees: 120000,
    amount_paid_rupees: 0,
    balance_rupees: 120000,
    line_items: [
      {
        id: "li-3",
        description: "Custom Internal CRM Platform & Lead Routing Architecture",
        hsn_sac_code: "998314",
        quantity: 1,
        unit_price_rupees: 101694.92,
        tax_rate_percent: 18,
        tax_rupees: 18305.08,
        total_rupees: 120000,
      },
    ],
    payments: [],
  },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = (params.id as string) || "inv-2";

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("bank_transfer");
  const [payRef, setPayRef] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch invoice from FastAPI
  const { data: apiData, refetch } = useQuery<any>({
    queryKey: ["invoice-detail", invoiceId],
    queryFn: async () => {
      try {
        const res = await api.get<any>(`/invoices/${invoiceId}`);
        return res;
      } catch (e) {
        return null;
      }
    },
  });

  const fallback = INVOICE_DATA[invoiceId] || {
    id: invoiceId,
    invoice_number: invoiceId.startsWith("DF-") ? invoiceId : `DF-2026-0099`,
    client_name: "Commercial Client Account",
    client_id: "CLI-PEAK-001",
    client_address: "Koramangala, Bengaluru, Karnataka",
    client_gstin: "29AABCU9999Z1Z5",
    issue_date: "Nov 01, 2026",
    due_date: "Nov 20, 2026",
    status: "due",
    subtotal_rupees: 59322.03,
    tax_rupees: 10677.97,
    total_rupees: 70000,
    amount_paid_rupees: 0,
    balance_rupees: 70000,
    line_items: [
      {
        id: "li-1",
        description: "Digital Footprint Technology & Design Services",
        hsn_sac_code: "998314",
        quantity: 1,
        unit_price_rupees: 59322.03,
        tax_rate_percent: 18,
        tax_rupees: 10677.97,
        total_rupees: 70000,
      },
    ],
    payments: [],
  };

  const invoice = apiData || fallback;
  const isPaid = invoice.status === "paid" || invoice.balance_rupees === 0;

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(payAmount || invoice.balance_rupees);

    try {
      await api.post(`/invoices/${invoice.id}/payments`, {
        amount_paise: Math.round(amountVal * 100),
        payment_method: payMethod,
        transaction_reference: payRef.trim() || `TXN-${Date.now()}`,
        payment_date: new Date().toISOString().split("T")[0],
      });
      refetch();
    } catch (e) {}

    setIsRecordModalOpen(false);
    setNotification(`Payment of ₹${amountVal.toLocaleString("en-IN")} recorded successfully.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDownloadPdf = () => {
    window.open(`/api/v1/invoices/${invoice.id}/pdf`, "_blank");
  };

  return (
    <div className="space-y-6 pb-12">
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
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 mb-1">
              <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                TAX INVOICE
              </span>
              <span className="text-[11px] text-[#94A3B8]">·</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isPaid ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#FFFBEB] text-[#D97706]"
                }`}
              >
                {isPaid ? "Paid in Full" : `Due by ${invoice.due_date}`}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              {invoice.invoice_number}
            </h1>
            <p className="text-[14px] text-[#64748B] mt-0.5 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#94A3B8]" />
              <Link
                href={`/internal/clients/${invoice.client_id || "CLI-PEAK-001"}`}
                className="font-semibold text-[#5B4BDB] hover:underline"
              >
                {invoice.client_name}
              </Link>
              <span>·</span>
              <span>Issued: {invoice.issue_date}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={handleDownloadPdf}
              className="h-10 px-4 bg-white hover:bg-[#F8F9FB] border border-[#CBD5E1] text-[#0F172A] text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
            >
              <Download className="h-4 w-4 text-[#5B4BDB]" />
              <span>Download PDF</span>
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
      </div>

      {/* Main Printable Tax Invoice Sheet */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 md:p-12 shadow-card max-w-4xl mx-auto space-y-8">
        {/* Header: Agency Info & Invoice Metadata */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-[#E5E7EB]">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="h-9 w-9 rounded-xl bg-[#0F172A] text-white flex items-center justify-center font-black text-lg">
                DF
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0F172A] leading-tight">Digital Footprint OS</h2>
                <span className="text-xs text-[#64748B]">Digital Transformation & Technology Agency</span>
              </div>
            </div>
            <div className="text-xs text-[#64748B] space-y-0.5 mt-2">
              <p>HSR Layout, Sector 4, Bengaluru, Karnataka - 560102</p>
              <p>GSTIN: <span className="font-semibold text-[#0F172A]">29AAAAA0000A1Z5</span> · PAN: <span className="font-semibold text-[#0F172A]">AAAAA0000A</span></p>
              <p>Email: finance@digitalfootprint.in · State Code: 29 (Karnataka)</p>
            </div>
          </div>

          <div className="sm:text-right text-xs space-y-1">
            <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
              TAX INVOICE DETAILS
            </span>
            <div className="text-lg font-bold text-[#0F172A]">{invoice.invoice_number}</div>
            <p className="text-[#64748B]">Issue Date: <span className="font-semibold text-[#0F172A]">{invoice.issue_date}</span></p>
            <p className="text-[#64748B]">Due Date: <span className="font-semibold text-[#0F172A]">{invoice.due_date}</span></p>
            <p className="text-[#64748B]">Place of Supply: <span className="font-semibold text-[#0F172A]">Karnataka (29)</span></p>
          </div>
        </div>

        {/* Bill To & Ship To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs pb-6 border-b border-[#E5E7EB]">
          <div>
            <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-1">
              BILLED TO:
            </span>
            <div className="text-sm font-bold text-[#0F172A] mb-1">{invoice.client_name}</div>
            <p className="text-[#64748B] leading-relaxed">{invoice.client_address || "Registered Corporate Office"}</p>
            <p className="text-[#64748B] mt-1">
              GSTIN: <span className="font-semibold text-[#0F172A]">{invoice.client_gstin || "29AABCU9999Z1Z5"}</span>
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block mb-1">
              PAYMENT STATUS
            </span>
            <div className="text-sm font-bold text-[#0F172A] mb-1">
              {isPaid ? "Paid in Full" : `Outstanding Balance: ₹${invoice.balance_rupees.toLocaleString("en-IN")}`}
            </div>
            <p className="text-[#64748B]">Currency: Indian Rupee (INR)</p>
            <p className="text-[#64748B]">GST Regime: Intra-State (CGST 9% + SGST 9%)</p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-[#0F172A] text-[#0F172A] font-bold uppercase text-[11px]">
                <th className="py-2.5 pr-4">Description</th>
                <th className="py-2.5 px-3">SAC</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Rate</th>
                <th className="py-2.5 px-3 text-right">Taxable</th>
                <th className="py-2.5 pl-3 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[#0F172A]">
              {(invoice.line_items || []).map((li: any) => (
                <tr key={li.id}>
                  <td className="py-3.5 pr-4 font-semibold">{li.description}</td>
                  <td className="py-3.5 px-3 text-[#64748B]">{li.hsn_sac_code || "998314"}</td>
                  <td className="py-3.5 px-3 text-center">{li.quantity || 1}</td>
                  <td className="py-3.5 px-3 text-right font-medium">
                    ₹{li.unit_price_rupees.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-3 text-right font-medium">
                    ₹{li.unit_price_rupees.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 pl-3 text-right font-bold">
                    ₹{li.total_rupees.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Tax Calculation Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-[#E5E7EB] text-xs">
          <div className="space-y-2 max-w-sm">
            <span className="font-bold text-[#0F172A] block">Bank Remittance Details:</span>
            <div className="bg-[#F8F9FD] p-3 rounded-xl border border-[#E5E7EB] space-y-1 text-[#64748B]">
              <p>Bank: <span className="font-semibold text-[#0F172A]">HDFC Bank Ltd</span></p>
              <p>Account Name: <span className="font-semibold text-[#0F172A]">Digital Footprint Technologies</span></p>
              <p>Account Number: <span className="font-semibold text-[#0F172A]">50200084920194</span></p>
              <p>IFSC: <span className="font-semibold text-[#0F172A]">HDFC0001234</span> · Branch: HSR Layout</p>
            </div>
          </div>

          <div className="w-full sm:w-64 space-y-2 text-[#64748B]">
            <div className="flex justify-between py-1">
              <span>Taxable Subtotal:</span>
              <span className="font-semibold text-[#0F172A]">
                ₹{invoice.subtotal_rupees.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>CGST (9.0%):</span>
              <span className="font-semibold text-[#0F172A]">
                ₹{((invoice.tax_rupees || 0) / 2).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>SGST (9.0%):</span>
              <span className="font-semibold text-[#0F172A]">
                ₹{((invoice.tax_rupees || 0) / 2).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-[#0F172A] text-sm font-bold text-[#0F172A]">
              <span>Grand Total:</span>
              <span>₹{invoice.total_rupees.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between py-1 text-xs text-[#059669] font-semibold">
              <span>Amount Paid:</span>
              <span>₹{invoice.amount_paid_rupees.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between py-1 text-xs text-red-600 font-bold border-t border-[#E5E7EB]">
              <span>Balance Due:</span>
              <span>₹{invoice.balance_rupees.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes & Authorized Signatory */}
        <div className="pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row justify-between items-end gap-6 text-[11px] text-[#94A3B8]">
          <div>
            <p className="font-semibold text-[#0F172A]">Terms & Conditions:</p>
            <p>1. Payment is due within 15 days of invoice date via direct bank transfer or UPI.</p>
            <p>2. Please quote invoice number {invoice.invoice_number} in bank transfer remarks.</p>
          </div>
          <div className="text-center sm:text-right">
            <div className="font-serif italic font-bold text-sm text-[#0F172A] mb-1">Sai Varshith</div>
            <p className="font-semibold text-[#0F172A]">Authorized Signatory</p>
            <p>Digital Footprint OS</p>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">Record Payment</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Update payment ledger for {invoice.invoice_number}
                </p>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Amount Received (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  defaultValue={invoice.balance_rupees}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full h-10 px-3.5 bg-[#F8F9FB] border border-[#CBD5E1] rounded-xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#5B4BDB]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full h-10 px-3 bg-[#F8F9FB] border border-[#CBD5E1] rounded-xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#5B4BDB]"
                >
                  <option value="bank_transfer">Bank Transfer / NEFT / RTGS</option>
                  <option value="upi">UPI / QR Code</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Transaction / UTR Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC987291827"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full h-10 px-3.5 bg-[#F8F9FB] border border-[#CBD5E1] rounded-xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#5B4BDB]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 border border-[#CBD5E1] hover:bg-[#F8F9FB] text-[#64748B] font-semibold text-[13px] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5B4BDB] hover:bg-[#4C3DC7] text-white font-semibold text-[13px] rounded-xl shadow-soft"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
