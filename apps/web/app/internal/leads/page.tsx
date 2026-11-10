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
  Filter,
  X,
  Building2,
  ArrowRight,
  ExternalLink,
  Phone,
  Mail,
  UserCheck,
} from "lucide-react";
import { api } from "@/lib/api";

interface LeadRow {
  id: string;
  name: string;
  company_name?: string;
  contact: string;
  email?: string;
  phone?: string;
  interested_service: string;
  status: "New" | "Contacted" | "Qualified" | "Proposal" | "Negotiation" | "Won";
  owner: string;
  created: string;
  value_rupees?: number;
}

const DEFAULT_LEADS: LeadRow[] = [
  { id: "c41b7b3d-2303-4672-8964-61c87afae46f", name: "Sri Venkata Traders", contact: "Ravi Kumar", email: "ravi@srivenkata.in", phone: "+91 98450 11223", interested_service: "Website Redesign", status: "New", owner: "Meera Sharma", created: "Nov 5, 2026", value_rupees: 180000 },
  { id: "6866993b-1f8f-46c6-a69f-afcfb229fff1", name: "Bloom Dental Clinic", contact: "Dr. Anita Rao", email: "anita@bloomdental.in", phone: "+91 99001 22334", interested_service: "SEO & Growth", status: "Contacted", owner: "Karan Verma", created: "Nov 4, 2026", value_rupees: 90000 },
  { id: "f90ae948-1177-42c9-aec7-5695a3677bd6", name: "Nova Learning", contact: "Suresh Patil", email: "suresh@novalearning.com", phone: "+91 98860 33445", interested_service: "EdTech Platform", status: "Qualified", owner: "Meera Sharma", created: "Nov 3, 2026", value_rupees: 240000 },
  { id: "1a3d3615-3046-4623-a701-666a67e731cc", name: "Greenleaf Organics", contact: "Divya Reddy", email: "divya@greenleaforganics.in", phone: "+91 97410 44556", interested_service: "Social Media & Ads", status: "Proposal", owner: "Karan Verma", created: "Nov 2, 2026", value_rupees: 120000 },
  { id: "c49b35b5-defa-420b-a7d3-99e10204a8a5", name: "Lakshmi Silks", contact: "Mohan Teja", email: "mohan@lakshmisilks.in", phone: "+91 98220 55667", interested_service: "E-Commerce Webshop", status: "Negotiation", owner: "Meera Sharma", created: "Nov 1, 2026", value_rupees: 350000 },
  { id: "c9dff69d-f2a6-4973-83cd-80bc9e6c7800", name: "Mehta Interiors", contact: "Rahul Mehta", email: "rahul@mehtainteriors.in", phone: "+91 98220 55667", interested_service: "Branding & Media", status: "Qualified", owner: "Karan Verma", created: "Oct 30, 2026", value_rupees: 150000 },
  { id: "6dad3666-e358-4868-8336-a8b1685d9197", name: "Quick Courier", contact: "Imran Sheikh", email: "imran@quickcourier.in", phone: "+91 99112 66778", interested_service: "Custom CRM Setup", status: "New", owner: "Meera Sharma", created: "Oct 29, 2026", value_rupees: 280000 },
  { id: "821faca5-8c76-4736-a70a-493de7dad870", name: "Aster Tutorials", contact: "Neha Gupta", email: "neha@astertutorials.in", phone: "+91 98765 77889", interested_service: "EdTech Platform", status: "Contacted", owner: "Karan Verma", created: "Oct 28, 2026", value_rupees: 160000 },
  { id: "c591b2a8-aab0-4377-8e5a-2836555d9bc8", name: "Zenith Logistics Ltd", contact: "Vikram Malhotra", email: "vikram@zenithlogistics.in", phone: "+91 98110 88990", interested_service: "Enterprise ERP", status: "Won", owner: "Sai Varshith", created: "Oct 20, 2026", value_rupees: 450000 },
];

export default function SaasLeadsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // New Lead state
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newService, setNewService] = useState("Website");
  const [newValue, setNewValue] = useState("150000");
  const [newOwner, setNewOwner] = useState("Meera Sharma");

  // Fetch real leads from FastAPI
  const { data: apiLeads, refetch } = useQuery<any>({
    queryKey: ["leads-list"],
    queryFn: async () => {
      try {
        const res = await api.get<any>("/leads?page_size=50");
        return res?.items || [];
      } catch (e) {
        return [];
      }
    },
  });

  // Map API leads or fallback
  const leads: LeadRow[] =
    apiLeads && apiLeads.length > 0
      ? apiLeads.map((l: any) => {
          let st: LeadRow["status"] = "New";
          const rawSt = (l.status || "").toLowerCase();
          if (rawSt === "contacted") st = "Contacted";
          else if (rawSt === "qualified") st = "Qualified";
          else if (rawSt === "proposal" || rawSt === "proposal_sent") st = "Proposal";
          else if (rawSt === "negotiation") st = "Negotiation";
          else if (rawSt === "won") st = "Won";

          return {
            id: l.id,
            name: l.company_name || l.title || "Enterprise Lead",
            company_name: l.company_name,
            contact: l.contact_name || "Lead Contact",
            email: l.email,
            phone: l.phone,
            interested_service: l.title?.includes("–") ? l.title.split("–")[1]?.trim() : l.title || "Custom Service",
            status: st,
            owner: l.assigned_to_name || "Meera Sharma",
            created: l.created_at ? new Date(l.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Recent",
            value_rupees: l.estimated_value_rupees || 150000,
          };
        })
      : DEFAULT_LEADS;

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
    if (!newName.trim()) return;

    try {
      await api.post("/leads", {
        title: `${newName.trim()} – ${newService}`,
        company_name: newName.trim(),
        contact_name: newContact.trim() || newName.trim(),
        email: newEmail.trim() || `contact@${newName.toLowerCase().replace(/\s+/g, "")}.com`,
        phone: newPhone.trim() || "+91 98765 00000",
        source: "website",
        status: "new",
        estimated_value_paise: Math.round(Number(newValue || 150000) * 100),
      });
      refetch();
    } catch (e) {}

    setIsNewModalOpen(false);
    setNewName("");
    setNewContact("");
    setNewEmail("");
    setNewPhone("");
  };

  const getStatusBadge = (status: LeadRow["status"]) => {
    switch (status) {
      case "New":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EEF2FF] text-[#5B4BDB]">New</span>;
      case "Contacted":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F9FF] text-[#0284C7]">Contacted</span>;
      case "Qualified":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669]">Qualified</span>;
      case "Proposal":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#D97706]">Proposal</span>;
      case "Negotiation":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF1F2] text-[#E11D48]">Negotiation</span>;
      case "Won":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669]">Won</span>;
    }
  };

  const filtered = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.interested_service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allSelected = leads.length > 0 && leads.every((l) => selectedRows[l.id]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              CLIENT ACQUISITION
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              {leads.length} Total Leads
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Leads Pipeline & Enquiries
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Capture, qualify, and convert new agency business opportunities into long-term accounts.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="h-10 px-4 bg-[#5B4BDB] hover:bg-[#4C3DC7] text-white text-[13px] font-semibold rounded-xl transition-all shadow-sm flex items-center space-x-1.5 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search + Filter + View Toggles */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search leads, contacts, or services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 bg-[#F8F9FB] border border-[#E5E7EB] rounded-xl pl-10 pr-4 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 transition-all"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <div className="text-[13px] text-[#64748B] hidden md:block">
            {filtered.length} leads listed
          </div>

          <div className="flex items-center bg-[#F8F9FB] p-1 rounded-xl border border-[#E5E7EB]">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                viewMode === "list"
                  ? "bg-white text-[#0F172A] shadow-soft"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                viewMode === "kanban"
                  ? "bg-white text-[#0F172A] shadow-soft"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Kanban */}
      {viewMode === "list" ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13.5px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8F9FB] text-[11px] text-[#94A3B8] uppercase font-bold tracking-wider">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="rounded border-[#CBD5E1] text-[#5B4BDB] focus:ring-[#5B4BDB]"
                    />
                  </th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Lead Organization</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Primary Contact</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Interested Service</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Est. Value</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Status</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Assigned Rep</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filtered.map((lead) => {
                  const isChecked = !!selectedRows[lead.id];
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => router.push(`/internal/leads/${lead.id}`)}
                      className={`hover:bg-[#F8F9FD] transition-colors group cursor-pointer ${
                        isChecked ? "bg-[#EEF2FF]/40" : ""
                      }`}
                      title={`Open ${lead.name} details`}
                    >
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRow(lead.id)}
                          className="rounded border-[#CBD5E1] text-[#5B4BDB] focus:ring-[#5B4BDB]"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                        <Link
                          href={`/internal/leads/${lead.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#5B4BDB] hover:underline flex items-center space-x-1.5"
                        >
                          <span>{lead.name}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 text-[#5B4BDB] transition-opacity shrink-0" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-[#0F172A] font-medium">
                        {lead.contact}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B]">{lead.interested_service}</td>
                      <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                        ₹{(lead.value_rupees || 150000).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(lead.status)}</td>
                      <td className="py-3.5 px-4 text-[#0F172A] font-medium">{lead.owner}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/internal/leads/${lead.id}`);
                          }}
                          className="px-3 py-1 bg-white hover:bg-[#EEF2FF] border border-[#CBD5E1] hover:border-[#5B4BDB] text-[#5B4BDB] text-xs font-semibold rounded-lg transition-all shadow-xs"
                        >
                          Open Lead →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
          {(["New", "Contacted", "Qualified", "Proposal", "Negotiation"] as const).map((stage) => {
            const stageLeads = filtered.filter((l) => l.status === stage);
            return (
              <div
                key={stage}
                className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card p-4 flex flex-col min-h-[460px]"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-3">
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    {stage}
                  </span>
                  <span className="h-6 w-6 rounded-full bg-[#EEF2FF] text-[#5B4BDB] font-bold text-xs flex items-center justify-center">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => router.push(`/internal/leads/${lead.id}`)}
                      className="bg-[#F8F9FB] hover:bg-white border border-[#E5E7EB] hover:border-[#5B4BDB]/40 rounded-xl p-3.5 shadow-soft transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[13.5px] text-[#0F172A] group-hover:text-[#5B4BDB] transition-colors">
                          {lead.name}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-[#94A3B8] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <div className="text-[12px] text-[#64748B] mb-2">{lead.contact}</div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]/60 text-[11px]">
                        <span className="text-[#64748B] truncate max-w-[100px]">{lead.interested_service}</span>
                        <span className="font-bold text-[#0F172A]">
                          ₹{(lead.value_rupees || 150000).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="h-28 flex items-center justify-center border-2 border-dashed border-[#E5E7EB] rounded-xl text-xs text-[#94A3B8]">
                      No leads
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Lead Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">Create New Lead</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Record new business enquiry and assign ownership.
                </p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Company / Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Corp"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-10 px-3.5 bg-[#F8F9FB] border border-[#CBD5E1] rounded-xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                    Primary Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Sharma"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    className="w-full h-10 px-3.5 bg-[#F8F9FB] border border-[#CBD5E1] rounded-xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full h-10 px-3.5 bg-[#F8F9FB] border border-[#CBD5E1] rounded-xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="vikram@apexcorp.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full h-10 px-3.5 bg-[#F8F9FB] border border-[#CBD5E1] rounded-xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                    Interested Service
                  </label>
                  <select
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="w-full h-10 px-3 bg-[#F8F9FB] border border-[#CBD5E1] rounded-xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#5B4BDB]"
                  >
                    <option value="Website Development">Website Development</option>
                    <option value="Digital Marketing">Digital Marketing & SEO</option>
                    <option value="CRM / ERP Platform">Custom CRM / ERP Platform</option>
                    <option value="Branding & Media">Branding & Media</option>
                    <option value="EdTech LMS">EdTech Platform</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                    Estimated Deal Value (₹)
                  </label>
                  <input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full h-10 px-3.5 bg-[#F8F9FB] border border-[#CBD5E1] rounded-xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#5B4BDB]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-[#CBD5E1] hover:bg-[#F8F9FB] text-[#64748B] font-semibold text-[13px] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5B4BDB] hover:bg-[#4C3DC7] text-white font-semibold text-[13px] rounded-xl shadow-soft"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
