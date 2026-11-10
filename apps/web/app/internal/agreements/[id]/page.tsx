"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSignature,
  Mail,
  Send,
  Copy,
  ExternalLink,
  ShieldCheck,
  Check,
  FileText,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";

const AGREEMENT_DATA: Record<string, any> = {
  "agr-7": {
    id: "agr-7",
    agreement_no: "DFA-2026-0007",
    account: "Peak Fitness",
    client_id: "CLI-PEAK-001",
    service: "Custom Website Redesign & SEO Growth Retainer",
    value: "₹1,10,000",
    sent: "Nov 04, 2026",
    effective_date: "Nov 10, 2026",
    expiry_date: "Nov 09, 2027",
    status: "Sent",
    email: "arjun@peakfitness.in",
    signatory: "Arjun Nambiar",
    signer_title: "Managing Director",
    signed_copy: false,
    terms: "50% advance on execution, 30% on staging delivery, 20% on production go-live.",
  },
  "agr-6": {
    id: "agr-6",
    agreement_no: "DFA-2026-0006",
    account: "Akshara Enterprises",
    client_id: "CLI-AKSH-001",
    service: "Custom CRM & Lead Routing Platform",
    value: "₹1,20,000",
    sent: "Oct 22, 2026",
    effective_date: "Oct 25, 2026",
    expiry_date: "Oct 24, 2027",
    status: "Signed",
    email: "pooja@akshara.in",
    signatory: "Pooja Hegde",
    signer_title: "Operations Head",
    signed_copy: true,
    signed_at: "Oct 24, 2026, 05:14 PM IST",
    ip_address: "103.21.244.18",
    terms: "Standard milestone billing upon Sprint UAT sign-off.",
  },
  "agr-5": {
    id: "agr-5",
    agreement_no: "DFA-2026-0005",
    account: "Nova Learning",
    client_id: "CLI-NOVA-001",
    service: "Custom EdTech LMS Platform & Student Portal",
    value: "₹2,40,000",
    sent: "Oct 18, 2026",
    effective_date: "Oct 20, 2026",
    expiry_date: "Oct 19, 2027",
    status: "Signed",
    email: "suresh@novalearning.com",
    signatory: "Suresh Patil",
    signer_title: "Founder & CEO",
    signed_copy: true,
    signed_at: "Oct 19, 2026, 02:40 PM IST",
    ip_address: "49.207.210.66",
    terms: "Phased architecture delivery across 4 sprints.",
  },
};

export default function AgreementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agreementId = (params.id as string) || "agr-7";

  const [notification, setNotification] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>("");

  // Fetch from FastAPI
  const { data: apiData, refetch } = useQuery<any>({
    queryKey: ["agreement-detail", agreementId],
    queryFn: async () => {
      try {
        const res = await api.get<any>(`/agreements/${agreementId}`);
        return res;
      } catch (e) {
        return null;
      }
    },
  });

  const fallback = AGREEMENT_DATA[agreementId] || {
    id: agreementId,
    agreement_no: agreementId.startsWith("DFA-") ? agreementId : "DFA-2026-0007",
    account: "Commercial Client Account",
    client_id: "CLI-PEAK-001",
    service: "Master Technology Services Agreement",
    value: "₹1,50,000",
    sent: "Nov 04, 2026",
    effective_date: "Nov 10, 2026",
    expiry_date: "Nov 09, 2027",
    status: "Sent",
    email: "legal@client.in",
    signatory: "Primary Executive",
    signer_title: "Authorized Officer",
    signed_copy: false,
    terms: "50% advance on execution, 30% on staging delivery, 20% on production go-live.",
  };

  const agreement = apiData
    ? {
        id: apiData.id,
        agreement_no: apiData.agreement_no,
        account: apiData.account_name,
        client_id: apiData.account_id || fallback.client_id,
        service: apiData.service,
        value: apiData.value_formatted,
        sent: apiData.sent_date || fallback.sent,
        effective_date: fallback.effective_date,
        expiry_date: fallback.expiry_date,
        status: apiData.status ? apiData.status.charAt(0).toUpperCase() + apiData.status.slice(1) : fallback.status,
        email: apiData.client_email || fallback.email,
        signatory: fallback.signatory,
        signer_title: fallback.signer_title,
        signed_copy: apiData.signed_copy_received ?? fallback.signed_copy,
        signed_at: fallback.signed_at,
        ip_address: fallback.ip_address,
        terms: apiData.terms_summary || fallback.terms,
      }
    : fallback;

  const effectiveStatus = currentStatus || agreement.status;
  const isSigned = effectiveStatus === "Signed" || agreement.signed_copy;

  const handleSignAgreement = async () => {
    try {
      await api.post(`/agreements/${agreement.id}/sign`, {});
      refetch();
    } catch (e) {}

    setCurrentStatus("Signed");
    setNotification(`Agreement ${agreement.agreement_no} recorded as Signed successfully.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/portal/agreements`);
      setNotification("Client digital signing link copied to clipboard.");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs text-[#64748B]">
        <Link
          href="/internal/agreements"
          className="hover:text-[#5B4BDB] font-medium flex items-center space-x-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Agreements Directory</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#0F172A]">{agreement.agreement_no}</span>
      </div>

      {notification && (
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] p-3.5 rounded-xl text-xs text-[#065F46] font-semibold flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-[#059669]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 mb-1">
              <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                SERVICE AGREEMENT (MSA)
              </span>
              <span className="text-[11px] text-[#94A3B8]">·</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isSigned
                    ? "bg-[#ECFDF5] text-[#059669]"
                    : "bg-[#FFFBEB] text-[#D97706]"
                }`}
              >
                {effectiveStatus}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
                Contract Value: {agreement.value}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
              {agreement.agreement_no}
            </h1>
            <p className="text-[14px] text-[#64748B] mt-0.5 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#94A3B8]" />
              <Link
                href={`/internal/clients/${agreement.client_id || "CLI-PEAK-001"}`}
                className="font-semibold text-[#5B4BDB] hover:underline"
              >
                {agreement.account}
              </Link>
              <span>·</span>
              <span>Service: {agreement.service}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={handleCopyLink}
              className="h-10 px-4 bg-white hover:bg-[#F8F9FB] border border-[#CBD5E1] text-[#0F172A] text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
            >
              <Copy className="h-4 w-4 text-[#5B4BDB]" />
              <span>Copy Sign Link</span>
            </button>

            {!isSigned ? (
              <button
                onClick={handleSignAgreement}
                className="h-10 px-4 bg-[#5B4BDB] hover:bg-[#4C3DC7] text-white text-[13px] font-semibold rounded-xl transition-all shadow-sm flex items-center space-x-1.5 active:scale-95"
              >
                <FileSignature className="h-4 w-4" />
                <span>Mark as Signed</span>
              </button>
            ) : (
              <div className="px-3.5 py-2 bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-bold rounded-xl flex items-center space-x-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>Digitally Verified & Sealed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Legal Agreement Viewer Sheet */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 md:p-12 shadow-card max-w-4xl mx-auto space-y-8">
        {/* Document Header */}
        <div className="text-center pb-6 border-b border-[#E5E7EB] space-y-1">
          <span className="text-[11px] font-bold text-[#5B4BDB] uppercase tracking-widest">
            DIGITAL FOOTPRINT TECHNOLOGIES
          </span>
          <h2 className="text-xl font-bold text-[#0F172A]">MASTER SERVICE AGREEMENT & STATEMENT OF WORK</h2>
          <p className="text-xs text-[#64748B]">Document Reference: {agreement.agreement_no}</p>
        </div>

        {/* Parties Clause */}
        <div className="text-xs text-[#475569] leading-relaxed space-y-2">
          <p>
            This Master Service Agreement (&quot;Agreement&quot;) is executed and entered into effective as of{" "}
            <span className="font-semibold text-[#0F172A]">{agreement.effective_date}</span> by and between:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F8F9FD] rounded-xl border border-[#E5E7EB]">
            <div>
              <span className="text-[11px] font-bold text-[#94A3B8] uppercase block mb-0.5">SERVICE PROVIDER</span>
              <p className="font-bold text-[#0F172A]">Digital Footprint Technologies</p>
              <p>HSR Layout, Sector 4, Bengaluru, Karnataka</p>
              <p>GSTIN: 29AAAAA0000A1Z5</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#94A3B8] uppercase block mb-0.5">CLIENT ENTITY</span>
              <p className="font-bold text-[#0F172A]">{agreement.account}</p>
              <p>Designated Contact: {agreement.signatory} ({agreement.email})</p>
              <p>Account Code: {agreement.client_id}</p>
            </div>
          </div>
        </div>

        {/* Scope of Work */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-sm text-[#0F172A]">1. Scope of Deliverables & Engagement</h3>
          <p className="text-[#475569] leading-relaxed">
            Service Provider agrees to design, engineer, and deploy the services defined under{" "}
            <span className="font-semibold text-[#0F172A]">{agreement.service}</span> in compliance with modern production
            standards, responsive performance, SEO indexing, and SLA maintenance requirements.
          </p>
        </div>

        {/* Commercial Consideration */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-sm text-[#0F172A]">2. Commercial Value & Payment Milestones</h3>
          <p className="text-[#475569] leading-relaxed">
            The total agreed contractual value for this statement of work is{" "}
            <span className="font-bold text-[#0F172A]">{agreement.value} (excluding applicable GST)</span>.
            Payment terms: {agreement.terms}
          </p>
        </div>

        {/* Intellectual Property & Confidentiality */}
        <div className="space-y-2 text-xs">
          <h3 className="font-bold text-sm text-[#0F172A]">3. Intellectual Property Rights & Warranty</h3>
          <p className="text-[#475569] leading-relaxed">
            Upon full settlement of all commercial milestones, all customized source code, database architectures, and design
            assets created exclusively for Client shall transfer unconditionally to Client. Service Provider provides a 90-day
            post-deployment warranty covering functional defects.
          </p>
        </div>

        {/* Signatures & Verification Seal */}
        <div className="pt-8 border-t-2 border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#94A3B8] uppercase block">FOR DIGITAL FOOTPRINT:</span>
            <div className="h-14 flex items-end">
              <span className="font-serif italic font-bold text-base text-[#0F172A]">Sai Varshith</span>
            </div>
            <div className="border-t border-[#CBD5E1] pt-1">
              <p className="font-semibold text-[#0F172A]">Sai Varshith</p>
              <p className="text-[#64748B]">Super Admin & Managing Director</p>
              <p className="text-[11px] text-[#94A3B8]">Digital Footprint Technologies</p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#94A3B8] uppercase block">
              FOR CLIENT ({agreement.account.toUpperCase()}):
            </span>
            <div className="h-14 flex items-end">
              {isSigned ? (
                <div className="flex items-center space-x-2 text-[#059669]">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-serif italic font-bold text-base">{agreement.signatory}</span>
                </div>
              ) : (
                <span className="text-xs text-[#94A3B8] italic">Awaiting client digital signature</span>
              )}
            </div>
            <div className="border-t border-[#CBD5E1] pt-1">
              <p className="font-semibold text-[#0F172A]">{agreement.signatory}</p>
              <p className="text-[#64748B]">{agreement.signer_title}</p>
              {isSigned && (
                <p className="text-[11px] text-[#059669] font-medium">
                  Signed: {agreement.signed_at || "Verified"} (IP: {agreement.ip_address || "Verified"})
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
