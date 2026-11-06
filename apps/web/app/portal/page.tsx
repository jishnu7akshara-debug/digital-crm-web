"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Check, CheckCircle2, MessageSquare, ExternalLink, X } from "lucide-react";
import { api } from "@/lib/api";

const SERVICES_PROGRESS = [
  { name: "Website development", progress: 65 },
  { name: "SEO", progress: 40 },
  { name: "Social media management", progress: 30 },
  { name: "Custom CRM", progress: 10 },
];

const INVOICES = [
  { number: "DF-2026-0002", amount: "₹70,000", status: "Due Nov 20", isPaid: false },
  { number: "DF-2026-0001", amount: "₹90,000", status: "Paid", isPaid: true },
];

export default function ClientPortalDashboard() {
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved" | "revision">("pending");
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleApprove = async () => {
    setApprovalStatus("approved");
    setToastMessage("Deliverable approved! The project team has been notified to proceed.");
    setTimeout(() => setToastMessage(null), 4000);

    try {
      await api.post("/projects/deliverables/deliv-peak-homepage/review", {
        status: "approved",
      });
    } catch (e) {
      // optimistic update retained
    }
  };

  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setApprovalStatus("revision");
    setIsFeedbackModalOpen(false);
    setToastMessage("Changes requested. Your feedback has been sent to Meera and the design team.");
    setTimeout(() => setToastMessage(null), 4000);

    try {
      await api.post("/projects/deliverables/deliv-peak-homepage/review", {
        status: "revision_requested",
        feedback: feedbackText,
      });
    } catch (e) {
      // optimistic update retained
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#032D60] text-white px-4 py-2.5 rounded-[4px] shadow-lg flex items-center space-x-2 text-[13px] border border-[#0176D3] animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-[#2E844A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Light-blue Welcome Band (Page 5 of PDF) */}
      <div className="bg-[#EAF5FE] border border-[#DDDBDA] rounded-[4px] px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-bold text-[#032D60]">
          Welcome back, Arjun
        </h1>
        <p className="text-[13px] text-[#5C5C5C] mt-1">
          Here is where your services stand.
        </p>
      </div>

      {/* "Needs your approval" Card (Page 5 of PDF) */}
      <div className="bg-white border border-[#DDDBDA] border-l-4 border-l-[#0176D3] rounded-[4px] p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[12px] font-bold text-[#0176D3] mb-0.5">
            Needs your approval
          </div>
          <h2 className="text-[16px] font-bold text-[#181818]">
            Home page design, version 2
          </h2>
          <div className="text-[12px] text-[#5C5C5C] mt-0.5">
            Website development · sent today
          </div>
        </div>

        {approvalStatus === "pending" && (
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="h-8 px-3.5 bg-white border border-[#DDDBDA] text-[#181818] text-[13px] rounded-[4px] hover:bg-[#F3F3F3] transition-colors shadow-sm"
            >
              Request changes
            </button>
            <button
              onClick={handleApprove}
              className="h-8 px-4 bg-[#0176D3] hover:bg-[#0176D3]/90 text-white text-[13px] font-bold rounded-[4px] transition-colors shadow-sm"
            >
              Approve
            </button>
          </div>
        )}

        {approvalStatus === "approved" && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#EBF7E6] text-[#2E844A] rounded-[4px] text-[13px] font-bold shrink-0">
            <CheckCircle2 className="h-4 w-4" />
            <span>Approved today</span>
          </div>
        )}

        {approvalStatus === "revision" && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#FEF1D6] text-[#8A5200] rounded-[4px] text-[13px] font-bold shrink-0">
            <MessageSquare className="h-4 w-4" />
            <span>Changes requested</span>
          </div>
        )}
      </div>

      {/* Two Columns: Your Services (Left ~60%) & Invoices/Support (Right ~40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Your services */}
        <div className="lg:col-span-7 bg-white border border-[#DDDBDA] rounded-[4px] p-4 shadow-sm">
          <h3 className="text-[14px] font-bold text-[#181818] mb-4">
            Your services
          </h3>

          <div className="space-y-4">
            {SERVICES_PROGRESS.map((svc) => (
              <div key={svc.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#181818] font-normal">{svc.name}</span>
                  <span className="text-[#5C5C5C] font-normal">{svc.progress}%</span>
                </div>
                <div className="w-full bg-[#E5E5E5] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0176D3] h-full rounded-full transition-all duration-500"
                    style={{ width: `${svc.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Invoices & Support */}
        <div className="lg:col-span-5 space-y-4">
          {/* Invoices Card */}
          <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-[#181818]">Invoices</h3>
              <Link
                href="/portal/invoices"
                className="text-[12px] text-[#0176D3] hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {INVOICES.map((inv) => (
                <div
                  key={inv.number}
                  className="flex items-center justify-between py-1.5 border-b border-[#DDDBDA]/60 last:border-0 text-[13px]"
                >
                  <span className="text-[#0176D3] font-medium">{inv.number}</span>
                  <span className="text-[#181818] font-medium">{inv.amount}</span>
                  <span
                    className={`px-2 py-0.5 rounded-[3px] text-[11px] font-medium ${
                      inv.isPaid
                        ? "bg-[#EBF7E6] text-[#2E844A]"
                        : "bg-[#FEF1D6] text-[#8A5200]"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Support Card */}
          <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-4 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#181818] mb-2">
              Support
            </h3>
            <p className="text-[13px] text-[#5C5C5C]">
              No open tickets
            </p>
            <div className="mt-3 pt-3 border-t border-[#DDDBDA] flex items-center justify-between text-[12px]">
              <span className="text-[#5C5C5C]">Account Manager: Meera</span>
              <Link
                href="/portal/support"
                className="text-[#0176D3] hover:underline font-medium"
              >
                Raise a ticket
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Request Changes Modal */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DDDBDA] rounded-[4px] w-full max-w-md shadow-2xl p-5 text-[13px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDDBDA]">
              <h3 className="font-bold text-[15px] text-[#181818]">
                Request Changes
              </h3>
              <button
                onClick={() => setIsFeedbackModalOpen(false)}
                className="text-[#5C5C5C] hover:text-[#181818]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRequestChanges} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5C5C5C] uppercase mb-1">
                  Deliverable
                </label>
                <div className="text-[13px] font-medium text-[#181818] bg-[#F3F3F3] px-3 py-2 rounded-[4px]">
                  Home page design, version 2
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C5C5C] uppercase mb-1">
                  Your feedback / adjustments needed *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Please update the hero section heading and adjust the button colors to match our brand guidelines."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full p-2.5 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] focus:border-[#0176D3] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#DDDBDA]">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="h-8 px-3 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] hover:bg-[#F3F3F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 bg-[#0176D3] text-white rounded-[4px] text-[13px] font-bold hover:bg-[#0176D3]/90 shadow-sm"
                >
                  Submit feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
