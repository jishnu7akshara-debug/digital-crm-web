"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  CheckCircle2,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { PageReady } from "@/components/page-ready";

interface PortalAgreement {
  id: string;
  agreement_no: string;
  service: string;
  sent_date: string | null;
  status: string;
  value_formatted: string;
  terms_summary: string | null;
}

export default function PortalAgreementsPage() {
  const [selectedAgrId, setSelectedAgrId] = useState<string | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("Authorized Signatory");
  const [consentChecked, setConsentChecked] = useState(true);
  const [isSigning, setIsSigning] = useState(false);

  // Fetch real agreements for logged in client
  const { data: apiResponse, isLoading, error, refetch } = useQuery<any>({
    queryKey: ["portal-agreements"],
    queryFn: async () => {
      return await api.get<any>("/agreements");
    },
  });

  const agreements: PortalAgreement[] = apiResponse?.items || [];
  const selectedAgreement =
    agreements.find((a) => a.id === selectedAgrId) || agreements[0];

  const handleConfirmSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked || !signerName.trim() || !selectedAgreement) return;

    try {
      setIsSigning(true);
      await api.post(`/agreements/${selectedAgreement.id}/sign`, {});
      toast.success(
        `Agreement ${selectedAgreement.agreement_no} signed successfully!`
      );
      setIsSignModalOpen(false);
      setSignerName("");
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to sign agreement.");
    } finally {
      setIsSigning(false);
    }
  };

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState message={(error as any)?.message || "Failed to load agreements"} onRetry={() => refetch()} />;

  if (agreements.length === 0) {
    return (
      <EmptyState
        title="No Service Agreements"
        description="Your agency has not issued any service agreements for your account yet."
      />
    );
  }

  const isSigned = selectedAgreement.status === "signed";

  return (
    <div className="space-y-6 pb-12">
      <PageReady when={!isLoading} state={agreements.length === 0 ? "empty" : "success"} dataLength={agreements.length} />
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              CLIENT PORTAL
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              Legal & Compliance
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Service Agreements & Contracts
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Review service scopes, terms of engagement, and legally sign agency agreements online.
          </p>
        </div>
      </div>

      {/* Grid: Agreement Selector List & Document Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Agreement List */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider block px-1">
            Your Agreements ({agreements.length})
          </span>

          {agreements.map((a) => {
            const isSelected = selectedAgreement.id === a.id;
            const signed = a.status === "signed";

            return (
              <div
                key={a.id}
                onClick={() => setSelectedAgrId(a.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white border-[#5B4BDB] shadow-card ring-1 ring-[#5B4BDB]/20"
                    : "bg-[#F8F9FB] hover:bg-white border-[#E5E7EB]"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#5B4BDB]">
                    {a.agreement_no}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      signed
                        ? "bg-[#ECFDF5] text-[#059669]"
                        : "bg-[#FFFBEB] text-[#D97706]"
                    }`}
                  >
                    {signed ? "Signed" : "Awaiting Signature"}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-[#0F172A] mb-1">
                  {a.service}
                </h4>

                <div className="flex items-center justify-between text-xs text-[#64748B] pt-2 border-t border-[#E5E7EB]/50">
                  <span className="font-bold text-[#0F172A]">
                    {a.value_formatted}
                  </span>
                  <span className="text-[11px]">
                    {a.sent_date ? `Sent ${a.sent_date}` : "Draft"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Agreement Paper Document View */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] shadow-card p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
            <div>
              <span className="text-xs font-bold text-[#5B4BDB] uppercase tracking-wider">
                {selectedAgreement.agreement_no}
              </span>
              <h2 className="text-lg font-bold text-[#0F172A] mt-0.5">
                Master Service Agreement — {selectedAgreement.service}
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              {!isSigned ? (
                <button
                  onClick={() => setIsSignModalOpen(true)}
                  className="h-9 px-4 bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>Sign Agreement</span>
                </button>
              ) : (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs font-semibold text-[#059669]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Legally Signed & Executed</span>
                </div>
              )}
            </div>
          </div>

          {/* Legal Document Body */}
          <div className="bg-[#F8F9FB] rounded-2xl p-6 border border-[#E5E7EB] space-y-4 text-xs text-[#334155] leading-relaxed font-serif">
            <h3 className="font-sans font-bold text-sm text-[#0F172A]">
              1. Engagement & Deliverable Scope
            </h3>
            <p>
              This Master Service Agreement is executed by and between Digital Footprint OS Agency
              and the subscribing Client Organization. The agency agrees to deliver the designated
              services covering: <strong>{selectedAgreement.service}</strong>.
            </p>

            <h3 className="font-sans font-bold text-sm text-[#0F172A]">
              2. Commercial Valuation & Consideration
            </h3>
            <p>
              The Client agrees to pay the contract consideration of{" "}
              <strong>{selectedAgreement.value_formatted}</strong> in accordance with agreed milestone
              schedules and invoiced payment timelines.
            </p>

            <h3 className="font-sans font-bold text-sm text-[#0F172A]">
              3. Terms of Service & Confidentiality
            </h3>
            <p>
              {selectedAgreement.terms_summary ||
                "Both parties agree to standard mutual non-disclosure covenants and IP assignment upon complete receipt of agreed professional fees."}
            </p>
          </div>
        </div>
      </div>

      {/* Modal for Legally Signing Agreement */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
              <h2 className="text-base font-bold text-[#0F172A]">
                Sign Service Agreement
              </h2>
              <button
                onClick={() => setIsSignModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="e.g. Arjun Sundaram"
                  className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-xs"
                />
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 rounded border-[#CBD5E1] text-[#059669] focus:ring-0"
                />
                <label htmlFor="consent" className="text-xs text-[#64748B]">
                  I am an authorized signatory for this organization and accept the commercial terms and deliverables of this agreement.
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSigning || !consentChecked || !signerName.trim()}
                  className="px-4 py-2 bg-[#059669] hover:bg-[#047857] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-soft"
                >
                  {isSigning ? "Signing..." : "Confirm Legal Signature"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
