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
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { PageReady } from "@/components/page-ready";

export default function AgreementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agreementId = (params?.id as string) || "";

  const [notification, setNotification] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>("");

  // Fetch from FastAPI
  const {
    data: apiData,
    isLoading,
    error,
    refetch,
  } = useQuery<any>({
    queryKey: ["agreement-detail", agreementId],
    queryFn: async () => {
      return await api.get<any>(`/agreements/${agreementId}`);
    },
    enabled: !!agreementId,
  });

  const agreement = apiData
    ? {
        id: apiData.id,
        agreement_no: apiData.agreement_no,
        account: apiData.account_name,
        client_id: apiData.account_id,
        service: apiData.service,
        value: apiData.value_formatted,
        sent: apiData.sent_date || "—",
        effective_date: apiData.sent_date || "Upon execution",
        expiry_date: "1 Year from Execution",
        status: apiData.status ? apiData.status.charAt(0).toUpperCase() + apiData.status.slice(1) : "Draft",
        email: apiData.client_email || "contact@client.in",
        signed_copy: apiData.signed_copy_received ?? false,
        terms: apiData.terms_summary || "Standard milestone billing upon Sprint UAT sign-off.",
      }
    : null;

  const effectiveStatus = currentStatus || (agreement ? agreement.status : "");
  const isSigned = effectiveStatus === "Signed" || (agreement?.signed_copy ?? false);

  const handleSignAgreement = async () => {
    if (!agreement) return;
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

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error || !agreement) {
    return (
      <ErrorState
        message={(error as any)?.message || "Agreement not found."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageReady when={!isLoading && !!agreement} />

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
                href={`/internal/clients/${agreement.client_id || ""}`}
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
              <p>Billing Contact: {agreement.email}</p>
            </div>
          </div>
        </div>

        {/* Terms Section */}
        <div className="space-y-4 text-xs text-[#334155] leading-relaxed">
          <div>
            <h3 className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px] mb-1">
              1. Statement of Work & Deliverables
            </h3>
            <p>
              The Service Provider agrees to deliver {agreement.service} adhering to production specifications agreed in writing with the Client.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px] mb-1">
              2. Commercial Terms & Payment Schedule
            </h3>
            <p>
              The total contract fee for the scope of services is {agreement.value} plus applicable GST. {agreement.terms}
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px] mb-1">
              3. Intellectual Property Rights
            </h3>
            <p>
              Upon 100% receipt of all agreed consideration and fees, all intellectual property, source code, designs, and brand assets developed specifically for the Client shall be assigned to the Client.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
