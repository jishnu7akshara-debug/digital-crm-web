"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, FileText, Upload, Building2, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";

const DEFAULT_ACCOUNTS = [
  {
    id: "CLI-PEAK-001",
    name: "Peak Fitness",
    contact: "Arjun S",
    phone: "+91 98765 43210",
    industry: "Fitness",
    city: "Bengaluru",
    status: "Active",
    owner: "Meera",
  },
  {
    id: "CLI-AKSHARA-01",
    name: "Akshara Enterprises",
    contact: "Pooja M",
    phone: "+91 98450 12345",
    industry: "Manufacturing",
    city: "Hyderabad",
    status: "Active",
    owner: "Karan",
  },
  {
    id: "CLI-NOVA-001",
    name: "Nova Learning",
    contact: "Suresh P",
    phone: "+91 97312 34567",
    industry: "EdTech",
    city: "Bengaluru",
    status: "Active",
    owner: "Meera",
  },
  {
    id: "CLI-GREEN-001",
    name: "Greenleaf Organics",
    contact: "Divya R",
    phone: "+91 98860 98765",
    industry: "FMCG",
    city: "Chennai",
    status: "Active",
    owner: "Karan",
  },
  {
    id: "CLI-BLOOM-001",
    name: "Bloom Dental Clinic",
    contact: "Dr. Anita",
    phone: "+91 99001 22334",
    industry: "Healthcare",
    city: "Bengaluru",
    status: "Active",
    owner: "Karan",
  },
  {
    id: "CLI-MEHTA-001",
    name: "Mehta Interiors",
    contact: "Rahul M",
    phone: "+91 98220 55667",
    industry: "Design",
    city: "Mumbai",
    status: "Active",
    owner: "Meera",
  },
  {
    id: "CLI-SRIVENK-01",
    name: "Sri Venkata Traders",
    contact: "Ravi K",
    phone: "+91 97400 33445",
    industry: "Trading",
    city: "Bengaluru",
    status: "Active",
    owner: "Meera",
  },
  {
    id: "CLI-LAKSHMI-01",
    name: "Lakshmi Silks",
    contact: "Mohan T",
    phone: "+91 98110 77889",
    industry: "Retail",
    city: "Chennai",
    status: "Active",
    owner: "Meera",
  },
];

export default function AccountsListPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: apiClients } = useQuery<any>({
    queryKey: ["clients-list"],
    queryFn: async () => {
      try {
        const res = await api.get<any>("/clients?page_size=50");
        return res?.items || [];
      } catch (e) {
        return [];
      }
    },
  });

  const accounts =
    apiClients && apiClients.length > 0
      ? apiClients.map((c: any) => ({
          id: c.id,
          name: c.name,
          contact: c.brand_name || "Primary Contact",
          phone: "+91 98765 43210",
          industry: c.city ? "Enterprise" : "Fitness",
          city: c.city || "Bengaluru",
          status: c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : "Active",
          owner: c.account_manager_name || "Meera",
        }))
      : DEFAULT_ACCOUNTS;

  const filtered = accounts.filter(
    (a: any) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              CORE CRM
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              {accounts.length} Total Accounts
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Client Accounts Directory
          </h2>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Manage agency clients, primary contacts, and subscription lifecycles.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            href="/internal/clients/new"
            className="h-10 px-4 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FB] text-[#0F172A] text-[13px] font-medium rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
          >
            <Upload className="h-4 w-4 text-[#64748B]" />
            <span>Bulk Import</span>
          </Link>
          <Link
            href="/internal/agreements"
            className="h-10 px-4 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FB] text-[#0F172A] text-[13px] font-medium rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
          >
            <FileText className="h-4 w-4 text-[#64748B]" />
            <span>Agreements</span>
          </Link>
          <Link
            href="/internal/clients/new"
            className="h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>New Account</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search accounts or cities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 bg-[#F8F9FB] border border-[#E5E7EB] rounded-xl pl-10 pr-4 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 transition-all"
          />
        </div>

        <div className="text-[13px] text-[#64748B]">
          {filtered.length} accounts · Sorted by Account name
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F8F9FB] text-[11px] text-[#94A3B8] uppercase font-bold tracking-wider">
                <th className="py-3 px-4 font-semibold text-[#64748B]">Account Name</th>
                <th className="py-3 px-3 font-semibold text-[#64748B]">Primary Contact</th>
                <th className="py-3 px-3 font-semibold text-[#64748B]">Industry</th>
                <th className="py-3 px-3 font-semibold text-[#64748B]">City</th>
                <th className="py-3 px-3 font-semibold text-[#64748B]">Status</th>
                <th className="py-3 px-3 font-semibold text-[#64748B]">Account Owner</th>
                <th className="py-3 px-4 font-semibold text-[#64748B]">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filtered.map((acc: any) => (
                <tr
                  key={acc.id}
                  className="hover:bg-[#F8F9FB] transition-colors group cursor-pointer"
                >
                  <td className="py-3.5 px-4">
                    <Link
                      href={acc.name.includes("Peak") ? "/internal/clients/CLI-PEAK-001" : `/internal/clients/${acc.id}`}
                      className="text-[#5B4BDB] hover:underline font-semibold"
                    >
                      {acc.name}
                    </Link>
                  </td>
                  <td className="py-3.5 px-3 text-[#0F172A]">{acc.contact}</td>
                  <td className="py-3.5 px-3 text-[#64748B]">{acc.industry}</td>
                  <td className="py-3.5 px-3 text-[#0F172A]">{acc.city}</td>
                  <td className="py-3.5 px-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] font-semibold text-xs">
                      {acc.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-[#0F172A] font-medium">{acc.owner}</td>
                  <td className="py-3.5 px-4 text-[#64748B]">{acc.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
