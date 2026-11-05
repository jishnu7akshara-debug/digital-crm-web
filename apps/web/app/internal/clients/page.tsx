"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  FolderKanban,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { formatINRPrecise } from "@/lib/utils";

interface ClientSummary {
  id: string;
  name: string;
  brand_name?: string;
  code: string;
  status: string;
  gstin?: string;
  city?: string;
  state?: string;
  account_manager_name?: string;
  active_services_count: number;
  active_projects_count: number;
  total_invoiced_rupees: number;
  outstanding_rupees: number;
}

interface PaginatedClients {
  items: ClientSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function ClientsListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Client Form state
  const [newName, setNewName] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newGstin, setNewGstin] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

  const { data, isLoading, error } = useQuery<PaginatedClients>({
    queryKey: ["clients-list", search],
    queryFn: () => api.get<PaginatedClients>(`/clients?search=${encodeURIComponent(search)}`),
  });

  const createClientMutation = useMutation({
    mutationFn: async () => {
      return api.post("/clients", {
        name: newName,
        brand_name: newBrand,
        code: newCode,
        gstin: newGstin,
        city: newCity,
        state: newState,
        primary_contact_name: newContactName,
        primary_contact_email: newContactEmail,
        primary_contact_phone: newContactPhone,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients-list"] });
      setIsCreateOpen(false);
      // Reset form
      setNewName("");
      setNewBrand("");
      setNewCode("");
      setNewGstin("");
      setNewCity("");
      setNewState("");
      setNewContactName("");
      setNewContactEmail("");
      setNewContactPhone("");
    },
    onError: (err: any) => {
      alert(err.message || "Failed to register client.");
    },
  });

  return (
    <>
      <Header
        title="Client Accounts"
        subtitle="Manage client organizations, service subscriptions, projects, and invoices"
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#77738A]" />
            <Input
              placeholder="Search by client name, code, GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Register Client
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">Unable to load clients. Verify authorization permissions.</span>
          </div>
        )}

        {/* Clients Table Card */}
        <Card>
          <CardHeader className="p-4 border-b border-[#E9E5F0] flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#77738A]">
              All Clients ({data?.total || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E9E5F0] bg-[#F8F8FC] text-[#77738A] font-medium">
                  <th className="py-3 px-4">Client Name / Code</th>
                  <th className="py-3 px-4">GSTIN & Location</th>
                  <th className="py-3 px-4">Account Manager</th>
                  <th className="py-3 px-4 text-center">Services</th>
                  <th className="py-3 px-4 text-center">Projects</th>
                  <th className="py-3 px-4 text-right">Invoiced (INR)</th>
                  <th className="py-3 px-4 text-right">Outstanding (INR)</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E5F0]">
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#77738A]">
                      Loading client accounts...
                    </td>
                  </tr>
                )}

                {data?.items.map((client) => (
                  <tr key={client.id} className="hover:bg-[#F8F8FC] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#1D1930]">{client.name}</div>
                      <div className="text-[10px] text-[#77738A] font-mono mt-0.5">
                        {client.code} {client.brand_name && `• ${client.brand_name}`}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-[11px] text-[#1D1930]">{client.gstin || "—"}</div>
                      <div className="text-[10px] text-[#77738A]">
                        {client.city ? `${client.city}, ${client.state}` : "India"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#77738A]">{client.account_manager_name || "Unassigned"}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="default" className="text-[11px]">
                        {client.active_services_count} active
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="secondary" className="text-[11px]">
                        {client.active_projects_count} projects
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-[#1D1930]">
                      {formatINRPrecise(client.total_invoiced_rupees)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-600">
                      {formatINRPrecise(client.outstanding_rupees)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/internal/clients/${client.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          Client 360 <ExternalLink className="h-3 w-3 ml-1 text-[#6C3BDB]" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Register Client Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Register Client Company"
          description="Create client company profile and primary contact."
        >
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#1D1930] mb-1">Company Legal Name *</label>
                <Input
                  placeholder="e.g. Acme Corp India Ltd"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1D1930] mb-1">Brand Name</label>
                <Input
                  placeholder="e.g. Acme"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#1D1930] mb-1">Unique Client Code *</label>
                <Input
                  placeholder="e.g. CLI-ACME-01"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1D1930] mb-1">GSTIN</label>
                <Input
                  placeholder="27AAACA0000A1Z5"
                  value={newGstin}
                  onChange={(e) => setNewGstin(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#1D1930] mb-1">City</label>
                <Input placeholder="Mumbai" value={newCity} onChange={(e) => setNewCity(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1D1930] mb-1">State</label>
                <Input placeholder="Maharashtra" value={newState} onChange={(e) => setNewState(e.target.value)} />
              </div>
            </div>

            <div className="pt-2 border-t border-[#E9E5F0]">
              <h4 className="text-xs font-semibold text-[#1D1930] mb-2">Primary Contact Details</h4>
              <div className="space-y-2">
                <Input
                  placeholder="Contact Name (e.g. Rohan Sharma)"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="Contact Email (e.g. rohan@acme.com)"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                />
                <Input
                  placeholder="Phone Number (e.g. +91 98000 12345)"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createClientMutation.mutate()}
                isLoading={createClientMutation.isPending}
                disabled={!newName.trim() || !newCode.trim() || !newContactName.trim() || !newContactEmail.trim()}
              >
                Register Client
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </>
  );
}
