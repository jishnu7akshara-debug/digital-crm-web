"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Check, ArrowRight, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";

interface ServicePurchased {
  id: string;
  name: string;
  price_text: string;
  status: "In progress" | "Active" | "Planning";
  progress: number;
}

interface InvoiceRow {
  id: string;
  number: string;
  amount_text: string;
  status: "Due Nov 20" | "Paid";
  is_paid: boolean;
}

const DEFAULT_ACCOUNT = {
  name: "Peak Fitness",
  industry: "Fitness",
  owner: "Meera",
  status: "Active",
  phone: "+91 98765 43210",
  website: "peakfitness.in",
  billing: {
    invoiced: "₹1,60,000",
    collected: "₹90,000",
    outstanding: "₹70,000",
  },
  services: [
    { id: "s-1", name: "Website development", price_text: "₹80,000", status: "In progress" as const, progress: 65 },
    { id: "s-2", name: "SEO", price_text: "₹30,000 / month", status: "Active" as const, progress: 40 },
    { id: "s-3", name: "Social media management", price_text: "₹20,000 / month", status: "Active" as const, progress: 30 },
    { id: "s-4", name: "Custom CRM", price_text: "₹1,20,000", status: "Planning" as const, progress: 10 },
  ],
  invoices: [
    { id: "inv-2", number: "DF-2026-0002", amount_text: "₹70,000", status: "Due Nov 20" as const, is_paid: false },
    { id: "inv-1", number: "DF-2026-0001", amount_text: "₹90,000", status: "Paid" as const, is_paid: true },
  ],
  activities: [
    { title: "Invoice DF-2026-0002 issued", time: "2 days ago" },
    { title: "Deliverable sent for approval", time: "3 days ago" },
    { title: "Lead converted to account", time: "Oct 28, 2026" },
  ],
};

export default function SalesforceAccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.id as string;
  const [following, setFollowing] = useState(false);

  return (
    <div className="space-y-3">
      {/* Salesforce Record Header */}
      <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-3 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tile + Object Label + Heading */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-[4px] bg-[#7F8DE1] text-white flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0">
              A
            </div>
            <div>
              <span className="text-[11px] text-[#5C5C5C] font-normal block leading-tight">Account</span>
              <h1 className="text-[18px] font-bold text-[#181818] leading-tight flex items-center space-x-2">
                <span>{DEFAULT_ACCOUNT.name}</span>
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFollowing(!following)}
              className="h-8 px-3 rounded-[4px] border border-[#DDDBDA] bg-white text-[#0176D3] text-[13px] font-medium hover:bg-[#F3F3F3] transition-colors"
            >
              {following ? "Following" : "Follow"}
            </button>
            <button
              onClick={() => alert("New Contact creation dialog")}
              className="h-8 px-3 rounded-[4px] border border-[#DDDBDA] bg-white text-[#0176D3] text-[13px] font-medium hover:bg-[#F3F3F3] transition-colors"
            >
              New Contact
            </button>
            <button
              onClick={() => router.push("/internal/projects")}
              className="h-8 px-3 rounded-[4px] bg-[#0176D3] text-white text-[13px] font-medium hover:bg-[#014486] transition-colors shadow-sm"
            >
              New Project
            </button>
          </div>
        </div>

        {/* Key Fields Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-3 pt-3 border-t border-[#F3F3F3] text-[12px]">
          <div>
            <span className="text-[#5C5C5C] block">Industry</span>
            <span className="font-semibold text-[#181818] mt-0.5 block">{DEFAULT_ACCOUNT.industry}</span>
          </div>
          <div>
            <span className="text-[#5C5C5C] block">Account owner</span>
            <span className="font-semibold text-[#181818] mt-0.5 block">{DEFAULT_ACCOUNT.owner}</span>
          </div>
          <div>
            <span className="text-[#5C5C5C] block">Status</span>
            <span className="font-semibold text-[#181818] mt-0.5 block">{DEFAULT_ACCOUNT.status}</span>
          </div>
          <div>
            <span className="text-[#5C5C5C] block">Phone</span>
            <span className="font-semibold text-[#181818] mt-0.5 block">{DEFAULT_ACCOUNT.phone}</span>
          </div>
          <div>
            <span className="text-[#5C5C5C] block">Website</span>
            <a
              href={`https://${DEFAULT_ACCOUNT.website}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#0176D3] hover:underline font-semibold mt-0.5 block truncate"
            >
              {DEFAULT_ACCOUNT.website}
            </a>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          {/* Card 1: Services purchased (4) */}
          <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-4 shadow-none">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#DDDBDA]">
              <h2 className="text-[14px] font-bold text-[#181818]">
                Services purchased ({DEFAULT_ACCOUNT.services.length})
              </h2>
              <Link href="/internal/services" className="text-[11px] text-[#0176D3] hover:underline">
                View All
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <tbody className="divide-y divide-[#F3F3F3]">
                  {DEFAULT_ACCOUNT.services.map((srv) => (
                    <tr key={srv.id} className="hover:bg-[#F3F3F3]/60">
                      <td className="py-2.5 text-[#0176D3] font-normal hover:underline cursor-pointer">
                        {srv.name}
                      </td>
                      <td className="py-2.5 font-bold text-[#181818] text-right pr-6">
                        {srv.price_text}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-[3px] text-[11px] font-medium ${
                            srv.status === "In progress"
                              ? "bg-[#FEF1D6] text-[#8A5200]"
                              : srv.status === "Active"
                              ? "bg-[#EBF7E6] text-[#2E844A]"
                              : "bg-[#F3F3F3] text-[#5C5C5C]"
                          }`}
                        >
                          {srv.status}
                        </span>
                      </td>
                      <td className="py-2.5 w-32 pl-4">
                        <div className="w-full bg-[#E5E5E5] h-2 rounded-[2px] overflow-hidden">
                          <div
                            className="bg-[#0176D3] h-2 rounded-[2px]"
                            style={{ width: `${srv.progress}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: Invoices (2) */}
          <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-4 shadow-none">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#DDDBDA]">
              <h2 className="text-[14px] font-bold text-[#181818]">
                Invoices ({DEFAULT_ACCOUNT.invoices.length})
              </h2>
              <Link href="/internal/invoices" className="text-[11px] text-[#0176D3] hover:underline">
                View All
              </Link>
            </div>

            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#DDDBDA] bg-[#FAFAFA] text-[#5C5C5C] text-[12px] font-normal">
                  <th className="py-2 px-3 font-normal">Number</th>
                  <th className="py-2 px-3 font-normal">Amount</th>
                  <th className="py-2 px-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F3F3]">
                {DEFAULT_ACCOUNT.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F3F3F3]/60">
                    <td className="py-2.5 px-3">
                      <Link href="/internal/invoices" className="text-[#0176D3] hover:underline font-normal">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#181818]">{inv.amount_text}</td>
                    <td className="py-2.5 px-3">
                      {inv.is_paid ? (
                        <span className="px-2 py-0.5 rounded-[3px] text-[11px] font-semibold bg-[#EBF7E6] text-[#2E844A]">
                          Paid
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-[3px] text-[11px] font-semibold bg-[#FEF1D6] text-[#8A5200]">
                          Due Nov 20
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1 col) */}
        <div className="space-y-3">
          {/* Card 3: Billing summary */}
          <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-4 shadow-none">
            <div className="pb-3 mb-3 border-b border-[#DDDBDA]">
              <h2 className="text-[14px] font-bold text-[#181818]">Billing summary</h2>
            </div>

            <div className="space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-[#5C5C5C]">Invoiced</span>
                <span className="font-bold text-[#181818]">{DEFAULT_ACCOUNT.billing.invoiced}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5C5C5C]">Collected</span>
                <span className="font-bold text-[#2E844A]">{DEFAULT_ACCOUNT.billing.collected}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5C5C5C]">Outstanding</span>
                <span className="font-bold text-[#BA0517]">{DEFAULT_ACCOUNT.billing.outstanding}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Activity */}
          <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-4 shadow-none">
            <div className="pb-3 mb-3 border-b border-[#DDDBDA]">
              <h2 className="text-[14px] font-bold text-[#181818]">Activity</h2>
            </div>

            <div className="space-y-3 text-[13px]">
              {DEFAULT_ACCOUNT.activities.map((act, i) => (
                <div key={i} className="flex items-start space-x-2">
                  <div className="h-2 w-2 rounded-full bg-[#0176D3] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-[#181818] leading-tight font-medium">{act.title}</p>
                    <span className="text-[11px] text-[#706E6B]">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
