"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Search,
  ArrowRight,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Building,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { formatINRPrecise, formatDate } from "@/lib/utils";

interface LeadItem {
  id: string;
  title: string;
  company_name?: string;
  contact_name: string;
  email: string;
  phone?: string;
  source: string;
  status: string;
  estimated_value_rupees: number;
  assigned_to_name?: string;
  converted_client_id?: string;
  created_at: string;
}

interface PaginatedLeads {
  items: LeadItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [convertLeadId, setConvertLeadId] = useState<string | null>(null);
  const [convertClientCode, setConvertClientCode] = useState("");
  const [convertGstin, setConvertGstin] = useState("");

  // New Lead fields
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newValueRupees, setNewValueRupees] = useState<number>(50000);

  const { data, isLoading } = useQuery<PaginatedLeads>({
    queryKey: ["leads-list", search, statusFilter],
    queryFn: () =>
      api.get<PaginatedLeads>(
        `/leads?search=${encodeURIComponent(search)}&status_filter=${encodeURIComponent(statusFilter)}`
      ),
  });

  const createLeadMutation = useMutation({
    mutationFn: async () => {
      return api.post("/leads", {
        title: newTitle,
        company_name: newCompany,
        contact_name: newContact,
        email: newEmail,
        phone: newPhone,
        estimated_value_paise: Math.round(newValueRupees * 100),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads-list"] });
      setIsCreateOpen(false);
      setNewTitle("");
      setNewCompany("");
      setNewContact("");
      setNewEmail("");
      setNewPhone("");
    },
    onError: (err: any) => alert(err.message || "Failed to create lead."),
  });

  const convertMutation = useMutation({
    mutationFn: async () => {
      if (!convertLeadId) return;
      return api.post(`/leads/${convertLeadId}/convert`, {
        client_code: convertClientCode,
        gstin: convertGstin || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads-list"] });
      setConvertLeadId(null);
      setConvertClientCode("");
      setConvertGstin("");
      alert("Lead converted to Client successfully!");
    },
    onError: (err: any) => alert(err.message || "Failed to convert lead."),
  });

  return (
    <>
      <Header
        title="Sales Pipeline & Leads"
        subtitle="Track inquiries, opportunities, pipeline stages, and conversion to active clients"
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#77738A]" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <select
              className="text-xs rounded-md border border-[#E9E5F0] p-2 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Stages</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal_sent">Proposal Sent</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Lead
          </Button>
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader className="p-4 border-b border-[#E9E5F0]">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#77738A]">
              Pipeline Opportunities ({data?.total || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E9E5F0] bg-[#F8F8FC] text-[#77738A] font-medium">
                  <th className="py-3 px-4">Opportunity</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4 text-right">Estimated Value</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E5F0]">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#77738A]">
                      Loading pipeline leads...
                    </td>
                  </tr>
                )}
                {data?.items.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#F8F8FC]">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#1D1930]">{lead.title}</div>
                      {lead.company_name && (
                        <div className="text-[10px] text-[#77738A]">{lead.company_name}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div>{lead.contact_name}</div>
                      <div className="text-[10px] text-[#77738A]">{lead.email}</div>
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] text-[#77738A]">{lead.source}</td>
                    <td className="py-3 px-4">
                      <Badge variant={lead.status === "won" ? "success" : "default"}>
                        {lead.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#6C3BDB]">
                      {formatINRPrecise(lead.estimated_value_rupees)}
                    </td>
                    <td className="py-3 px-4 text-[#77738A]">{lead.assigned_to_name || "Unassigned"}</td>
                    <td className="py-3 px-4 text-right">
                      {lead.converted_client_id ? (
                        <Badge variant="success">CONVERTED</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => {
                            setConvertLeadId(lead.id);
                            setConvertClientCode(`CLI-${lead.contact_name.slice(0, 4).toUpperCase()}-01`);
                          }}
                        >
                          <UserCheck className="h-3 w-3 mr-1 text-[#6C3BDB]" /> Convert to Client
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Create Lead Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create New Lead"
          description="Capture new sales opportunity in pipeline."
        >
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">Opportunity Title *</label>
              <Input
                placeholder="e.g. E-Commerce Website & Social Strategy"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#1D1930] mb-1">Company Name</label>
                <Input placeholder="Apex Retail Ltd" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1D1930] mb-1">Contact Name *</label>
                <Input placeholder="Rajesh Verma" value={newContact} onChange={(e) => setNewContact(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#1D1930] mb-1">Email *</label>
                <Input type="email" placeholder="rajesh@apex.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1D1930] mb-1">Phone</label>
                <Input placeholder="+91 98000 00000" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">Estimated Value (INR)</label>
              <Input
                type="number"
                value={newValueRupees}
                onChange={(e) => setNewValueRupees(Number(e.target.value))}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createLeadMutation.mutate()}
                isLoading={createLeadMutation.isPending}
                disabled={!newTitle.trim() || !newContact.trim() || !newEmail.trim()}
              >
                Create Lead
              </Button>
            </div>
          </div>
        </Modal>

        {/* Convert to Client Modal */}
        <Modal
          isOpen={!!convertLeadId}
          onClose={() => setConvertLeadId(null)}
          title="Convert Lead to Active Client"
          description="Create client account with immutable lead history link and duplicate prevention."
        >
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">Client Code *</label>
              <Input
                placeholder="CLI-NEW-01"
                value={convertClientCode}
                onChange={(e) => setConvertClientCode(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">GSTIN (Optional)</label>
              <Input
                placeholder="27AAAAA0000A1Z5"
                value={convertGstin}
                onChange={(e) => setConvertGstin(e.target.value.toUpperCase())}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setConvertLeadId(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => convertMutation.mutate()}
                isLoading={convertMutation.isPending}
                disabled={!convertClientCode.trim()}
              >
                Confirm Conversion
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </>
  );
}

