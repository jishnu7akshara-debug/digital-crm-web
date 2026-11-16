"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  Download,
  Mail,
  CheckCircle2,
  X,
  Copy,
  Send,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { PageReady } from "@/components/page-ready";

interface AgreementItem {
  id: string;
  agreement_no: string;
  account_id: string;
  account_name: string;
  service: string;
  value_formatted: string;
  value_paise: number;
  sent_date: string | null;
  signed_copy_received: boolean;
  status: string;
  client_email: string | null;
  terms_summary: string | null;
}

interface AgreementsResponse {
  summary: {
    draft_count: number;
    sent_count: number;
    signed_count: number;
    expired_count: number;
    total_count: number;
  };
  items: AgreementItem[];
}

export default function ServiceAgreementsPage() {
  const router = useRouter();
  const [activeMailDraft, setActiveMailDraft] = useState<AgreementItem | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [newAccount, setNewAccount] = useState("Peak Fitness");
  const [newService, setNewService] = useState("Custom CRM Platform");
  const [newValue, setNewValue] = useState("120000");

  const {
    data: agreementsData,
    isLoading,
    error,
    refetch,
  } = useQuery<AgreementsResponse>({
    queryKey: ["agreements-list"],
    queryFn: async () => {
      const res = await api.get<any>("/agreements");
      return res || { summary: { draft_count: 0, sent_count: 0, signed_count: 0, expired_count: 0, total_count: 0 }, items: [] };
    },
  });

  const agreements = agreementsData?.items || [];
  const summary = agreementsData?.summary || {
    draft_count: 0,
    sent_count: 0,
    signed_count: 0,
    expired_count: 0,
    total_count: 0,
  };

  const handleGenerateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const valPaise = Math.round(Number(newValue || 120000) * 100);
      await api.post("/agreements/generate", {
        account_id: "CLI-PEAK-001",
        service_name: newService,
        value_paise: valPaise,
      });
      setIsGenerateModalOpen(false);
      setToastMessage(`Generated agreement for ${newAccount}`);
      setTimeout(() => setToastMessage(null), 3500);
      await refetch();
    } catch (err: any) {
      setToastMessage(err?.message || "Failed to generate agreement");
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleDownloadTemplate = () => {
    const textContent = `DIGITAL FOOTPRINT MASTER SERVICES AGREEMENT (MSA)
Reference: DFA-TEMPLATE-STANDARD
1. Scope of Work & Payment Terms: 30-day settlement SLA.
2. IP Transfer upon full payment.
3. Governed by the laws of India.`;

    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "DFA_Service_Agreement_Template.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message={(error as any)?.message || "Failed to load agreements."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageReady
        when={!isLoading}
        state={error ? "error" : agreements.length === 0 ? "empty" : "success"}
        dataLength={agreements.length}
      />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#0F172A] text-white px-4 py-3 rounded-xl shadow-dropdown flex items-center space-x-2 text-[13px] border border-[#E5E7EB] animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-[#059669]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              LEGAL & CONTRACTS
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              TCRM Sequence DFA-2026-NNNN
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Service Agreements Tracker
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Track automated agreement lifecycles, signature states, and client email drafts.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleDownloadTemplate}
            className="h-10 px-4 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FB] text-[#0F172A] text-[13px] font-medium rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
          >
            <Download className="h-4 w-4 text-[#64748B]" />
            <span>Download template</span>
          </button>
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Generate agreement</span>
          </button>
        </div>
      </div>

      {/* 4 Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card">
          <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Draft</div>
          <div className="text-2xl font-bold text-[#0F172A] mt-1">{summary.draft_count}</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card">
          <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Awaiting Signature</div>
          <div className="text-2xl font-bold text-[#5B4BDB] mt-1">{summary.sent_count}</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card">
          <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Active / Signed</div>
          <div className="text-2xl font-bold text-[#059669] mt-1">{summary.signed_count}</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card">
          <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Expired / Past Due</div>
          <div className="text-2xl font-bold text-[#64748B] mt-1">{summary.expired_count}</div>
        </div>
      </div>

      {/* Agreements Table */}
      {agreements.length === 0 ? (
        <EmptyState
          title="No agreements found"
          description="Generate a new service agreement to begin tracking contract lifecycles."
          actionLabel="Generate Agreement"
          onAction={() => setIsGenerateModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13.5px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8F9FB] text-[11px] text-[#94A3B8] uppercase font-bold tracking-wider">
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Agreement #</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Client Account</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Service Scope</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Contract Value</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Sent Date</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Signed Copy</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Status</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {agreements.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/internal/agreements/${item.agreement_no}`)}
                    className="hover:bg-[#F8F9FD] transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-[#5B4BDB]">
                      {item.agreement_no}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0F172A]">{item.account_name}</td>
                    <td className="py-3.5 px-4 text-[#64748B]">{item.service}</td>
                    <td className="py-3.5 px-4 font-medium text-[#0F172A]">{item.value_formatted}</td>
                    <td className="py-3.5 px-4 text-[#64748B]">{item.sent_date || "—"}</td>
                    <td className="py-3.5 px-4">
                      {item.signed_copy_received ? (
                        <span className="text-[#059669] font-semibold text-xs">Yes</span>
                      ) : (
                        <span className="text-[#94A3B8] text-xs">No</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.status.toLowerCase() === "signed" || item.status.toLowerCase() === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : item.status.toLowerCase() === "sent" || item.status.toLowerCase() === "awaiting"
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/internal/agreements/${item.agreement_no}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-semibold text-[#5B4BDB] hover:underline"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
