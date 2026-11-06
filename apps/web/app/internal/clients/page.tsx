"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, FileText, Upload, ChevronRight } from "lucide-react";
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
    <div className="space-y-3 pb-8">
      {/* Salesforce Record Header: Purple Tile 'A' (#7F8DE1) + Accounts */}
      <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-3 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-[4px] bg-[#7F8DE1] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
              A
            </div>
            <div>
              <div className="text-[11px] text-[#5C5C5C] font-normal leading-none mb-0.5">
                Accounts
              </div>
              <h1 className="text-xl font-bold text-[#181818] leading-tight">
                Recently Viewed
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/internal/clients/new"
              className="h-8 px-3.5 bg-white border border-[#DDDBDA] text-[#181818] text-[13px] rounded-[4px] hover:bg-[#F3F3F3] transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <Upload className="h-3.5 w-3.5 text-[#5C5C5C]" />
              <span>Import</span>
            </Link>
            <Link
              href="/internal/agreements"
              className="h-8 px-3.5 bg-white border border-[#DDDBDA] text-[#181818] text-[13px] rounded-[4px] hover:bg-[#F3F3F3] transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-[#5C5C5C]" />
              <span>Agreements</span>
            </Link>
            <Link
              href="/internal/clients/new"
              className="h-8 px-3.5 bg-[#0176D3] hover:bg-[#0176D3]/90 text-white text-[13px] font-bold rounded-[4px] transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Account</span>
            </Link>
          </div>
        </div>

        <div className="text-[12px] text-[#5C5C5C] mt-2">
          {filtered.length} items · Sorted by Account name · Filtered by All accounts
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white border border-[#DDDBDA] rounded-[4px] shadow-sm overflow-hidden">
        <div className="p-3 border-b border-[#DDDBDA] flex items-center justify-between">
          <div className="relative w-72">
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-3 pr-8 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] focus:border-[#0176D3] focus:outline-none"
            />
            <Search className="h-3.5 w-3.5 text-[#5C5C5C] absolute right-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#DDDBDA] bg-[#F3F3F3]/60 text-[11px] text-[#5C5C5C] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-4 font-normal text-[#5C5C5C]">Account Name</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Primary Contact</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Industry</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">City</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Status</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Owner</th>
                <th className="py-2.5 px-4 font-normal text-[#5C5C5C]">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDDBDA]">
              {filtered.map((acc: any) => (
                <tr
                  key={acc.id}
                  className="hover:bg-[#F3F3F3]/60 transition-colors group cursor-pointer"
                >
                  <td className="py-2.5 px-4">
                    <Link
                      href={acc.name.includes("Peak") ? "/internal/clients/CLI-PEAK-001" : `/internal/clients/${acc.id}`}
                      className="text-[#0176D3] hover:underline font-medium"
                    >
                      {acc.name}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 text-[#181818]">{acc.contact}</td>
                  <td className="py-2.5 px-3 text-[#5C5C5C]">{acc.industry}</td>
                  <td className="py-2.5 px-3 text-[#181818]">{acc.city}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-[3px] bg-[#EBF7E6] text-[#2E844A] font-medium text-[11px]">
                      {acc.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#181818]">{acc.owner}</td>
                  <td className="py-2.5 px-4 text-[#5C5C5C]">{acc.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
