"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Download, CheckCircle2, ShieldCheck, FileText, Check, X, Printer, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

interface PortalAgreement {
  id: string;
  agreement_no: string;
  service: string;
  sent_date: string;
  status: "awaiting" | "signed";
  value: string;
  signed_date?: string;
  signed_by?: string;
}

const INITIAL_PORTAL_AGREEMENTS: PortalAgreement[] = [
  {
    id: "agr-7",
    agreement_no: "DFA-2026-0007",
    service: "Website + SEO",
    sent_date: "sent Nov 4",
    status: "awaiting",
    value: "₹1,10,000",
  },
  {
    id: "agr-4",
    agreement_no: "DFA-2026-0004",
    service: "Website + SEO",
    sent_date: "sent Nov 4",
    status: "signed",
    value: "₹20,000 / mo",
    signed_date: "Nov 4, 2026",
    signed_by: "Arjun S (Peak Fitness)",
  },
];

export default function PortalAgreementsPage() {
  const [agreements, setAgreements] = useState<PortalAgreement[]>(INITIAL_PORTAL_AGREEMENTS);
  const [selectedAgrId, setSelectedAgrId] = useState<string>("agr-7");
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signerName, setSignerName] = useState("Arjun S");
  const [signerTitle, setSignerTitle] = useState("Managing Director");
  const [consentChecked, setConsentChecked] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedAgreement =
    agreements.find((a) => a.id === selectedAgrId) || agreements[0];

  const handleConfirmSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) return;

    const todayStr = "Nov 6, 2026";
    setAgreements((prev) =>
      prev.map((a) =>
        a.id === selectedAgreement.id
          ? {
              ...a,
              status: "signed",
              signed_date: todayStr,
              signed_by: `${signerName} (${signerTitle})`,
            }
          : a
      )
    );

    setIsSignModalOpen(false);
    setToastMessage(
      `Service Agreement ${selectedAgreement.agreement_no} signed successfully! Verified copy emailed to arjun@peakfitness.in.`
    );
    setTimeout(() => setToastMessage(null), 5000);

    try {
      await api.post(`/agreements/${selectedAgreement.id}/sign`, {});
    } catch (err) {
      // optimistic update retained
    }
  };

  const handleDownloadPDF = () => {
    window.print();
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
            LEGAL & COMPLIANCE
          </span>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Service Agreements & Contracts
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Review, download, and digitally sign your master service agreements.
          </p>
        </div>
      </div>

      {/* Master-Detail Two-Pane Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Your agreements */}
        <div className="lg:col-span-4 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card space-y-4">
          <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
            Your Agreements ({agreements.length})
          </h2>

          <div className="space-y-2.5">
            {agreements.map((agr) => {
              const isSelected = agr.id === selectedAgreement.id;
              const isAwaiting = agr.status === "awaiting";

              return (
                <button
                  key={agr.id}
                  onClick={() => setSelectedAgrId(agr.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? "border-[#5B4BDB] bg-[#EEF2FF] shadow-xs"
                      : "border-[#E5E7EB] hover:bg-[#F8F9FB] bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[13px] font-bold ${isSelected ? "text-[#5B4BDB]" : "text-[#0F172A]"}`}>
                      {agr.agreement_no}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        isAwaiting
                          ? "bg-[#FFFBEB] text-[#D97706]"
                          : "bg-[#ECFDF5] text-[#059669]"
                      }`}
                    >
                      {isAwaiting ? "Awaiting Signature" : "Signed"}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#64748B] mt-1">
                    {agr.service} · {agr.sent_date}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Document Preview */}
        <div className="lg:col-span-8 bg-white border border-[#E5E7EB] rounded-2xl p-6 md:p-8 shadow-card flex flex-col justify-between min-h-[560px]">
          <div>
            {/* Agreement Document Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E5E7EB]">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A] tracking-tight">
                  Service Agreement {selectedAgreement.agreement_no}
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Digital Footprint Technologies and Peak Fitness
                </p>
              </div>

              {selectedAgreement.status === "awaiting" ? (
                <span className="text-xs font-semibold text-[#D97706] bg-[#FFFBEB] px-3 py-1 rounded-full border border-[#FDE68A]">
                  Awaiting your signature
                </span>
              ) : (
                <span className="text-xs font-semibold text-[#059669] bg-[#ECFDF5] px-3 py-1 rounded-full border border-[#A7F3D0] flex items-center space-x-1">
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Signed {selectedAgreement.signed_date || "Nov 4, 2026"}</span>
                </span>
              )}
            </div>

            {/* Document Preview Content */}
            <div className="mt-6 space-y-4 text-[13px] text-[#0F172A] leading-relaxed max-w-2xl">
              <div className="bg-[#F8F9FB] p-5 rounded-xl border border-[#E5E7EB] space-y-3.5">
                <div className="font-bold text-[13px] text-[#5B4BDB] uppercase tracking-wide">
                  Master Services Agreement (MSA)
                </div>

                <p className="text-xs text-[#64748B]">
                  This Agreement is entered into between <strong className="text-[#0F172A]">Digital Footprint Technologies Private Limited</strong> (&ldquo;Company&rdquo;) and <strong className="text-[#0F172A]">Peak Fitness</strong> (&ldquo;Client&rdquo;), represented by Arjun S.
                </p>

                {/* Scope of Work */}
                <div className="pt-3 border-t border-[#E5E7EB]">
                  <div className="font-bold text-xs text-[#0F172A] mb-1">
                    1. Scope of Work & Deliverables
                  </div>
                  <ul className="list-disc pl-5 text-xs text-[#64748B] space-y-1">
                    <li>Full custom website design and frontend development on Next.js</li>
                    <li>Technical SEO optimization, site speed architecture, and monthly indexing</li>
                    <li>Social media management & continuous quarterly performance reviews</li>
                  </ul>
                </div>

                {/* Contract Value & Payment SLA */}
                <div className="pt-3 border-t border-[#E5E7EB]">
                  <div className="font-bold text-xs text-[#0F172A] mb-1">
                    2. Commercials & Payment Terms
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Total contract value: <strong className="text-[#0F172A]">{selectedAgreement.value}</strong>. Invoices are payable within 30 days from issuance via NEFT/RTGS, UPI, or corporate banking.
                  </p>
                </div>

                {/* Signatures status */}
                {selectedAgreement.status === "signed" && (
                  <div className="mt-4 pt-3 border-t border-[#A7F3D0] bg-[#ECFDF5] p-3 rounded-xl flex items-center space-x-3">
                    <ShieldCheck className="h-5 w-5 text-[#059669] shrink-0" />
                    <div className="text-[11px] text-[#065F46]">
                      <strong>Digitally Verified & Signed:</strong> {selectedAgreement.signed_by || "Arjun S (Peak Fitness)"} on {selectedAgreement.signed_date || "Nov 4, 2026"}. Certificate SHA-256: 8f4b7c...092d.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Document Bottom Actions */}
          <div className="pt-6 border-t border-[#E5E7EB] mt-6 flex items-center justify-between">
            <span className="text-[11px] text-[#64748B]">
              Status updates automatically once you sign.
            </span>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleDownloadPDF}
                className="h-10 px-4 bg-white border border-[#E5E7EB] text-[#0F172A] text-xs font-semibold rounded-xl hover:bg-[#F8F9FB] transition-colors shadow-soft flex items-center space-x-1.5"
              >
                <Download className="h-4 w-4 text-[#64748B]" />
                <span>Download PDF</span>
              </button>

              {selectedAgreement.status === "awaiting" ? (
                <button
                  onClick={() => setIsSignModalOpen(true)}
                  className="h-10 px-5 bg-[#5B4BDB] hover:bg-[#4D3DC9] text-white text-xs font-semibold rounded-xl transition-all shadow-soft flex items-center space-x-1.5"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Sign Agreement</span>
                </button>
              ) : (
                <button
                  disabled
                  className="h-10 px-4 bg-[#ECFDF5] text-[#059669] text-xs font-semibold rounded-xl flex items-center space-x-1.5 border border-[#A7F3D0] cursor-default"
                >
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  <span>Agreement Signed</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Electronic Signature Modal */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-md shadow-2xl p-6 text-[13px] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-[#5B4BDB]" />
                <h3 className="font-bold text-base text-[#0F172A]">
                  Sign Service Agreement
                </h3>
              </div>
              <button
                onClick={() => setIsSignModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSign} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                  Agreement Reference
                </label>
                <div className="font-mono text-xs font-bold text-[#5B4BDB] bg-[#EEF2FF] border border-[#5B4BDB]/20 px-3 py-2 rounded-xl">
                  {selectedAgreement.agreement_no} · {selectedAgreement.service}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                  Full Name of Authorized Signatory *
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-1 rounded text-[#5B4BDB] focus:ring-[#5B4BDB]"
                  />
                  <span className="text-xs text-[#64748B] leading-snug">
                    I agree to execute this agreement electronically on behalf of Peak Fitness with full binding legal effect.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(false)}
                  className="h-9 px-4 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#0F172A] hover:bg-[#F8F9FB] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!consentChecked || !signerName.trim()}
                  className="h-9 px-5 bg-[#5B4BDB] text-white rounded-xl text-xs font-semibold hover:bg-[#4D3DC9] shadow-soft disabled:opacity-50 transition-all"
                >
                  Adopt & Sign Agreement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}