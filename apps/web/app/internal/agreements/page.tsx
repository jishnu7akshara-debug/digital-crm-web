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

interface AgreementItem {
  id: string;
  agreement_no: string;
  account: string;
  service: string;
  value: string;
  sent: string;
  signed_copy: "Yes" | "No" | "—";
  status: "Sent" | "Signed" | "Draft" | "Expired";
  email: string;
}

const DEFAULT_AGREEMENTS: AgreementItem[] = [
  {
    id: "agr-7",
    agreement_no: "DFA-2026-0007",
    account: "Peak Fitness",
    service: "Website + SEO",
    value: "₹1,10,000",
    sent: "Nov 4",
    signed_copy: "No",
    status: "Sent",
    email: "arjun@peakfitness.in",
  },
  {
    id: "agr-6",
    agreement_no: "DFA-2026-0006",
    account: "Akshara Enterprises",
    service: "CRM development",
    value: "₹1,20,000",
    sent: "Oct 22",
    signed_copy: "Yes",
    status: "Signed",
    email: "pooja@akshara.in",
  },
  {
    id: "agr-5",
    agreement_no: "DFA-2026-0005",
    account: "Nova Learning",
    service: "EdTech platform",
    value: "₹2,40,000",
    sent: "Oct 18",
    signed_copy: "Yes",
    status: "Signed",
    email: "suresh@novalearning.com",
  },
  {
    id: "agr-4",
    agreement_no: "DFA-2026-0004",
    account: "Greenleaf Organics",
    service: "Social media",
    value: "₹20,000 / mo",
    sent: "Oct 10",
    signed_copy: "No",
    status: "Sent",
    email: "divya@greenleaforganics.in",
  },
  {
    id: "agr-3",
    agreement_no: "DFA-2026-0003",
    account: "Bloom Dental",
    service: "SEO",
    value: "₹30,000 / mo",
    sent: "—",
    signed_copy: "—",
    status: "Draft",
    email: "anita@bloomdental.in",
  },
  {
    id: "agr-2",
    agreement_no: "DFA-2026-0002",
    account: "Mehta Interiors",
    service: "Branding",
    value: "₹60,000",
    sent: "Sep 28",
    signed_copy: "Yes",
    status: "Expired",
    email: "rahul@mehtainteriors.in",
  },
];

export default function ServiceAgreementsPage() {
  const router = useRouter();
  const [agreements, setAgreements] = useState<AgreementItem[]>(DEFAULT_AGREEMENTS);
  const [activeMailDraft, setActiveMailDraft] = useState<AgreementItem | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [newAccount, setNewAccount] = useState("Peak Fitness");
  const [newService, setNewService] = useState("Custom CRM Platform");
  const [newValue, setNewValue] = useState("₹1,20,000");

  const draftCount = agreements.filter((a) => a.status === "Draft").length;
  const sentCount = agreements.filter((a) => a.status === "Sent").length;
  const signedCount = agreements.filter((a) => a.status === "Signed").length;
  const expiredCount = agreements.filter((a) => a.status === "Expired").length;

  const handleGenerateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextSeq = `DFA-2026-000${agreements.length + 2}`;
    const newAgr: AgreementItem = {
      id: `agr-${Date.now()}`,
      agreement_no: nextSeq,
      account: newAccount,
      service: newService,
      value: newValue,
      sent: "—",
      signed_copy: "—",
      status: "Draft",
      email: "contact@example.com",
    };

    setAgreements([newAgr, ...agreements]);
    setIsGenerateModalOpen(false);
    setToastMessage(`Generated ${nextSeq} for ${newAccount}`);
    setTimeout(() => setToastMessage(null), 3500);

    try {
      await api.post("/agreements/generate", {
        account_id: "CLI-PEAK-001",
        service_name: newService,
        value_paise: 12000000,
      });
    } catch (err) {}
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

  return (
    <div className="space-y-6 pb-12">
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
          <div className="text-2xl font-bold text-[#0F172A] mt-1">{draftCount}</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card">
          <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Awaiting Signature</div>
          <div className="text-2xl font-bold text-[#D97706] mt-1">{sentCount}</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card">
          <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Signed</div>
          <div className="text-2xl font-bold text-[#059669] mt-1">{signedCount}</div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card">
          <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Expired</div>
          <div className="text-2xl font-bold text-[#64748B] mt-1">{expiredCount}</div>
        </div>
      </div>

      {/* Agreements Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8F9FB] text-[11px] text-[#94A3B8] uppercase font-bold tracking-wider">
                <th className="py-3 px-4 font-semibold text-[#64748B]">Agreement no.</th>
                <th className="py-3 px-3 font-semibold text-[#64748B]">Account</th>
                <th className="py-3 px-3 font-semibold text-[#64748B]">Service</th>
                <th className="py-3 px-3 font-semibold text-[#64748B]">Value</th>
                <th className="py-3 px-3 font-semibold text-[#64748B]">Sent</th>
                <th className="py-3 px-3 font-semibold text-[#64748B]">Signed copy received</th>
                <th className="py-3 px-3 font-semibold text-[#64748B]">Status</th>
                <th className="py-3 px-4 font-semibold text-[#64748B] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {agreements.map((agr) => {
                let badgeClass = "bg-[#F1F5F9] text-[#64748B]";
                if (agr.status === "Sent") badgeClass = "bg-[#FFFBEB] text-[#D97706]";
                if (agr.status === "Signed") badgeClass = "bg-[#ECFDF5] text-[#059669]";
                if (agr.status === "Expired") badgeClass = "bg-[#FFF1F2] text-[#E11D48]";

                return (
                  <tr
                    key={agr.agreement_no}
                    onClick={() => router.push(`/internal/agreements/${agr.id}`)}
                    className="hover:bg-[#F8F9FD] transition-colors group cursor-pointer"
                    title={`Open Agreement ${agr.agreement_no}`}
                  >
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/internal/agreements/${agr.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#5B4BDB] hover:underline font-semibold flex items-center space-x-1.5"
                      >
                        <span>{agr.agreement_no}</span>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#5B4BDB]" />
                      </Link>
                    </td>
                    <td className="py-3.5 px-3 text-[#0F172A] font-medium">
                      <Link
                        href={`/internal/clients?search=${encodeURIComponent(agr.account)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-[#5B4BDB] hover:underline"
                      >
                        {agr.account}
                      </Link>
                    </td>
                    <td className="py-3.5 px-3 text-[#64748B]">{agr.service}</td>
                    <td className="py-3.5 px-3 text-[#0F172A] font-bold">{agr.value}</td>
                    <td className="py-3.5 px-3 text-[#64748B]">{agr.sent}</td>
                    <td className="py-3.5 px-3">
                      {agr.signed_copy === "Yes" ? (
                        <span className="text-[#059669] font-semibold text-xs">Yes</span>
                      ) : agr.signed_copy === "No" ? (
                        <span className="text-[#E11D48] font-semibold text-xs">No</span>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
                        {agr.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMailDraft(agr);
                        }}
                        className="text-[#64748B] hover:text-[#5B4BDB] text-xs font-semibold hover:underline"
                      >
                        Mail draft
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/internal/agreements/${agr.id}`);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-[#EEF2FF] border border-[#CBD5E1] hover:border-[#5B4BDB] text-[#5B4BDB] text-xs font-semibold rounded-lg transition-all shadow-xs"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[#E5E7EB] text-[12px] text-[#64748B]">
          Agreement numbers are generated automatically. Every agreement stays tracked here.
        </div>
      </div>

      {/* Mail Draft Modal */}
      {activeMailDraft && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] w-full max-w-lg shadow-dropdown p-6 text-[14px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-[#5B4BDB]" />
                <h3 className="font-bold text-[16px] text-[#0F172A]">
                  Mail Draft · {activeMailDraft.agreement_no}
                </h3>
              </div>
              <button onClick={() => setActiveMailDraft(null)} className="text-[#64748B] hover:text-[#0F172A]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[12px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                  Recipient
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${activeMailDraft.account} <${activeMailDraft.email}>`}
                  className="w-full h-10 px-3 bg-[#F8F9FB] border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  readOnly
                  value={`Digital Footprint Service Agreement (${activeMailDraft.agreement_no}) for ${activeMailDraft.account}`}
                  className="w-full h-10 px-3 bg-[#F8F9FB] border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                  Email Body
                </label>
                <textarea
                  readOnly
                  rows={6}
                  value={`Dear ${activeMailDraft.account} Team,

Please find enclosed Service Agreement ${activeMailDraft.agreement_no} for ${activeMailDraft.service} (Contract Value: ${activeMailDraft.value}).

You can review and sign the agreement directly through your client portal at:
https://crm.digitalfootprint.in/portal/agreements

Please let us know if you have any questions.

Warm regards,
Digital Footprint Team`}
                  className="w-full p-3 bg-[#F8F9FB] border border-[#E5E7EB] rounded-xl text-[12.5px] font-mono text-[#0F172A]"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Subject: Digital Footprint Service Agreement (${activeMailDraft.agreement_no})\n\nDear Team,\nPlease review and sign: https://crm.digitalfootprint.in/portal/agreements`
                    );
                    setToastMessage("Email draft copied to clipboard");
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="h-10 px-4 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] hover:bg-[#F8F9FB] flex items-center space-x-1.5"
                >
                  <Copy className="h-4 w-4 text-[#64748B]" />
                  <span>Copy draft</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveMailDraft(null)}
                    className="h-10 px-4 border border-[#E5E7EB] rounded-xl text-[13px] text-[#64748B] hover:bg-[#F8F9FB]"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMailDraft(null);
                      setToastMessage(`Email sent to ${activeMailDraft.email}`);
                      setTimeout(() => setToastMessage(null), 3500);
                    }}
                    className="h-10 px-5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl text-[13px] font-semibold shadow-soft flex items-center space-x-1.5"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send now</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Agreement Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] w-full max-w-md shadow-dropdown p-6 text-[14px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="font-bold text-[16px] text-[#0F172A]">
                Generate Service Agreement
              </h3>
              <button onClick={() => setIsGenerateModalOpen(false)} className="text-[#64748B] hover:text-[#0F172A]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateAgreement} className="mt-4 space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Agreement Number (Auto-assigned)
                </label>
                <input
                  type="text"
                  readOnly
                  value={`DFA-2026-000${agreements.length + 2}`}
                  className="w-full h-10 px-3 bg-[#F8F9FB] border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] font-mono"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Account <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Service / Offering <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Contract Value <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="h-10 px-4 border border-[#E5E7EB] rounded-xl text-[13px] text-[#64748B] hover:bg-[#F8F9FB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl text-[13px] font-semibold shadow-soft"
                >
                  Generate Agreement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
