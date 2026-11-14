"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  MessageSquare,
  Check,
  X,
  Eye,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";

interface DeliverableApprovalItem {
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

export default function PortalApprovalsPage() {
  const [activeItem, setActiveItem] = useState<DeliverableApprovalItem | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real pending deliverables from API
  const { data: deliverables, isLoading, error, refetch } = useQuery<DeliverableApprovalItem[]>({
    queryKey: ["portal-deliverables"],
    queryFn: async () => {
      return await api.get<DeliverableApprovalItem[]>("/projects/deliverables/pending");
    },
  });

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/projects/deliverables/${id}/review`, { status: "approved" });
      toast.success("Deliverable approved! The project team has been notified.");
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve deliverable.");
    }
  };

  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !feedbackText.trim()) return;

    try {
      setIsSubmitting(true);
      await api.post(`/projects/deliverables/${activeItem.id}/review`, {
        status: "revision_requested",
        feedback: feedbackText.trim(),
      });
      toast.success("Changes requested. The team will provide revisions shortly.");
      setActiveItem(null);
      setFeedbackText("");
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit revision request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState message={(error as any)?.message || "Failed to load deliverables"} onRetry={() => refetch()} />;

  const items = deliverables || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              CLIENT PORTAL
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              Quality Assurance
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Deliverable Reviews & Approvals
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Review design mocks, deliverables, and engineering milestones for your active projects.
          </p>
        </div>
      </div>

      {/* Deliverable Review Cards */}
      {items.length === 0 ? (
        <EmptyState
          title="No Deliverables Awaiting Review"
          description="All project deliverables are up to date and signed off."
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const isApproved = item.status === "approved";
            const isRevision = item.status === "revision_requested";

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-[#5B4BDB]">
                      {item.project_name}
                    </span>
                    <span className="text-xs text-[#CBD5E1]">·</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      Version {item.version}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isApproved
                          ? "bg-emerald-50 text-emerald-700"
                          : isRevision
                          ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A]">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-[#64748B]">{item.description}</p>
                  )}

                  {item.client_feedback && (
                    <div className="mt-2 text-xs bg-[#FFFBEB] p-2.5 rounded-xl border border-[#FDE68A] text-[#92400E]">
                      <strong>Feedback:</strong> {item.client_feedback}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {item.file_url && (
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 px-3 bg-[#F8F9FA] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Preview File</span>
                    </a>
                  )}

                  {!isApproved && (
                    <>
                      <button
                        onClick={() => setActiveItem(item)}
                        className="h-9 px-3 border border-[#CBD5E1] hover:bg-amber-50 hover:text-amber-700 text-[#64748B] text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Request Changes</span>
                      </button>

                      <button
                        onClick={() => handleApprove(item.id)}
                        className="h-9 px-4 bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors shadow-soft"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Approve Deliverable</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Revision Request Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
              <h2 className="text-base font-bold text-[#0F172A]">Request Deliverable Changes</h2>
              <button
                onClick={() => setActiveItem(null)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRequestChanges} className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-[#0F172A] block mb-1">
                  Deliverable: {activeItem.title}
                </span>
                <p className="text-xs text-[#64748B] mb-3">
                  Please describe the specific adjustments, design changes, or revisions needed.
                </p>
                <textarea
                  required
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="e.g. Please change the hero headline font and update the navigation CTA to match our corporate guidelines..."
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs focus:outline-none focus:border-[#5B4BDB]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !feedbackText.trim()}
                  className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-soft"
                >
                  {isSubmitting ? "Submitting..." : "Submit Revision Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
