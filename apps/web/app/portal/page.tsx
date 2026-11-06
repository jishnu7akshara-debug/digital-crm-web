"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, MessageSquare, ExternalLink, X, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

const SERVICES_PROGRESS = [
  { name: "Website development", progress: 65, color: "bg-[#5B4BDB]" },
  { name: "SEO Optimization", progress: 40, color: "bg-[#06B6D4]" },
  { name: "Social media management", progress: 30, color: "bg-[#10B981]" },
  { name: "Custom CRM Setup", progress: 10, color: "bg-[#F59E0B]" },
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 select-none">
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-[13px] border border-white/10 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modern SaaS Welcome Banner */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              CLIENT PORTAL
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              Peak Fitness
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Welcome back, Arjun 👋
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Here is where your active contracted services and milestone deliverables stand.
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

      {/* "Needs your approval" Action Card */}
      <div className="bg-white border-2 border-[#5B4BDB]/20 rounded-2xl p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-[11px] font-bold uppercase tracking-wider inline-block">
            Needs Your Review & Approval
          </span>
          <h2 className="text-lg font-bold text-[#0F172A] tracking-tight">
            Home page design, version 2
          </h2>
          <div className="text-[13px] text-[#64748B]">
            Website development · Sent today for client review
          </div>
        </div>

        {approvalStatus === "pending" && (
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="h-10 px-4 bg-white border border-[#E5E7EB] text-[#0F172A] text-[13px] font-medium rounded-xl hover:bg-[#F8F9FB] transition-colors shadow-soft"
            >
              Request Changes
            </button>
            <button
              onClick={handleApprove}
              className="h-10 px-5 bg-[#5B4BDB] hover:bg-[#4D3DC9] text-white text-[13px] font-semibold rounded-xl transition-all shadow-soft flex items-center space-x-2"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span>Approve Deliverable</span>
            </button>
          </div>
        )}

        {approvalStatus === "approved" && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-[#ECFDF5] text-[#059669] rounded-xl text-[13px] font-bold shrink-0 border border-[#A7F3D0]">
            <CheckCircle2 className="h-4 w-4" />
            <span>Approved today</span>
          </div>
        )}

        {approvalStatus === "revision" && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-[#FFFBEB] text-[#D97706] rounded-xl text-[13px] font-bold shrink-0 border border-[#FDE68A]">
            <MessageSquare className="h-4 w-4" />
            <span>Changes requested</span>
          </div>
        )}
      </div>

      {/* Two Columns: Your Services & Invoices/Support */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Your services */}
        <div className="lg:col-span-7 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E7EB]">
            <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
              Active Services
            </h3>
            <span className="text-xs text-[#64748B]">Contracted deliverables</span>
          </div>

          <div className="space-y-5">
            {SERVICES_PROGRESS.map((svc) => (
              <div key={svc.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#0F172A] font-semibold">{svc.name}</span>
                  <span className="text-[#64748B] font-medium">{svc.progress}%</span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                  <div
                    className={`${svc.color} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${svc.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
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

            <div className="space-y-3">
              {INVOICES.map((inv) => (
                <div
                  key={inv.number}
                  className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0 text-[13px]"
                >
                  <span className="font-semibold text-[#5B4BDB]">{inv.number}</span>
                  <span className="text-[#0F172A] font-bold">{inv.amount}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      inv.isPaid
                        ? "bg-[#ECFDF5] text-[#059669]"
                        : "bg-[#FFFBEB] text-[#D97706]"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Support Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#E5E7EB]">
              <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
                Dedicated Support
              </h3>
              <span className="text-xs text-[#059669] font-semibold">Live SLA Active</span>
            </div>
            <p className="text-[13px] text-[#64748B]">
              No pending tickets. Reach out anytime with project requests.
            </p>
            <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Account Lead: Meera</span>
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
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-md shadow-2xl p-6 text-[13px] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="font-bold text-base text-[#0F172A]">
                Request Changes
              </h3>
              <button
                onClick={() => setIsFeedbackModalOpen(false)}
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
                  Home page design, version 2
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                  Your feedback / adjustments needed *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Please update the hero section heading and adjust the button colors to match our brand guidelines."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full p-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="h-9 px-4 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#0F172A] hover:bg-[#F8F9FB] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-[#5B4BDB] hover:bg-[#4D3DC9] text-white rounded-xl text-xs font-semibold shadow-soft transition-all"
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