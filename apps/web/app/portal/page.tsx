"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ArrowRight,
  ShieldCheck,
  X,
  FileCheck2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatINRPrecise } from "@/lib/utils";
import { toast } from "sonner";
import { PageSkeleton } from "@/components/ui/states";
import { PageReady } from "@/components/page-ready";

interface DeliverableItem {
  id: string;
  project_id: string;
  project_name: string;
  client_name: string;
  title: string;
  description: string | null;
  file_url: string;
  version: number;
  status: string;
  client_feedback: string | null;
  approved_at: string | null;
  created_at: string;
}

interface ProjectSummary {
  id: string;
  name: string;
  code: string;
  status: string;
  progress_percent: number;
}

interface InvoiceSummary {
  id: string;
  invoice_number: string;
  status: string;
  total_rupees: number;
  balance_rupees: number;
  due_date: string;
}

export default function ClientPortalDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeDeliverable, setActiveDeliverable] = useState<DeliverableItem | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch pending deliverables needing client review
  const {
    data: pendingDeliverables = [],
    isLoading: isDeliverablesLoading,
  } = useQuery<DeliverableItem[]>({
    queryKey: ["portal-pending-deliverables"],
    queryFn: async () => {
      try {
        const res = await api.get<DeliverableItem[]>("/projects/deliverables/pending");
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
  });

  // 2. Fetch active projects
  const { data: projectsData, isLoading: isProjectsLoading } = useQuery<{
    items: ProjectSummary[];
    total: number;
  }>({
    queryKey: ["portal-active-projects"],
    queryFn: async () => {
      return await api.get<{ items: ProjectSummary[]; total: number }>(
        "/projects?page_size=6"
      );
    },
  });

  // 3. Fetch tax invoices
  const { data: invoicesData, isLoading: isInvoicesLoading } = useQuery<{
    items: InvoiceSummary[];
    total: number;
  }>({
    queryKey: ["portal-recent-invoices"],
    queryFn: async () => {
      return await api.get<{ items: InvoiceSummary[]; total: number }>(
        "/invoices?page_size=4"
      );
    },
  });

  // Approve action
  const handleApprove = async (deliverableId: string) => {
    try {
      await api.post(`/projects/deliverables/${deliverableId}/review`, {
        status: "approved",
      });
      toast.success("Deliverable approved! The project team has been notified to proceed.");
      queryClient.invalidateQueries({ queryKey: ["portal-pending-deliverables"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve deliverable.");
    }
  };

  // Revision request action
  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeliverable || !feedbackText.trim()) return;

    try {
      setIsSubmitting(true);
      await api.post(`/projects/deliverables/${activeDeliverable.id}/review`, {
        status: "revision_requested",
        feedback: feedbackText.trim(),
      });
      toast.success("Changes requested. Your feedback has been sent to the design team.");
      setIsFeedbackModalOpen(false);
      setActiveDeliverable(null);
      setFeedbackText("");
      queryClient.invalidateQueries({ queryKey: ["portal-pending-deliverables"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit revision request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactName = user?.full_name || "Valued Partner";
  const projects = projectsData?.items || [];
  const invoices = invoicesData?.items || [];

  if (isDeliverablesLoading && isProjectsLoading && isInvoicesLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 select-none">
      <PageReady when={!isDeliverablesLoading && !isProjectsLoading && !isInvoicesLoading} />
      {/* SaaS Welcome Banner */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              CLIENT PORTAL
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              Live Workspaces
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Welcome back, {contactName} 👋
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Track contracted milestones, deliverable approvals, and GST tax invoices in real time.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            href="/portal/agreements"
            className="h-10 px-4 bg-[#F8F9FB] border border-[#E5E7EB] hover:bg-[#F1F5F9] text-[#0F172A] text-[13px] font-medium rounded-xl transition-colors shadow-soft flex items-center space-x-2"
          >
            <ShieldCheck className="h-4 w-4 text-[#5B4BDB]" />
            <span>View Agreements</span>
          </Link>
        </div>
      </div>

      {/* "Needs your approval" Section */}
      {pendingDeliverables.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Deliverables Needing Your Review ({pendingDeliverables.length})
            </span>
            <Link
              href="/portal/approvals"
              className="text-xs font-semibold text-[#5B4BDB] hover:underline flex items-center gap-1"
            >
              <span>View all in Approvals</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {pendingDeliverables.map((item) => (
              <div
                key={item.id}
                className="bg-white border-2 border-[#5B4BDB]/20 rounded-2xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
              >
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-[11px] font-bold uppercase tracking-wider inline-block">
                    Pending Review · v{item.version}
                  </span>
                  <h2 className="text-lg font-bold text-[#0F172A] tracking-tight">
                    {item.title}
                  </h2>
                  <div className="text-[13px] text-[#64748B]">
                    {item.project_name} · {item.description || "Milestone asset ready for your review"}
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <button
                    onClick={() => {
                      setActiveDeliverable(item);
                      setIsFeedbackModalOpen(true);
                    }}
                    className="h-10 px-4 bg-white border border-[#E5E7EB] text-[#0F172A] text-[13px] font-medium rounded-xl hover:bg-[#F8F9FB] transition-colors shadow-soft"
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="h-10 px-5 bg-[#5B4BDB] hover:bg-[#4D3DC9] text-white text-[13px] font-semibold rounded-xl transition-all shadow-soft flex items-center space-x-2"
                  >
                    <Check className="h-4 w-4 stroke-[2.5]" />
                    <span>Approve Deliverable</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#FAFAFD] border border-[#E5E7EB] rounded-2xl p-6 text-center space-y-2">
          <FileCheck2 className="h-8 w-8 text-[#10B981] mx-auto" />
          <h3 className="text-sm font-bold text-[#0F172A]">All Deliverables Up to Date</h3>
          <p className="text-xs text-[#64748B]">
            You have no pending approvals. Your project team is actively executing current milestones.
          </p>
        </div>
      )}

      {/* Two Columns: Your Active Projects & Invoices/Support */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Your projects */}
        <div className="lg:col-span-7 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E7EB]">
            <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
              Active Project Workspaces
            </h3>
            <Link
              href="/portal/projects"
              className="text-xs font-semibold text-[#5B4BDB] hover:underline flex items-center gap-1"
            >
              <span>View Projects</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#94A3B8]">
              No active projects contracted yet.
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((proj) => (
                <div key={proj.id} className="p-4 rounded-xl border border-[#F1F5F9] bg-[#F8F9FB] space-y-2">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-[#0F172A] font-semibold">{proj.name}</span>
                    <span className="text-[#5B4BDB] font-bold text-xs">{proj.progress_percent || 0}% Complete</span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#5B4BDB] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, proj.progress_percent || 0))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
                    <span className="font-mono">{proj.code}</span>
                    <span className="capitalize">{proj.status.replace("_", " ")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Invoices & Support */}
        <div className="lg:col-span-5 space-y-6">
          {/* Invoices Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
                Tax Invoices
              </h3>
              <Link
                href="/portal/invoices"
                className="text-xs font-semibold text-[#5B4BDB] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {invoices.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#94A3B8]">
                No invoices issued yet.
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0 text-[13px]"
                  >
                    <div>
                      <span className="font-semibold text-[#5B4BDB] block">{inv.invoice_number}</span>
                      <span className="text-[11px] text-[#64748B]">Due: {inv.due_date || "On receipt"}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#0F172A] font-bold block">
                        {formatINRPrecise(inv.total_rupees)}
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          inv.status === "paid"
                            ? "bg-[#ECFDF5] text-[#059669]"
                            : "bg-[#FFFBEB] text-[#D97706]"
                        }`}
                      >
                        {inv.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Support Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
                Dedicated Support
              </h3>
              <span className="text-xs text-[#059669] font-semibold">Active SLA</span>
            </div>
            <p className="text-[13px] text-[#64748B]">
              Need updates or have feedback? Reach out directly to your account managers.
            </p>
            <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Standard Response: &lt; 4 hours</span>
              <Link
                href="/portal/support"
                className="text-[#5B4BDB] font-semibold hover:underline flex items-center gap-1"
              >
                <span>Raise ticket</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Request Changes Modal */}
      {isFeedbackModalOpen && activeDeliverable && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-md shadow-2xl p-6 text-[13px] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="font-bold text-base text-[#0F172A]">
                Request Changes
              </h3>
              <button
                onClick={() => {
                  setIsFeedbackModalOpen(false);
                  setActiveDeliverable(null);
                }}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRequestChanges} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                  Deliverable
                </label>
                <div className="text-[13px] font-semibold text-[#0F172A] bg-[#F8F9FB] border border-[#E5E7EB] px-3.5 py-2.5 rounded-xl">
                  {activeDeliverable.title} (v{activeDeliverable.version})
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                  Your feedback / adjustments needed *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Please update the color accents and clarify the typography according to brand guidelines."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full p-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => {
                    setIsFeedbackModalOpen(false);
                    setActiveDeliverable(null);
                  }}
                  className="h-9 px-4 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#0F172A] hover:bg-[#F8F9FB] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 px-5 bg-[#5B4BDB] hover:bg-[#4D3DC9] text-white rounded-xl text-xs font-semibold shadow-soft transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
