"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, FileText, Download, CheckCircle2, CreditCard } from "lucide-react";
import { api } from "@/lib/api";

const DEFAULT_INVOICES = [
  {
    id: "inv-2",
    invoice_number: "DF-2026-0002",
    client_name: "Peak Fitness",
    issue_date: "Nov 1, 2026",
    due_date: "Nov 20, 2026",
    status: "Due Nov 20",
    total_rupees: 70000,
    balance_rupees: 70000,
    isPaid: false,
  },
  {
    id: "inv-1",
    invoice_number: "DF-2026-0001",
    client_name: "Peak Fitness",
    issue_date: "Oct 5, 2026",
    due_date: "Oct 25, 2026",
    status: "Paid",
    total_rupees: 90000,
    balance_rupees: 0,
    isPaid: true,
  },
  {
    id: "inv-3",
    invoice_number: "DF-2026-0003",
    client_name: "Akshara Enterprises",
    issue_date: "Oct 22, 2026",
    due_date: "Nov 15, 2026",
    status: "Due Nov 15",
    total_rupees: 120000,
    balance_rupees: 120000,
    isPaid: false,
  },
  {
    id: "inv-4",
    invoice_number: "DF-2026-0004",
    client_name: "Nova Learning",
    issue_date: "Oct 18, 2026",
    due_date: "Nov 10, 2026",
    status: "Paid",
    total_rupees: 240000,
    balance_rupees: 0,
    isPaid: true,
  },
];

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: apiInvoices } = useQuery<any>({
    queryKey: ["invoices-list"],
    queryFn: async () => {
      try {
        const res = await api.get<any>("/invoices?page_size=50");
        return res?.items || [];
      } catch (e) {
        return [];
      }
    },
  });

  const invoices =
    apiInvoices && apiInvoices.length > 0
      ? apiInvoices.map((inv: any) => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          client_name: inv.client_name || "Peak Fitness",
          issue_date: inv.issue_date,
          due_date: inv.due_date,
          status: inv.status === "paid" ? "Paid" : `Due ${inv.due_date}`,
          total_rupees: inv.total_rupees || 70000,
          balance_rupees: inv.balance_rupees || 0,
          isPaid: inv.status === "paid" || inv.balance_rupees === 0,
        }))
      : DEFAULT_INVOICES;

  const filtered = invoices.filter(
    (inv: any) =>
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-3 pb-8">
      {/* Salesforce Record Header: Blue Tile 'I' (#0176D3) + Invoices */}
      <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-3 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-[4px] bg-[#0176D3] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
              I
            </div>
            <div>
              <div className="text-[11px] text-[#5C5C5C] font-normal leading-none mb-0.5">
                Finance
              </div>
              <h1 className="text-xl font-bold text-[#181818] leading-tight">
                Invoices
              </h1>
            </div>
          </div>
        </div>

        <div className="text-[12px] text-[#5C5C5C] mt-2">
          {filtered.length} items · Sorted by Issue Date · Filtered by All Invoices
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-[#DDDBDA] rounded-[4px] shadow-sm overflow-hidden">
        <div className="p-3 border-b border-[#DDDBDA] flex items-center justify-between">
          <div className="relative w-72">
            <input
              type="text"
              placeholder="Search invoices or clients..."
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
                <th className="py-2.5 px-4 font-normal text-[#5C5C5C]">Invoice Number</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Account</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Amount</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Balance Due</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Issue Date</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDDBDA]">
              {filtered.map((inv: any) => (
                <tr
                  key={inv.id}
                  className="hover:bg-[#F3F3F3]/60 transition-colors group cursor-pointer"
                >
                  <td className="py-2.5 px-4 font-medium text-[#0176D3]">
                    {inv.invoice_number}
                  </td>
                  <td className="py-2.5 px-3 text-[#181818]">
                    <Link href="/internal/clients" className="hover:underline">
                      {inv.client_name}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-[#181818]">
                    ₹{Number(inv.total_rupees).toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 px-3 text-[#5C5C5C]">
                    ₹{Number(inv.balance_rupees).toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 px-3 text-[#5C5C5C]">{inv.issue_date}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-[3px] text-[11px] font-medium ${
                        inv.isPaid
                          ? "bg-[#EBF7E6] text-[#2E844A]"
                          : "bg-[#FEF1D6] text-[#8A5200]"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
