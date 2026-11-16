"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  User,
  ArrowRight,
  CheckCircle2,
  X,
  Clock,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { PageReady } from "@/components/page-ready";

interface ProposalItem {
  id: string;
  proposal_number: string;
  client_id: string | null;
  client_name: string | null;
  lead_id: string | null;
  lead_title: string | null;
  title: string;
  version: number;
  status: string;
  subtotal_rupees: number;
  discount_rupees: number;
  tax_rupees: number;
  total_rupees: number;
  valid_until: string | null;
  accepted_at: string | null;
  created_at: string;
}

export default function OpportunitiesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New proposal form
  const [newTitle, setNewTitle] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [discountRupees, setDiscountRupees] = useState("0");
  const [terms, setTerms] = useState("50% advance, 50% on deliverable sign-off.");

  // Fetch proposals
  const { data: propData, isLoading, error, refetch } = useQuery<any>({
    queryKey: ["proposals-list", statusFilter],
    queryFn: async () => {
      const q = statusFilter !== "all" ? `&status_filter=${statusFilter}` : "";
      return await api.get<any>(`/proposals?page_size=100${q}`);
    },
  });

  // Fetch clients for dropdown
  const { data: clientsData } = useQuery<any>({
    queryKey: ["clients-dropdown"],
    queryFn: async () => {
      return await api.get<any>("/clients?page_size=100");
    },
  });

  const proposals: ProposalItem[] = propData?.items || [];
  const clients = clientsData?.items || [];

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newClientId || !itemDescription.trim() || !itemPrice) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const unitPaise = Math.round((parseFloat(itemPrice) || 0) * 100);
      const discPaise = Math.round((parseFloat(discountRupees) || 0) * 100);

      await api.post("/proposals", {
        title: newTitle.trim(),
        client_id: newClientId,
        line_items: [
          {
            description: itemDescription.trim(),
            quantity: parseInt(itemQty, 10) || 1,
            unit_price_paise: unitPaise,
          },
        ],
        discount_paise: discPaise,
        tax_rate_percent: 18.0,
        terms_and_conditions: terms.trim() || null,
      });

      toast.success("Proposal created successfully.");
      setShowModal(false);
      setNewTitle("");
      setItemDescription("");
      setItemPrice("");
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create proposal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProposal = async (p: ProposalItem) => {
    if (!confirm(`Are you sure you want to archive "${p.title}"?`)) return;

    try {
      await api.delete(`/proposals/${p.id}`);
      toast.success("Proposal archived.");
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to archive proposal.");
    }
  };

  const filteredProposals = proposals.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.title.toLowerCase().includes(term) ||
      (p.client_name && p.client_name.toLowerCase().includes(term)) ||
      p.proposal_number.toLowerCase().includes(term)
    );
  });

  const totalPipelineRupees = proposals.reduce((acc, p) => acc + p.total_rupees, 0);

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState message={(error as any)?.message || "Failed to load proposals"} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 pb-12">
      <PageReady
        when={!isLoading}
        state={error ? "error" : filteredProposals.length === 0 ? "empty" : "success"}
        dataLength={filteredProposals.length}
      />
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              COMMERCIAL SALES PIPELINE
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              ₹{totalPipelineRupees.toLocaleString("en-IN")} Total Pipeline
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Proposals & Opportunities</h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Create, track, and close commercial proposals with line items and GST calculations.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Create Proposal</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#E5E7EB] shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search proposals by title, client, or number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8F9FB] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#5B4BDB]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F8F9FB] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#5B4BDB]"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table of Proposals */}
      {filteredProposals.length === 0 ? (
        <EmptyState
          title="No Proposals Found"
          description={searchTerm ? "No proposals matched your search filter." : "Create your first commercial client quotation."}
          actionLabel="Create Proposal"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead className="bg-[#F8F9FB] border-b border-[#E5E7EB] text-[#94A3B8] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Proposal Number</th>
                  <th className="py-3 px-4">Title / Scope</th>
                  <th className="py-3 px-4">Client / Account</th>
                  <th className="py-3 px-4">Total Amount (Incl. GST)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[#0F172A]">
                {filteredProposals.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/internal/opportunities/${p.id}`)}
                    className="hover:bg-[#F8F9FD] transition-colors group cursor-pointer"
                  >
                    <td className="py-3 px-4 font-semibold text-[#5B4BDB] text-xs">
                      {p.proposal_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0F172A] group-hover:text-[#5B4BDB]">
                      <div className="flex items-center space-x-1.5">
                        <span>{p.title}</span>
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#64748B]">
                      {p.client_name || p.lead_title || "General"}
                    </td>
                    <td className="py-3 px-4 font-bold text-xs">
                      ₹{p.total_rupees.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                          p.status === "accepted"
                            ? "bg-emerald-50 text-emerald-700"
                            : p.status === "sent"
                            ? "bg-indigo-50 text-indigo-700"
                            : p.status === "rejected"
                            ? "bg-red-50 text-red-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#64748B]">
                      {new Date(p.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDeleteProposal(p)}
                        className="p-1.5 hover:bg-red-50 text-[#94A3B8] hover:text-red-600 rounded-lg transition-colors"
                        title="Archive proposal"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Proposal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
              <h2 className="text-base font-bold text-[#0F172A]">Create Commercial Proposal</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Proposal Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Next.js Web Application & SEO Package"
                  className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#5B4BDB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Select Client *
                </label>
                <select
                  required
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#5B4BDB]"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] space-y-3">
                <span className="text-xs font-bold text-[#0F172A] block">Primary Line Item</span>
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                    Deliverable Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="e.g. Full-Stack Web App, Next.js 15, PostgreSQL"
                    className="w-full px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                      Unit Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      placeholder="80000"
                      className="w-full px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discountRupees}
                    onChange={(e) => setDiscountRupees(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#5B4BDB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    GST Tax Rate
                  </label>
                  <input
                    type="text"
                    disabled
                    value="18% (Standard Services)"
                    className="w-full px-3.5 py-2 bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl text-sm text-[#64748B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#5B4BDB]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#5B4BDB] hover:bg-[#4C3EBE] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-soft"
                >
                  {isSubmitting ? "Creating..." : "Save Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
