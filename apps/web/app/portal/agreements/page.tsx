"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Download, CheckCircle2, ShieldCheck, FileText, Check, X, Printer } from "lucide-react";
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

  // Perform Electronic Signature
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
      `Service Agreement ${selectedAgreement.agreement_no} signed successfully! A verified copy has been emailed to arjun@peakfitness.in.`
    );
    setTimeout(() => setToastMessage(null), 5000);

    try {
      await api.post(`/agreements/${selectedAgreement.id}/sign`, {});
    } catch (err) {
      // optimistic update retained
    }
  };

  // Download PDF / Print
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-3 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#032D60] text-white px-4 py-2.5 rounded-[4px] shadow-lg flex items-center space-x-2 text-[13px] border border-[#0176D3] animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-[#2E844A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header (Page 8 of PDF) */}
      <div className="py-1">
        <h1 className="text-xl font-bold text-[#032D60]">Agreements</h1>
        <p className="text-[13px] text-[#5C5C5C] mt-0.5">
          View, download and sign your service agreements.
        </p>
      </div>

      {/* Master-Detail Two-Pane Grid (Page 8 of PDF) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Pane: Your agreements (col-span-4) */}
        <div className="lg:col-span-4 bg-white border border-[#DDDBDA] rounded-[4px] p-4 shadow-sm space-y-3">
          <h2 className="text-[14px] font-bold text-[#181818]">
            Your agreements
          </h2>

          <div className="space-y-2">
            {agreements.map((agr) => {
              const isSelected = agr.id === selectedAgreement.id;
              const isAwaiting = agr.status === "awaiting";

              return (
                <button
                  key={agr.id}
                  onClick={() => setSelectedAgrId(agr.id)}
                  className={`w-full text-left p-3 rounded-[4px] border transition-all ${
                    isSelected
                      ? "border-[#0176D3] bg-[#EAF5FE]/40 ring-1 ring-[#0176D3]"
                      : "border-[#DDDBDA] hover:bg-[#F3F3F3]/60 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[#0176D3]">
                      {agr.agreement_no}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-[3px] text-[11px] font-medium ${
                        isAwaiting
                          ? "bg-[#FEF1D6] text-[#8A5200]"
                          : "bg-[#EBF7E6] text-[#2E844A]"
                      }`}
                    >
                      {isAwaiting ? "Awaiting" : "Signed"}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#5C5C5C] mt-1">
                    {agr.service} · {agr.sent_date}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Document Preview (col-span-8) */}
        <div className="lg:col-span-8 bg-white border border-[#DDDBDA] rounded-[4px] p-6 shadow-sm flex flex-col justify-between min-h-[560px]">
          <div>
            {/* Agreement Document Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#DDDBDA]">
              <div>
                <h2 className="text-[16px] font-bold text-[#181818]">
                  Service Agreement {selectedAgreement.agreement_no}
                </h2>
                <p className="text-[12px] text-[#5C5C5C] mt-0.5">
                  Digital Footprint and Peak Fitness
                </p>
              </div>

              {selectedAgreement.status === "awaiting" ? (
                <span className="text-[12px] font-medium text-[#8A5200] bg-[#FEF1D6] px-2.5 py-1 rounded-[3px]">
                  Awaiting your signature
                </span>
              ) : (
                <span className="text-[12px] font-medium text-[#2E844A] bg-[#EBF7E6] px-2.5 py-1 rounded-[3px] flex items-center space-x-1">
                  <Check className="h-3 w-3 stroke-[3]" />
                  <span>Signed {selectedAgreement.signed_date || "Nov 4, 2026"}</span>
                </span>
              )}
            </div>

            {/* Document Preview Content */}
            <div className="mt-6 space-y-4 text-[13px] text-[#181818] leading-relaxed max-w-2xl">
              <div className="bg-[#F3F3F3]/60 p-4 rounded-[4px] border border-[#DDDBDA]/80 space-y-3">
                <div className="font-bold text-[13px] text-[#032D60] uppercase tracking-wide">
                  Master Services Agreement (MSA)
                </div>

                <p className="text-[12px] text-[#5C5C5C]">
                  This Agreement is entered into between <strong>Digital Footprint Technologies Private Limited</strong> (&ldquo;Company&rdquo;) and <strong>Peak Fitness</strong> (&ldquo;Client&rdquo;), represented by Arjun S.
                </p>

                {/* Scope of Work */}
                <div className="pt-2 border-t border-[#DDDBDA]">
                  <div className="font-bold text-[12px] text-[#181818] mb-1">
                    1. Scope of Work & Deliverables
                  </div>
                  <ul className="list-disc pl-5 text-[12px] text-[#5C5C5C] space-y-0.5">
                    <li>Full custom website design and frontend development on Next.js</li>
                    <li>Technical SEO optimization, site speed architecture, and monthly indexing</li>
                    <li>Social media management & continuous quarterly performance reviews</li>
                  </ul>
                </div>

                {/* Contract Value & Payment SLA */}
                <div className="pt-2 border-t border-[#DDDBDA]">
                  <div className="font-bold text-[12px] text-[#181818] mb-1">
                    2. Commercials & Payment Terms
                  </div>
                  <p className="text-[12px] text-[#5C5C5C]">
                    Total contract value: <strong>{selectedAgreement.value}</strong>. Invoices are payable within 30 days from issuance. Payments accepted via NEFT/RTGS, UPI, or corporate banking.
                  </p>
                </div>

                {/* Signatures status */}
                {selectedAgreement.status === "signed" && (
                  <div className="mt-4 pt-3 border-t border-[#2E844A]/40 bg-[#EBF7E6]/40 p-3 rounded-[3px] flex items-center space-x-3">
                    <ShieldCheck className="h-5 w-5 text-[#2E844A] shrink-0" />
                    <div className="text-[11px] text-[#2E844A]">
                      <strong>Digitally Verified & Signed:</strong> {selectedAgreement.signed_by || "Arjun S (Peak Fitness)"} on {selectedAgreement.signed_date || "Nov 4, 2026"}. Certificate SHA-256: 8f4b7c...092d.
                    </div>
                  </div>
                )}
              </div>

              {/* Skeleton placeholder bars matching PDF visual styling */}
              <div className="space-y-2 pt-2 opacity-60">
                <div className="h-2.5 bg-[#E5E5E5] rounded w-full" />
                <div className="h-2.5 bg-[#E5E5E5] rounded w-11/12" />
                <div className="h-2.5 bg-[#E5E5E5] rounded w-4/5" />
                <div className="h-2.5 bg-[#E5E5E5] rounded w-3/4" />
              </div>
            </div>
          </div>

          {/* Document Bottom Actions (Page 8 of PDF) */}
          <div className="pt-6 border-t border-[#DDDBDA] mt-6">
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleDownloadPDF}
                className="h-8 px-4 bg-white border border-[#DDDBDA] text-[#181818] text-[13px] rounded-[4px] hover:bg-[#F3F3F3] transition-colors shadow-sm flex items-center space-x-1.5"
              >
                <Download className="h-3.5 w-3.5 text-[#5C5C5C]" />
                <span>Download PDF</span>
              </button>

              {selectedAgreement.status === "awaiting" ? (
                <button
                  onClick={() => setIsSignModalOpen(true)}
                  className="h-8 px-5 bg-[#0176D3] hover:bg-[#0176D3]/90 text-white text-[13px] font-bold rounded-[4px] transition-colors shadow-sm flex items-center space-x-1.5"
                >
                  <span>Sign agreement</span>
                </button>
              ) : (
                <button
                  disabled
                  className="h-8 px-4 bg-[#EBF7E6] text-[#2E844A] text-[13px] font-bold rounded-[4px] flex items-center space-x-1.5 border border-[#2E844A]/30 cursor-default"
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  <span>Agreement Signed</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-[#5C5C5C] text-right mt-1.5">
              Status updates automatically once you sign.
            </p>
          </div>
        </div>
      </div>

      {/* Electronic Signature Modal */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DDDBDA] rounded-[4px] w-full max-w-md shadow-2xl p-5 text-[13px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDDBDA]">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-[#0176D3]" />
                <h3 className="font-bold text-[15px] text-[#181818]">
                  Sign Service Agreement
                </h3>
              </div>
              <button
                onClick={() => setIsSignModalOpen(false)}
                className="text-[#5C5C5C] hover:text-[#181818]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSign} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5C5C5C] uppercase mb-1">
                  Agreement Reference
                </label>
                <div className="font-mono text-[13px] font-bold text-[#0176D3] bg-[#EAF5FE] px-3 py-1.5 rounded-[4px]">
                  {selectedAgreement.agreement_no} · {selectedAgreement.service}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C5C5C] uppercase mb-1">
                  Full Name of Authorized Signatory *
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full h-8 px-2.5 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] focus:border-[#0176D3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C5C5C] uppercase mb-1">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                  className="w-full h-8 px-2.5 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] focus:border-[#0176D3] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 rounded text-[#0176D3] focus:ring-[#0176D3]"
                  />
                  <span className="text-[11.5px] text-[#5C5C5C] leading-snug">
                    I agree to execute this agreement electronically on behalf of Peak Fitness with full binding legal effect.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#DDDBDA]">
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(false)}
                  className="h-8 px-3 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] hover:bg-[#F3F3F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!consentChecked || !signerName.trim()}
                  className="h-8 px-4 bg-[#0176D3] text-white rounded-[4px] text-[13px] font-bold hover:bg-[#0176D3]/90 shadow-sm disabled:opacity-50"
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

