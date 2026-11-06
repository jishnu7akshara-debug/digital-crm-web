"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageSquare, Check, X, Eye } from "lucide-react";
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
    <div className="space-y-4 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#032D60] text-white px-4 py-2.5 rounded-[4px] shadow-lg flex items-center space-x-2 text-[13px] border border-[#0176D3] animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-[#2E844A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#032D60]">Project Deliverable Approvals</h1>
        <p className="text-[13px] text-[#5C5C5C] mt-0.5">
          Review, approve, and provide feedback on designs, wireframes, and deliverables.
        </p>
      </div>

      {/* Approvals List */}
      <div className="space-y-3">
        {deliverables.map((item) => (
          <div
            key={item.id}
            className={`bg-white border rounded-[4px] p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              item.status === "pending"
                ? "border-l-4 border-l-[#0176D3] border-[#DDDBDA]"
                : "border-[#DDDBDA]"
            }`}
          >
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[11px] font-bold text-[#0176D3] uppercase tracking-wider">
                  {item.project_name}
                </span>
                <span className="text-[11px] text-[#5C5C5C]">·</span>
                <span className="text-[11px] text-[#5C5C5C]">Version {item.version}</span>
              </div>
              <h3 className="text-[15px] font-bold text-[#181818]">{item.title}</h3>
              <p className="text-[12px] text-[#5C5C5C] mt-0.5">
                {item.service_name} · {item.sent_date}
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {item.status === "pending" && (
                <>
                  <button
                    onClick={() => setActiveItem(item)}
                    className="h-8 px-3.5 bg-white border border-[#DDDBDA] text-[#181818] text-[13px] rounded-[4px] hover:bg-[#F3F3F3] transition-colors shadow-sm"
                  >
                    Request changes
                  </button>
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="h-8 px-4 bg-[#0176D3] hover:bg-[#0176D3]/90 text-white text-[13px] font-bold rounded-[4px] transition-colors shadow-sm"
                  >
                    Approve
                  </button>
                </>
              )}

              {item.status === "approved" && (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#EBF7E6] text-[#2E844A] rounded-[4px] text-[13px] font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Approved</span>
                </div>
              )}

              {item.status === "revision" && (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#FEF1D6] text-[#8A5200] rounded-[4px] text-[13px] font-bold">
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
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DDDBDA] rounded-[4px] w-full max-w-md shadow-2xl p-5 text-[13px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDDBDA]">
              <h3 className="font-bold text-[15px] text-[#181818]">
                Request Changes: {activeItem.title}
              </h3>
              <button
                onClick={() => setActiveItem(null)}
                className="text-[#5C5C5C] hover:text-[#181818]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRequestChanges} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5C5C5C] uppercase mb-1">
                  Revision Notes & Specific Changes Needed *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Please update button colors and adjust typography on mobile view."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full p-2.5 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] focus:border-[#0176D3] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#DDDBDA]">
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="h-8 px-3 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] hover:bg-[#F3F3F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 bg-[#0176D3] text-white rounded-[4px] text-[13px] font-bold hover:bg-[#0176D3]/90 shadow-sm"
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

