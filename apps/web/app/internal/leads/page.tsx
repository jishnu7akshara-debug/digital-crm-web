"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Users,
  X,
  Building2,
  ArrowRight,
  ExternalLink,
  Phone,
  Mail,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { PageReady } from "@/components/page-ready";

interface LeadRow {
  id: string;
  name: string;
  company_name?: string | null;
  contact: string;
  email: string;
  phone?: string | null;
  interested_service: string;
  status: "new" | "contacted" | "qualified" | "proposal_sent" | "negotiation" | "won" | "lost";
  owner: string;
  created: string;
  value_rupees: number;
}

const STAGES = [
  { id: "new", label: "New Leads", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "contacted", label: "Contacted", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "qualified", label: "Qualified", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "proposal_sent", label: "Proposal Sent", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "negotiation", label: "Negotiation", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { id: "won", label: "Won Deals", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

export default function SaasLeadsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Lead state
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newService, setNewService] = useState("Website Development");
  const [newValue, setNewValue] = useState("150000");

  // Fetch real leads from FastAPI
  const { data: apiResponse, isLoading, error, refetch } = useQuery<any>({
    queryKey: ["leads-list", searchTerm],
    queryFn: async () => {
      const q = searchTerm.trim() ? `&search=${encodeURIComponent(searchTerm.trim())}` : "";
      return await api.get<any>(`/leads?page_size=100${q}`);
    },
  });

  const leads: LeadRow[] = (apiResponse?.items || []).map((l: any) => {
    return {
      id: l.id,
      name: l.company_name || l.title || "Enterprise Lead",
      company_name: l.company_name,
      contact: l.contact_name || "Lead Contact",
      email: l.email,
      phone: l.phone,
      interested_service: l.title?.includes("–") ? l.title.split("–")[1]?.trim() : l.title || "Custom Service",
      status: (l.status || "new").toLowerCase(),
      owner: l.assigned_to_name || "Unassigned",
      created: l.created_at
        ? new Date(l.created_at).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        : "Recent",
      value_rupees: l.estimated_value_rupees || 0,
    };
  });

  const toggleSelectAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    if (checked) {
      leads.forEach((l) => (next[l.id] = true));
    }
    setSelectedRows(next);
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Company name and email are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/leads", {
        title: `${newName.trim()} – ${newService}`,
        company_name: newName.trim(),
        contact_name: newContact.trim() || newName.trim(),
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.trim() || null,
        source: "website",
        status: "new",
        estimated_value_paise: Math.round(Number(newValue || 150000) * 100),
      });

      toast.success("Lead created successfully.");
      setIsNewModalOpen(false);
      setNewName("");
      setNewContact("");
      setNewEmail("");
      setNewPhone("");
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create lead.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLead = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive lead "${name}"?`)) return;

    try {
      await api.delete(`/leads/${id}`);
      toast.success(`Lead "${name}" archived.`);
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to archive lead.");
    }
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    return <ErrorState message={(error as any)?.message || "Failed to load leads"} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6 pb-12">
      <PageReady when={!isLoading} state={error ? "error" : leads.length === 0 ? "empty" : "success"} dataLength={leads.length} />
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              CRM & SALES PIPELINE
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              {leads.length} Total Leads
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Leads Pipeline</h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Track inquiries, validate client fit, nurture deals, and convert won proposals.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${viewMode === "list" ? "bg-white text-[#0F172A] shadow-soft" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
            >
              <List className="h-4 w-4" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${viewMode === "kanban" ? "bg-white text-[#0F172A] shadow-soft" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Pipeline</span>
            </button>
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#E5E7EB] shadow-card flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search leads by company, contact, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8F9FB] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#5B4BDB]"
          />
        </div>
      </div>

      {/* Main Content: Table or Kanban */}
      {leads.length === 0 ? (
        <EmptyState
          title="No Leads Found"
          description={searchTerm ? "No leads matched your search criteria." : "Create your agency's first sales lead."}
          actionLabel="New Lead"
          onAction={() => setIsNewModalOpen(true)}
        />
      ) : viewMode === "list" ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead className="bg-[#F8F9FB] border-b border-[#E5E7EB] text-[#94A3B8] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="rounded border-[#CBD5E1] text-[#5B4BDB] focus:ring-0"
                    />
                  </th>
                  <th className="py-3 px-4">Lead Organization</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Interested Package</th>
                  <th className="py-3 px-4">Deal Value</th>
                  <th className="py-3 px-4">Pipeline Stage</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[#0F172A]">
                {leads.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => router.push(`/internal/leads/${l.id}`)}
                    className="hover:bg-[#F8F9FD] transition-colors group cursor-pointer"
                  >
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={!!selectedRows[l.id]}
                        onChange={() => toggleRow(l.id)}
                        className="rounded border-[#CBD5E1] text-[#5B4BDB] focus:ring-0"
                      />
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#5B4BDB]">
                      <div className="flex items-center space-x-1.5">
                        <span>{l.name}</span>
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-xs text-[#0F172A]">{l.contact}</div>
                        <div className="text-[11px] text-[#64748B]">{l.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#64748B]">{l.interested_service}</td>
                    <td className="py-3 px-4 font-bold text-xs">
                      ₹{l.value_rupees.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#64748B]">{l.owner}</td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDeleteLead(l.id, l.name)}
                        className="p-1.5 hover:bg-red-50 text-[#94A3B8] hover:text-red-600 rounded-lg transition-colors"
                        title="Archive lead"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban Pipeline View */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {STAGES.map((col) => {
            const colLeads = leads.filter((l) => l.status === col.id);
            return (
              <div key={col.id} className="bg-[#F8F9FA] rounded-2xl p-3 border border-[#E5E7EB] min-w-[220px]">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E5E7EB]">
                  <span className="text-xs font-bold text-[#0F172A]">{col.label}</span>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-white border border-[#E5E7EB] text-[#64748B]">
                    {colLeads.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colLeads.map((l) => (
                    <div
                      key={l.id}
                      onClick={() => router.push(`/internal/leads/${l.id}`)}
                      className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-xs hover:shadow-card hover:border-[#5B4BDB] transition-all cursor-pointer group"
                    >
                      <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#5B4BDB] truncate">
                        {l.name}
                      </h4>
                      <p className="text-[11px] text-[#64748B] mt-0.5 truncate">{l.interested_service}</p>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#F1F5F9] text-[11px]">
                        <span className="font-bold text-[#0F172A]">
                          ₹{l.value_rupees.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[#94A3B8] text-[10px]">{l.owner}</span>
                      </div>
                    </div>
                  ))}
                  {colLeads.length === 0 && (
                    <div className="py-6 text-center text-xs text-[#94A3B8] border border-dashed border-[#CBD5E1] rounded-xl">
                      Empty stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Creating New Lead */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
              <h2 className="text-base font-bold text-[#0F172A]">Create New Sales Lead</h2>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Company / Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Apex Corporation"
                  className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#5B4BDB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#5B4BDB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="vikram@apexcorp.com"
                    className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#5B4BDB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#5B4BDB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Estimated Deal (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="150000"
                    className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#5B4BDB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Interested Package
                </label>
                <select
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#5B4BDB]"
                >
                  <option value="Website Development">Website Development</option>
                  <option value="Digital Marketing & SEO">Digital Marketing & SEO</option>
                  <option value="Custom CRM / ERP Platform">Custom CRM / ERP Platform</option>
                  <option value="Branding & Media">Branding & Media</option>
                  <option value="EdTech LMS">EdTech LMS</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#5B4BDB] hover:bg-[#4C3EBE] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-soft"
                >
                  {isSubmitting ? "Creating..." : "Save Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
