"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Download,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";

interface Contract {
  id: string;
  contract_number: string;
  title: string;
  client: string;
  service: string;
  value_rupees: number;
  start_date: string;
  end_date: string;
  status: "active" | "expiring_soon" | "pending_signature" | "renewed";
  file_name: string;
}

const INITIAL_CONTRACTS: Contract[] = [
  {
    id: "cnt-1",
    contract_number: "DF-CNT-2026-001",
    title: "Master Services Agreement & Web Portal SLA",
    client: "Sashikiran Surveyors",
    service: "Websites",
    value_rupees: 180000,
    start_date: "Jan 10, 2026",
    end_date: "Jan 09, 2027",
    status: "active",
    file_name: "MSA_Sashikiran_Surveyors_2026.pdf",
  },
  {
    id: "cnt-2",
    contract_number: "DF-CNT-2026-002",
    title: "Annual SEO & Performance Marketing Retainer",
    client: "Talenty Consulting",
    service: "Digital Marketing",
    value_rupees: 360000,
    start_date: "Feb 01, 2026",
    end_date: "Jan 31, 2027",
    status: "active",
    file_name: "Retainer_Talenty_Consulting_2026.pdf",
  },
  {
    id: "cnt-3",
    contract_number: "DF-CNT-2026-003",
    title: "Custom CRM Setup, Hosting & Dedicated Support",
    client: "KalpaTouch",
    service: "CRM / ERP",
    value_rupees: 550000,
    start_date: "Mar 15, 2026",
    end_date: "Mar 14, 2027",
    status: "active",
    file_name: "CRM_Hosting_KalpaTouch_2026.pdf",
  },
  {
    id: "cnt-4",
    contract_number: "DF-CNT-2026-004",
    title: "Brand Identity, Media Assets & IP Transfer Agreement",
    client: "Delights Gourmet",
    service: "Branding & Media",
    value_rupees: 220000,
    start_date: "Nov 01, 2026",
    end_date: "Dec 31, 2026",
    status: "pending_signature",
    file_name: "Brand_IP_Delights_Nov2026.pdf",
  },
  {
    id: "cnt-5",
    contract_number: "DF-CNT-2026-005",
    title: "Quarterly E-Commerce Growth & Maintenance",
    client: "Aroma Dew",
    service: "Websites",
    value_rupees: 120000,
    start_date: "Dec 01, 2025",
    end_date: "Nov 30, 2026",
    status: "expiring_soon",
    file_name: "AromaDew_Ecom_Maintenance.pdf",
  },
];

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newContract, setNewContract] = useState({
    title: "",
    client: "",
    service: "Websites",
    value_rupees: "",
    start_date: "2026-11-01",
    end_date: "2027-10-31",
  });

  const handleAddContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContract.title || !newContract.client) return;

    const c: Contract = {
      id: `cnt-${Date.now()}`,
      contract_number: `DF-CNT-2026-00${contracts.length + 1}`,
      title: newContract.title,
      client: newContract.client,
      service: newContract.service,
      value_rupees: Number(newContract.value_rupees) || 150000,
      start_date: newContract.start_date,
      end_date: newContract.end_date,
      status: "active",
      file_name: `${newContract.client.replace(/\s+/g, "_")}_Agreement.pdf`,
    };

    setContracts([c, ...contracts]);
    setIsModalOpen(false);
    setNewContract({
      title: "",
      client: "",
      service: "Websites",
      value_rupees: "",
      start_date: "2026-11-01",
      end_date: "2027-10-31",
    });
  };

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contract_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Contract["status"]) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center space-x-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Active</span>
          </span>
        );
      case "expiring_soon":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 flex items-center space-x-1">
            <AlertCircle className="h-3 w-3" />
            <span>Expiring Soon</span>
          </span>
        );
      case "pending_signature":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-[#6437EA] border border-purple-200 flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Pending Signature</span>
          </span>
        );
      case "renewed":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 flex items-center space-x-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Renewed</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F8FC]">
      <Header />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-[#77738A] mb-1">
              <Link href="/internal/dashboard" className="hover:text-[#6437EA]">Dashboard</Link>
              <span>/</span>
              <span className="text-[#1D1930] font-medium">Contracts & Docs</span>
            </div>
            <h1 className="text-2xl font-black text-[#1D1930] tracking-tight flex items-center space-x-3">
              <span>Contracts & Agreements</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EFEBFC] text-[#6437EA]">
                {contracts.length} Documents
              </span>
            </h1>
            <p className="text-xs text-[#77738A] mt-1">
              Manage client agreements, MSAs, NDAs, renewals, and legal documentation.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#6437EA] hover:bg-[#5528DA] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Contract</span>
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#EBE8F3] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#9D95B5]" />
            <input
              type="text"
              placeholder="Search contracts or clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl pl-10 pr-4 py-2 text-xs text-[#1D1930] placeholder:text-[#9D95B5] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            {[
              { key: "all", label: "All Documents" },
              { key: "active", label: "Active" },
              { key: "expiring_soon", label: "Expiring Soon" },
              { key: "pending_signature", label: "Pending Signature" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === tab.key
                    ? "bg-[#6437EA] text-white"
                    : "bg-[#F6F5FA] text-[#77738A] hover:text-[#1D1930]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contracts Table */}
        <div className="bg-white rounded-2xl border border-[#EBE8F3] shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9FD] border-b border-[#ECE9F4] text-[#77738A] font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-6">Contract ID & Title</th>
                <th className="py-3.5 px-6">Client</th>
                <th className="py-3.5 px-6">Service</th>
                <th className="py-3.5 px-6">Value (₹)</th>
                <th className="py-3.5 px-6">Validity Period</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDF7] text-[#1D1930]">
              {filteredContracts.map((c) => (
                <tr key={c.id} className="hover:bg-[#FAF9FD] transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-[#EFEBFC] flex items-center justify-center text-[#6437EA]">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-[#1D1930] block">{c.title}</span>
                        <span className="text-[10px] text-[#77738A] font-mono">{c.contract_number}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-semibold">{c.client}</td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F6F5FA] text-[#6437EA]">
                      {c.service}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-bold">₹{c.value_rupees.toLocaleString("en-IN")}</td>
                  <td className="py-4 px-6 text-[11px] text-[#77738A]">
                    {c.start_date} – {c.end_date}
                  </td>
                  <td className="py-4 px-6">{getStatusBadge(c.status)}</td>
                  <td className="py-4 px-6 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => alert(`Downloading signed contract: ${c.file_name}`)}
                      className="text-xs text-[#6437EA] hover:bg-[#EFEBFC] px-3 py-1 rounded-lg flex items-center space-x-1.5 ml-auto"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal to Create Contract */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#EBE8F3]">
            <h3 className="text-base font-bold text-[#1D1930] mb-1">Create New Contract</h3>
            <p className="text-xs text-[#77738A] mb-4">Draft a legal service agreement or NDA.</p>

            <form onSubmit={handleAddContract} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#1D1930] mb-1">Contract Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Services Agreement & SLA"
                  value={newContract.title}
                  onChange={(e) => setNewContract({ ...newContract, title: e.target.value })}
                  className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl px-3.5 py-2 text-xs text-[#1D1930] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1D1930] mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sashikiran Surveyors"
                  value={newContract.client}
                  onChange={(e) => setNewContract({ ...newContract, client: e.target.value })}
                  className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl px-3.5 py-2 text-xs text-[#1D1930] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#1D1930] mb-1">Service Type</label>
                  <select
                    value={newContract.service}
                    onChange={(e) => setNewContract({ ...newContract, service: e.target.value })}
                    className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl px-3 py-2 text-xs text-[#1D1930] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
                  >
                    <option value="Websites">Websites</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="CRM / ERP">CRM / ERP</option>
                    <option value="Branding & Media">Branding & Media</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1D1930] mb-1">Annual Value (₹)</label>
                  <input
                    type="number"
                    placeholder="250000"
                    value={newContract.value_rupees}
                    onChange={(e) => setNewContract({ ...newContract, value_rupees: e.target.value })}
                    className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl px-3 py-2 text-xs text-[#1D1930] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#1D1930] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newContract.start_date}
                    onChange={(e) => setNewContract({ ...newContract, start_date: e.target.value })}
                    className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl px-3 py-2 text-xs text-[#1D1930] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1D1930] mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newContract.end_date}
                    onChange={(e) => setNewContract({ ...newContract, end_date: e.target.value })}
                    className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl px-3 py-2 text-xs text-[#1D1930] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-[#F0EDF7]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs px-4 py-2 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#6437EA] hover:bg-[#5528DA] text-white text-xs font-semibold px-4 py-2 rounded-xl"
                >
                  Issue Contract
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
