"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Check, Search, LayoutGrid, List, Users, Filter, X, Building2 } from "lucide-react";

interface LeadRow {
  id: string;
  name: string;
  contact: string;
  interested_service: string;
  status: "New" | "Contacted" | "Qualified" | "Proposal" | "Negotiation";
  owner: string;
  created: string;
}

const MOCKUP_LEADS: LeadRow[] = [
  { id: "l-1", name: "Sri Venkata Traders", contact: "Ravi K", interested_service: "Website", status: "New", owner: "Meera", created: "Nov 5" },
  { id: "l-2", name: "Bloom Dental Clinic", contact: "Dr. Anita", interested_service: "SEO", status: "Contacted", owner: "Karan", created: "Nov 4" },
  { id: "l-3", name: "Nova Learning", contact: "Suresh P", interested_service: "EdTech", status: "Qualified", owner: "Meera", created: "Nov 3" },
  { id: "l-4", name: "Greenleaf Organics", contact: "Divya R", interested_service: "Social media", status: "Proposal", owner: "Karan", created: "Nov 2" },
  { id: "l-5", name: "Lakshmi Silks", contact: "Mohan T", interested_service: "E-commerce", status: "Negotiation", owner: "Meera", created: "Nov 1" },
  { id: "l-6", name: "Mehta Interiors", contact: "Rahul M", interested_service: "Branding", status: "Qualified", owner: "Karan", created: "Oct 30" },
  { id: "l-7", name: "Quick Courier", contact: "Imran S", interested_service: "CRM", status: "New", owner: "Meera", created: "Oct 29" },
  { id: "l-8", name: "Aster Tutorials", contact: "Neha G", interested_service: "EdTech", status: "Contacted", owner: "Karan", created: "Oct 28" },
];

export default function SaasLeadsPage() {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [leads, setLeads] = useState<LeadRow[]>(MOCKUP_LEADS);
  const [searchTerm, setSearchTerm] = useState("");

  // New Lead state
  const [newName, setNewName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newService, setNewService] = useState("Website");
  const [newStatus, setNewStatus] = useState<LeadRow["status"]>("New");
  const [newOwner, setNewOwner] = useState("Meera");

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

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    const newL: LeadRow = {
      id: `l-${Date.now()}`,
      name: newName,
      contact: newContact || "Contact Person",
      interested_service: newService,
      status: newStatus,
      owner: newOwner,
      created: "Today",
    };
    setLeads([newL, ...leads]);
    setIsNewModalOpen(false);
    setNewName("");
    setNewContact("");
  };

  // Modern Minimal Status Badge: Pill shape with soft tinted background and matching text
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
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              PIPELINE & SALES
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              {leads.length} Inbound Leads
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Sales Leads Management
          </h2>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Capture, qualify, and convert enterprise agency inquiries.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {/* List / Kanban View Toggle */}
          <div className="bg-[#F8F9FB] border border-[#E5E7EB] rounded-xl p-1 flex items-center space-x-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all ${
                viewMode === "list"
                  ? "bg-white text-[#0F172A] shadow-soft"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <List className="h-4 w-4" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all ${
                viewMode === "kanban"
                  ? "bg-white text-[#0F172A] shadow-soft"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Kanban</span>
            </button>
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search leads, contact, or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 bg-[#F8F9FB] border border-[#E5E7EB] rounded-xl pl-10 pr-4 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 transition-all"
          />
        </div>

        <div className="text-[13px] text-[#64748B]">
          {filtered.length} leads · Sorted by Created Date
        </div>
      </div>

      {/* View Mode: List vs Kanban */}
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
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Lead Name</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Primary Contact</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Interested Service</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Status</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Owner</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filtered.map((lead) => {
                  const isChecked = !!selectedRows[lead.id];
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-[#F8F9FB] transition-colors ${
                        isChecked ? "bg-[#EEF2FF]/40" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRow(lead.id)}
                          className="rounded border-[#CBD5E1] text-[#5B4BDB] focus:ring-[#5B4BDB]"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                        <Link href="/internal/opportunities" className="text-[#5B4BDB] hover:underline">
                          {lead.name}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-[#0F172A]">{lead.contact}</td>
                      <td className="py-3.5 px-4 text-[#64748B]">{lead.interested_service}</td>
                      <td className="py-3.5 px-4">{getStatusBadge(lead.status)}</td>
                      <td className="py-3.5 px-4 text-[#0F172A] font-medium">{lead.owner}</td>
                      <td className="py-3.5 px-4 text-[#64748B]">{lead.created}</td>
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
                      className="bg-[#F8F9FB] hover:bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-soft transition-all"
                    >
                      <div className="font-semibold text-[13.5px] text-[#0F172A] mb-1">
                        {lead.name}
                      </div>
                      <div className="text-[12px] text-[#64748B] mb-2">{lead.contact}</div>
                      <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-[11px]">
                        <span className="text-[#5B4BDB] font-medium">{lead.interested_service}</span>
                        <span className="text-[#94A3B8]">{lead.owner}</span>
                      </div>
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="h-28 border border-dashed border-[#E5E7EB] rounded-xl flex items-center justify-center text-[11px] text-[#94A3B8]">
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
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] w-full max-w-md shadow-dropdown p-6 text-[14px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="font-bold text-[16px] text-[#0F172A]">Add New Lead</h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-[#64748B] hover:text-[#0F172A]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="mt-4 space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Company / Organization Name <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Tech Solutions"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Primary Contact Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none"
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
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] bg-white focus:border-[#5B4BDB] focus:outline-none"
                  >
                    <option value="Website">Website</option>
                    <option value="SEO">SEO</option>
                    <option value="Social media">Social media</option>
                    <option value="CRM">CRM</option>
                    <option value="Branding">Branding</option>
                    <option value="EdTech">EdTech</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] bg-white focus:border-[#5B4BDB] focus:outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="h-10 px-4 border border-[#E5E7EB] rounded-xl text-[13px] text-[#64748B] hover:bg-[#F8F9FB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl text-[13px] font-semibold shadow-soft"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
