"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Check, Search, Upload, LayoutGrid, List } from "lucide-react";
import { api } from "@/lib/api";

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

export default function SalesforceLeadsPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [leads, setLeads] = useState<LeadRow[]>(MOCKUP_LEADS);

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

  const getStatusBadge = (status: LeadRow["status"]) => {
    switch (status) {
      case "New":
        return <span className="px-2 py-0.5 rounded-[3px] text-[11px] font-semibold bg-[#EAF5FE] text-[#0176D3]">New</span>;
      case "Contacted":
        return <span className="px-2 py-0.5 rounded-[3px] text-[11px] font-semibold bg-[#FEF1D6] text-[#8A5200]">Contacted</span>;
      case "Qualified":
        return <span className="px-2 py-0.5 rounded-[3px] text-[11px] font-semibold bg-[#EBF7E6] text-[#2E844A]">Qualified</span>;
      case "Proposal":
        return <span className="px-2 py-0.5 rounded-[3px] text-[11px] font-semibold bg-[#F5F1FF] text-[#6C3BDB]">Proposal</span>;
      case "Negotiation":
        return <span className="px-2 py-0.5 rounded-[3px] text-[11px] font-semibold bg-[#FFF4E6] text-[#D97706]">Negotiation</span>;
    }
  };

  const allSelected = leads.length > 0 && leads.every((l) => selectedRows[l.id]);

  return (
    <div className="space-y-3">
      {/* Salesforce Record Header */}
      <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-3 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tile + Object Label + Heading */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-[4px] bg-[#F88962] text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0">
              L
            </div>
            <div>
              <span className="text-[11px] text-[#5C5C5C] font-normal block leading-tight">Leads</span>
              <h1 className="text-[18px] font-bold text-[#181818] leading-tight flex items-center space-x-1.5">
                <span>Recently Viewed</span>
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => alert("Excel / CSV Import template ready for leads.")}
              className="h-8 px-3 rounded-[4px] border border-[#DDDBDA] bg-white text-[#0176D3] text-[13px] font-medium hover:bg-[#F3F3F3] transition-colors"
            >
              Import
            </button>
            <button
              onClick={() => setViewMode(viewMode === "list" ? "kanban" : "list")}
              className="h-8 px-3 rounded-[4px] border border-[#DDDBDA] bg-white text-[#0176D3] text-[13px] font-medium hover:bg-[#F3F3F3] transition-colors"
            >
              {viewMode === "list" ? "Kanban" : "Table"}
            </button>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="h-8 px-3 rounded-[4px] bg-[#0176D3] text-white text-[13px] font-medium hover:bg-[#014486] transition-colors shadow-sm"
            >
              New
            </button>
          </div>
        </div>

        {/* Subtitle / Item Count line */}
        <div className="mt-3 pt-2 border-t border-[#F3F3F3] text-[12px] text-[#5C5C5C]">
          <span>{leads.length} items · Sorted by Created date · Filtered by All leads</span>
        </div>
      </div>

      {/* Main View: Table or Kanban */}
      {viewMode === "list" ? (
        <div className="bg-white border border-[#DDDBDA] rounded-[4px] shadow-none overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[#DDDBDA] bg-[#FAFAFA] text-[#5C5C5C] font-normal text-[12px]">
                <th className="py-2.5 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="h-3.5 w-3.5 rounded-[2px] border-[#DDDBDA] text-[#0176D3] focus:ring-0"
                  />
                </th>
                <th className="py-2.5 px-4 font-normal">Lead name</th>
                <th className="py-2.5 px-4 font-normal">Contact</th>
                <th className="py-2.5 px-4 font-normal">Interested service</th>
                <th className="py-2.5 px-4 font-normal">Status</th>
                <th className="py-2.5 px-4 font-normal">Owner</th>
                <th className="py-2.5 px-4 font-normal">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F3F3] text-[#181818]">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-[#F3F3F3]/60 transition-colors">
                  <td className="py-2.5 px-3">
                    <input
                      type="checkbox"
                      checked={!!selectedRows[l.id]}
                      onChange={() => toggleRow(l.id)}
                      className="h-3.5 w-3.5 rounded-[2px] border-[#DDDBDA] text-[#0176D3] focus:ring-0"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <Link
                      href={`/internal/clients?lead=${l.id}`}
                      className="text-[#0176D3] hover:underline font-normal"
                    >
                      {l.name}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4 text-[#181818]">{l.contact}</td>
                  <td className="py-2.5 px-4 text-[#5C5C5C]">{l.interested_service}</td>
                  <td className="py-2.5 px-4">{getStatusBadge(l.status)}</td>
                  <td className="py-2.5 px-4 text-[#5C5C5C]">{l.owner}</td>
                  <td className="py-2.5 px-4 text-[#5C5C5C]">{l.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban Lane View */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {(["New", "Contacted", "Qualified", "Proposal", "Negotiation"] as const).map((st) => {
            const laneLeads = leads.filter((l) => l.status === st);
            return (
              <div key={st} className="bg-[#F3F3F3] border border-[#DDDBDA] rounded-[4px] p-2.5 min-h-[400px]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DDDBDA]">
                  <span className="text-[12px] font-bold text-[#181818] uppercase tracking-wide">{st}</span>
                  <span className="h-5 w-5 rounded-full bg-white text-[#0176D3] font-bold text-[11px] flex items-center justify-center">
                    {laneLeads.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {laneLeads.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-[#DDDBDA] rounded-[4px] p-3 shadow-none hover:border-[#0176D3] transition-colors"
                    >
                      <h4 className="text-[13px] font-bold text-[#0176D3] hover:underline cursor-pointer">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-[#5C5C5C] mt-1">{item.contact}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F3F3F3] text-[11px] text-[#706E6B]">
                        <span>{item.interested_service}</span>
                        <span>{item.owner}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: New Lead */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[4px] max-w-md w-full p-5 border border-[#DDDBDA] shadow-xl">
            <h3 className="text-[16px] font-bold text-[#181818] mb-3 pb-2 border-b border-[#DDDBDA]">
              New Lead
            </h3>

            <form onSubmit={handleCreateLead} className="space-y-3 text-[13px]">
              <div>
                <label className="block text-[12px] text-[#5C5C5C] mb-1 font-medium">* Lead Name / Company</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Sri Venkata Traders"
                  className="w-full h-8 px-3 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] focus:outline-none focus:border-[#0176D3]"
                />
              </div>

              <div>
                <label className="block text-[12px] text-[#5C5C5C] mb-1 font-medium">Contact Person</label>
                <input
                  type="text"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  placeholder="e.g. Ravi K"
                  className="w-full h-8 px-3 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] focus:outline-none focus:border-[#0176D3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#5C5C5C] mb-1 font-medium">Interested Service</label>
                  <select
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="w-full h-8 px-2 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] bg-white focus:outline-none focus:border-[#0176D3]"
                  >
                    <option value="Website">Website</option>
                    <option value="SEO">SEO</option>
                    <option value="Social media">Social media</option>
                    <option value="CRM">CRM</option>
                    <option value="EdTech">EdTech</option>
                    <option value="Branding">Branding</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] text-[#5C5C5C] mb-1 font-medium">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as LeadRow["status"])}
                    className="w-full h-8 px-2 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] bg-white focus:outline-none focus:border-[#0176D3]"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] text-[#5C5C5C] mb-1 font-medium">Lead Owner</label>
                <input
                  type="text"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="w-full h-8 px-3 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] focus:outline-none focus:border-[#0176D3]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#DDDBDA]">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="h-8 px-3 rounded-[4px] border border-[#DDDBDA] text-[#5C5C5C] hover:bg-[#F3F3F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded-[4px] bg-[#0176D3] text-white font-medium hover:bg-[#014486]"
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
