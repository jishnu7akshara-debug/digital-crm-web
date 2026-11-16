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
  User,
  DollarSign,
  TrendingUp,
  FileText,
  FolderPlus,
  Receipt,
  FileSignature,
  ArrowRight,
  Send,
  Sparkles,
  Check,
  Percent,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { PageReady } from "@/components/page-ready";

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = (params.id as string) || "";

  // Fetch proposal details
  const { data: proposal, isLoading, error, refetch } = useQuery<any>({
    queryKey: ["proposal-detail", proposalId],
    queryFn: async () => {
      return await api.get<any>(`/proposals/${proposalId}`);
    },
  });

  const handleStatusUpdate = async (targetStatus: string) => {
    try {
      await api.post(`/proposals/${proposalId}/status?target_status=${targetStatus}`);
      toast.success(`Proposal marked as ${targetStatus}.`);
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update proposal status.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to archive this proposal?")) return;
    try {
      await api.delete(`/proposals/${proposalId}`);
      toast.success("Proposal archived.");
      router.push("/internal/opportunities");
    } catch (err: any) {
      toast.error(err?.message || "Failed to archive proposal.");
    }
  };

  if (isLoading) return <PageSkeleton />;
  if (error || !proposal) return <ErrorState message={(error as any)?.message || "Proposal not found"} onRetry={() => refetch()} />;

  const isAccepted = proposal.status === "accepted";
  const isSent = proposal.status === "sent";

  return (
    <div className="space-y-6 pb-12">
      <PageReady when={!isLoading && !!proposal} />
      {/* Back button */}
      <Link
        href="/internal/opportunities"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Proposals</span>
      </Link>

      {/* Top Profile Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              {proposal.proposal_number}
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                isAccepted
                  ? "bg-emerald-50 text-emerald-700"
                  : isSent
                  ? "bg-indigo-50 text-indigo-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {proposal.status}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">{proposal.title}</h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Client:{" "}
            <span className="font-semibold text-[#0F172A]">
              {proposal.client_name || proposal.lead_title || "General Client"}
            </span>
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {!isAccepted && (
            <>
              {!isSent && (
                <button
                  onClick={() => handleStatusUpdate("sent")}
                  className="h-10 px-4 bg-[#5B4BDB] hover:bg-[#4C3EBE] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
                >
                  <Send className="h-4 w-4" />
                  <span>Mark as Sent</span>
                </button>
              )}
              <button
                onClick={() => handleStatusUpdate("accepted")}
                className="h-10 px-4 bg-[#059669] hover:bg-[#047857] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Accept Proposal</span>
              </button>
            </>
          )}

          <button
            onClick={handleDelete}
            className="h-10 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors flex items-center space-x-1 text-xs font-medium"
            title="Archive proposal"
          >
            <Trash2 className="h-4 w-4" />
            <span>Archive</span>
          </button>
        </div>
      </div>

      {/* Commercial Line Items Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
        <h3 className="text-sm font-bold text-[#0F172A] pb-3 mb-4 border-b border-[#E5E7EB]">
          Scope of Work & Deliverables ({proposal.line_items?.length || 0})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F9FB] border-b border-[#E5E7EB] text-[#94A3B8] font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Deliverable Description</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Unit Price (₹)</th>
                <th className="py-2.5 px-3 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {proposal.line_items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-3 px-3 font-semibold text-[#0F172A]">{item.description}</td>
                  <td className="py-3 px-3 text-[#64748B]">{item.quantity}</td>
                  <td className="py-3 px-3 text-[#64748B]">
                    ₹{item.unit_price_rupees.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#0F172A]">
                    ₹{item.total_rupees.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex flex-col items-end space-y-2 text-xs">
          <div className="flex justify-between w-64">
            <span className="text-[#64748B]">Subtotal:</span>
            <span className="font-semibold text-[#0F172A]">
              ₹{proposal.subtotal_rupees.toLocaleString("en-IN")}
            </span>
          </div>
          {proposal.discount_rupees > 0 && (
            <div className="flex justify-between w-64 text-[#059669]">
              <span>Discount:</span>
              <span className="font-semibold">
                -₹{proposal.discount_rupees.toLocaleString("en-IN")}
              </span>
            </div>
          )}
          <div className="flex justify-between w-64">
            <span className="text-[#64748B]">GST (18%):</span>
            <span className="font-semibold text-[#0F172A]">
              ₹{proposal.tax_rupees.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between w-64 pt-2 border-t border-[#E5E7EB] text-sm">
            <span className="font-bold text-[#0F172A]">Total:</span>
            <span className="font-bold text-[#5B4BDB]">
              ₹{proposal.total_rupees.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Terms & Conditions Card */}
      {proposal.terms_and_conditions && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
          <h3 className="text-sm font-bold text-[#0F172A] mb-2">Terms & Commercial Notes</h3>
          <p className="text-xs text-[#64748B] bg-[#F8F9FA] p-3 rounded-xl leading-relaxed">
            {proposal.terms_and_conditions}
          </p>
        </div>
      )}
    </div>
  );
}
