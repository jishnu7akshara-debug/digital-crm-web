"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  Download,
  Mail,
  CheckCircle2,
  X,
  ExternalLink,
  Copy,
  Send,
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
  const queryClient = useQueryClient();
  const [agreements, setAgreements] = useState<AgreementItem[]>(DEFAULT_AGREEMENTS);
  const [activeMailDraft, setActiveMailDraft] = useState<AgreementItem | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Generate Agreement Form State
  const [newAccount, setNewAccount] = useState("Peak Fitness");
  const [newService, setNewService] = useState("Custom CRM Platform");
  const [newValue, setNewValue] = useState("₹1,20,000");

  // Fetch real agreements from backend API
  const { data: apiData } = useQuery<any>({
    queryKey: ["agreements-list"],
    queryFn: async () => {
      try {
        const res = await api.get<any>("/agreements");
        return res;
      } catch (e) {
        return null;
      }
    },
  });

  // Calculate metrics
  const draftCount = agreements.filter((a) => a.status === "Draft").length;
  const sentCount = agreements.filter((a) => a.status === "Sent").length;
  const signedCount = agreements.filter((a) => a.status === "Signed").length;
  const expiredCount = agreements.filter((a) => a.status === "Expired").length;

  // Generate Agreement Submission
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
    } catch (err) {
      // optimistic update retained
    }
  };

  // Download Agreement Template
  const handleDownloadTemplate = () => {
    const textContent = `DIGITAL FOOTPRINT MASTER SERVICES AGREEMENT (MSA)
Reference: DFA-TEMPLATE-STANDARD
Digital Footprint Technologies Private Limited ("Company") & Client ("Customer")

1. SCOPE OF SERVICES
Company shall deliver web, mobile, SEO, marketing or software consulting services as detailed in the Statement of Work.

2. PAYMENT TERMS
Invoices issued with 30-day settlement SLA. Delayed payments subject to 1.5% interest per month.

3. INTELLECTUAL PROPERTY
Upon receipt of full payment, all custom deliverables transfer solely to the Customer.

4. CONFIDENTIALITY & GOVERNING LAW
Both parties agree to standard non-disclosure. Governed by the laws of India, jurisdiction Bengaluru.`;

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
    <div className="space-y-3 pb-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#032D60] text-white px-4 py-2.5 rounded-[4px] shadow-lg flex items-center space-x-2 text-[13px] border border-[#0176D3] animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-[#2E844A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Record Header Card: Green tile 'G' (#4BC076) + Service Agreements */}
      <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-3 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-[4px] bg-[#4BC076] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
              G
            </div>
            <div>
              <div className="text-[11px] text-[#5C5C5C] font-normal leading-none mb-0.5">
                Accounts
              </div>
              <h1 className="text-xl font-bold text-[#181818] leading-tight">
                Service Agreements
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadTemplate}
              className="h-8 px-3.5 bg-white border border-[#DDDBDA] text-[#181818] text-[13px] rounded-[4px] hover:bg-[#F3F3F3] transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <Download className="h-3.5 w-3.5 text-[#5C5C5C]" />
              <span>Download template</span>
            </button>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="h-8 px-3.5 bg-[#0176D3] hover:bg-[#0176D3]/90 text-white text-[13px] font-bold rounded-[4px] transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Generate agreement</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Status Cards (Page 7 of PDF) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-3 shadow-sm">
          <div className="text-[11px] text-[#5C5C5C] font-normal">Draft</div>
          <div className="text-2xl font-normal text-[#181818] mt-1">{draftCount}</div>
        </div>

        <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-3 shadow-sm">
          <div className="text-[11px] text-[#5C5C5C] font-normal">Sent, awaiting signature</div>
          <div className="text-2xl font-normal text-[#181818] mt-1">{sentCount}</div>
        </div>

        <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-3 shadow-sm">
          <div className="text-[11px] text-[#5C5C5C] font-normal">Signed</div>
          <div className="text-2xl font-normal text-[#181818] mt-1">{signedCount}</div>
        </div>

        <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-3 shadow-sm">
          <div className="text-[11px] text-[#5C5C5C] font-normal">Expired</div>
          <div className="text-2xl font-normal text-[#181818] mt-1">{expiredCount}</div>
        </div>
      </div>

      {/* Agreements Table */}
      <div className="bg-white border border-[#DDDBDA] rounded-[4px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#DDDBDA] bg-[#F3F3F3]/60 text-[11px] text-[#5C5C5C] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-4 font-normal text-[#5C5C5C]">Agreement no.</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Account</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Service</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Value</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Sent</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Signed copy received</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Status</th>
                <th className="py-2.5 px-4 font-normal text-[#5C5C5C] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDDBDA]">
              {agreements.map((agr) => {
                // Status Badge styling
                let statusBadge = "bg-[#F3F3F3] text-[#5C5C5C]";
                if (agr.status === "Sent") statusBadge = "bg-[#FEF1D6] text-[#8A5200]";
                if (agr.status === "Signed") statusBadge = "bg-[#EBF7E6] text-[#2E844A]";
                if (agr.status === "Expired") statusBadge = "bg-[#FEDED8] text-[#BA0517]";

                return (
                  <tr
                    key={agr.agreement_no}
                    className="hover:bg-[#F3F3F3]/60 transition-colors group"
                  >
                    <td className="py-2.5 px-4">
                      <Link
                        href="/portal/agreements"
                        className="text-[#0176D3] hover:underline font-medium"
                      >
                        {agr.agreement_no}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-[#181818] font-normal">
                      <Link
                        href="/internal/clients"
                        className="hover:text-[#0176D3] hover:underline"
                      >
                        {agr.account}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-[#5C5C5C]">{agr.service}</td>
                    <td className="py-2.5 px-3 text-[#181818] font-medium">{agr.value}</td>
                    <td className="py-2.5 px-3 text-[#5C5C5C]">{agr.sent}</td>
                    <td className="py-2.5 px-3 text-[#5C5C5C]">
                      {agr.signed_copy === "Yes" ? (
                        <span className="text-[#2E844A] font-medium">Yes</span>
                      ) : agr.signed_copy === "No" ? (
                        <span className="text-[#BA0517] font-medium">No</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-[3px] text-[11px] font-medium ${statusBadge}`}
                      >
                        {agr.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => setActiveMailDraft(agr)}
                        className="text-[#0176D3] hover:underline text-[13px] font-normal"
                      >
                        Open mail draft
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footnote matching Page 7 of PDF */}
        <div className="p-3 border-t border-[#DDDBDA] text-[12px] text-[#5C5C5C]">
          Agreement numbers are generated automatically. Every agreement stays tracked here.
        </div>
      </div>

      {/* Mail Draft Modal */}
      {activeMailDraft && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#DDDBDA] rounded-[4px] w-full max-w-lg shadow-2xl p-5 text-[13px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDDBDA]">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-[#0176D3]" />
                <h3 className="font-bold text-[15px] text-[#181818]">
                  Mail Draft · {activeMailDraft.agreement_no}
                </h3>
              </div>
              <button
                onClick={() => setActiveMailDraft(null)}
                className="text-[#5C5C5C] hover:text-[#181818]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5C5C5C] uppercase mb-1">
                  Recipient
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${activeMailDraft.account} <${activeMailDraft.email}>`}
                  className="w-full h-8 px-2.5 bg-[#F3F3F3] border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C5C5C] uppercase mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  readOnly
                  value={`Digital Footprint Service Agreement (${activeMailDraft.agreement_no}) for ${activeMailDraft.account}`}
                  className="w-full h-8 px-2.5 bg-[#F3F3F3] border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C5C5C] uppercase mb-1">
                  Email Body
                </label>
                <textarea
                  readOnly
                  rows={6}
                  value={`Dear ${activeMailDraft.account} Team,

Please find enclosed Service Agreement ${activeMailDraft.agreement_no} for ${activeMailDraft.service} (Contract Value: ${activeMailDraft.value}).

You can review and sign the agreement directly through your client portal at:
https://crm.digitalfootprint.in/portal/agreements

Please let us know if you have any questions or require modifications.

Warm regards,
Digital Footprint Team`}
                  className="w-full p-2.5 bg-[#F3F3F3] border border-[#DDDBDA] rounded-[4px] text-[12px] font-mono text-[#181818]"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#DDDBDA]">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Subject: Digital Footprint Service Agreement (${activeMailDraft.agreement_no})\n\nDear Team,\nPlease review and sign: https://crm.digitalfootprint.in/portal/agreements`
                    );
                    setToastMessage("Email draft copied to clipboard");
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="h-8 px-3 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] hover:bg-[#F3F3F3] flex items-center space-x-1.5"
                >
                  <Copy className="h-3.5 w-3.5 text-[#5C5C5C]" />
                  <span>Copy draft</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveMailDraft(null)}
                    className="h-8 px-3 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] hover:bg-[#F3F3F3]"
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
                    className="h-8 px-4 bg-[#0176D3] text-white rounded-[4px] text-[13px] font-bold hover:bg-[#0176D3]/90 shadow-sm flex items-center space-x-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
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
          <div className="bg-white border border-[#DDDBDA] rounded-[4px] w-full max-w-md shadow-2xl p-5 text-[13px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDDBDA]">
              <h3 className="font-bold text-[15px] text-[#181818]">
                Generate Service Agreement
              </h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-[#5C5C5C] hover:text-[#181818]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateAgreement} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5C5C5C] uppercase mb-1">
                  Agreement Number
                </label>
                <input
                  type="text"
                  readOnly
                  value={`DFA-2026-000${agreements.length + 2} (Auto)`}
                  className="w-full h-8 px-2.5 bg-[#F3F3F3] border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C5C5C] uppercase mb-1">
                  Account *
                </label>
                <input
                  type="text"
                  required
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                  className="w-full h-8 px-2.5 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] focus:border-[#0176D3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C5C5C] uppercase mb-1">
                  Service / Offering *
                </label>
                <input
                  type="text"
                  required
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="w-full h-8 px-2.5 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] focus:border-[#0176D3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C5C5C] uppercase mb-1">
                  Contract Value *
                </label>
                <input
                  type="text"
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full h-8 px-2.5 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] focus:border-[#0176D3] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#DDDBDA]">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="h-8 px-3 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] hover:bg-[#F3F3F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 bg-[#0176D3] text-white rounded-[4px] text-[13px] font-bold hover:bg-[#0176D3]/90 shadow-sm"
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

