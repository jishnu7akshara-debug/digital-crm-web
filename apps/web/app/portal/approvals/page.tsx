"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageSquare, Check, X, Eye, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

interface DeliverableApprovalItem {
  id: string;
  project_name: string;
  service_name: string;
  title: string;
  sent_date: string;
  version: number;
  status: "pending" | "approved" | "revision";
  file_url: string;
}

const INITIAL_DELIVERABLES: DeliverableApprovalItem[] = [
  {
    id: "deliv-peak-homepage",
    project_name: "Website redesign",
    service_name: "Website development",
    title: "Home page design, version 2",
    sent_date: "sent today",
    version: 2,
    status: "pending",
    file_url: "https://crm.digitalfootprint.in/deliverables/peak-fitness-homepage-v2.pdf",
  },
  {
    id: "deliv-peak-seo",
    project_name: "SEO Keyword Strategy & Technical Audit",
    service_name: "SEO",
    title: "Quarter 4 Target Keyword Map & Backlink Plan",
    sent_date: "approved Oct 28",
    version: 1,
    status: "approved",
    file_url: "https://crm.digitalfootprint.in/deliverables/peak-fitness-seo-q4.pdf",
  },
];

export default function PortalApprovalsPage() {
  const [deliverables, setDeliverables] = useState<DeliverableApprovalItem[]>(INITIAL_DELIVERABLES);
  const [activeItem, setActiveItem] = useState<DeliverableApprovalItem | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setDeliverables((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "approved" } : d))
    );
    setToastMessage("Deliverable approved! The project team has been notified.");
    setTimeout(() => setToastMessage(null), 4000);

    try {
      await api.post(`/projects/deliverables/${id}/review`, { status: "approved" });
    } catch (e) {
      // optimistic update retained
    }
  };

  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !feedbackText.trim()) return;

    setDeliverables((prev) =>
      prev.map((d) => (d.id === activeItem.id ? { ...d, status: "revision" } : d))
    );
    setActiveItem(null);
    setFeedbackText("");
    setToastMessage("Changes requested. The team will provide revisions shortly.");
    setTimeout(() => setToastMessage(null), 4000);

    try {
      await api.post(`/projects/deliverables/${activeItem.id}/review`, {
        status: "revision_requested",
        feedback: feedbackText,
      });
    } catch (e) {
      // optimistic update retained
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-[13px] border border-white/10 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1">
            CLIENT WORKSPACE
          </span>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Project Deliverable Approvals
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Review, approve, and provide feedback on designs, wireframes, and deliverables.
          </p>
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {deliverables.map((item) => (
          <div
            key={item.id}
            className={`bg-white border rounded-2xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              item.status === "pending"
                ? "border-2 border-[#5B4BDB]/30 bg-[#EEF2FF]/20"
                : "border-[#E5E7EB]"
            }`}
          >
            <div>
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="text-[11px] font-semibold text-[#5B4BDB] uppercase tracking-wider">
                  {item.project_name}
                </span>
                <span className="text-[11px] text-[#94A3B8]">·</span>
                <span className="text-[11px] text-[#64748B]">Version {item.version}</span>
              </div>
              <h3 className="text-base font-bold text-[#0F172A] tracking-tight">{item.title}</h3>
              <p className="text-[13px] text-[#64748B] mt-0.5">
                {item.service_name} · {item.sent_date}
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              {item.status === "pending" && (
                <>
                  <button
                    onClick={() => setActiveItem(item)}
                    className="h-10 px-4 bg-white border border-[#E5E7EB] text-[#0F172A] text-xs font-semibold rounded-xl hover:bg-[#F8F9FB] transition-colors shadow-soft"
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="h-10 px-5 bg-[#5B4BDB] hover:bg-[#4D3DC9] text-white text-xs font-semibold rounded-xl transition-all shadow-soft flex items-center space-x-1.5"
                  >
                    <Check className="h-4 w-4 stroke-[2.5]" />
                    <span>Approve Deliverable</span>
                  </button>
                </>
              )}

              {item.status === "approved" && (
                <div className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#ECFDF5] text-[#059669] rounded-xl text-xs font-bold border border-[#A7F3D0]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Approved</span>
                </div>
              )}

              {item.status === "revision" && (
                <div className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#FFFBEB] text-[#D97706] rounded-xl text-xs font-bold border border-[#FDE68A]">
                  <MessageSquare className="h-4 w-4" />
                  <span>Changes Requested</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Feedback Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-md shadow-2xl p-6 text-[13px] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="font-bold text-base text-[#0F172A]">
                Request Changes: {activeItem.title}
              </h3>
              <button
                onClick={() => setActiveItem(null)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRequestChanges} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                  Revision Notes & Specific Changes Needed *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Please update button colors and adjust typography on mobile view."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full p-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="h-9 px-4 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#0F172A] hover:bg-[#F8F9FB] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-[#5B4BDB] hover:bg-[#4D3DC9] text-white rounded-xl text-xs font-semibold shadow-soft transition-all"
                >
                  Submit Revisions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}