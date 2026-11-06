"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Plus,
  ExternalLink,
  Phone,
  Mail,
  User,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";

const DEFAULT_ACCOUNT = {
  id: "CLI-PEAK-001",
  name: "Peak Fitness",
  brand_name: "Peak Fitness",
  industry: "Fitness",
  account_owner: "Meera",
  status: "Active",
  phone: "+91 98765 43210",
  website: "peakfitness.in",
  city: "Bengaluru",
  services: [
    { name: "Website development", amount: "₹80,000", status: "In progress", progress: 65, color: "bg-[#EEF2FF] text-[#5B4BDB]" },
    { name: "SEO", amount: "₹30,000 / month", status: "Active", progress: 40, color: "bg-[#ECFDF5] text-[#059669]" },
    { name: "Social media management", amount: "₹20,000 / month", status: "Active", progress: 30, color: "bg-[#ECFDF5] text-[#059669]" },
    { name: "Custom CRM", amount: "₹1,20,000", status: "Planning", progress: 10, color: "bg-[#F0F9FF] text-[#0284C7]" },
  ],
  invoices: [
    { number: "DF-2026-0002", amount: "₹70,000", status: "Due Nov 20", isPaid: false },
    { number: "DF-2026-0001", amount: "₹90,000", status: "Paid", isPaid: true },
  ],
  billing: {
    invoiced: "₹1,60,000",
    collected: "₹90,000",
    outstanding: "₹70,000",
  },
  activities: [
    { title: "Invoice DF-2026-0002 issued", time: "2 days ago", icon: FileText },
    { title: "Deliverable sent for approval", time: "Today", icon: CheckCircle2 },
    { title: "Lead converted to account", time: "Oct 15, 2026", icon: User },
  ],
};

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const { data: apiData } = useQuery<any>({
    queryKey: ["client-360", clientId],
    queryFn: async () => {
      try {
        const res = await api.get<any>(`/clients/${clientId}`);
        return res;
      } catch (e) {
        return null;
      }
    },
  });

  const account = apiData || DEFAULT_ACCOUNT;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            {/* Navy Logo Tile */}
            <div className="h-11 w-11 rounded-xl bg-[#0F172A] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-soft">
              PF
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  ACCOUNT 360
                </span>
                <span className="text-[11px] text-[#94A3B8]">·</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669]">
                  {DEFAULT_ACCOUNT.status}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight leading-tight mt-0.5">
                {DEFAULT_ACCOUNT.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <Link
              href="/internal/projects/proj-peak-web"
              className="h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
            >
              <span>Project Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Key Fields Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6 pt-6 border-t border-[#E5E7EB]">
          <div>
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Industry
            </div>
            <div className="text-[14px] font-semibold text-[#0F172A] mt-1">
              {DEFAULT_ACCOUNT.industry}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Account owner
            </div>
            <div className="text-[14px] font-semibold text-[#0F172A] mt-1">
              {DEFAULT_ACCOUNT.account_owner}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              City
            </div>
            <div className="text-[14px] font-semibold text-[#0F172A] mt-1">
              {DEFAULT_ACCOUNT.city}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Phone
            </div>
            <div className="text-[14px] font-semibold text-[#0F172A] mt-1">
              {DEFAULT_ACCOUNT.phone}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Website
            </div>
            <a
              href={`https://${DEFAULT_ACCOUNT.website}`}
              target="_blank"
              rel="noreferrer"
              className="text-[14px] font-semibold text-[#5B4BDB] hover:underline mt-1 flex items-center space-x-1"
            >
              <span>{DEFAULT_ACCOUNT.website}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Services Purchased + Invoices */}
        <div className="lg:col-span-8 space-y-6">
          {/* Services Purchased */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E7EB]">
              <div>
                <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  CONTRACTED SERVICES
                </div>
                <h3 className="text-[16px] font-bold text-[#0F172A] tracking-tight mt-0.5">
                  Services purchased ({DEFAULT_ACCOUNT.services.length})
                </h3>
              </div>
              <Link href="/internal/services" className="text-[13px] font-semibold text-[#5B4BDB] hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-4">
              {DEFAULT_ACCOUNT.services.map((svc) => (
                <div
                  key={svc.name}
                  className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] hover:bg-white transition-all shadow-soft"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[14px] text-[#0F172A]">{svc.name}</span>
                    <span className="font-bold text-[14px] text-[#0F172A]">{svc.amount}</span>
                  </div>

                  <div className="flex items-center justify-between text-[12px] text-[#64748B] mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${svc.color}`}>
                      {svc.status}
                    </span>
                    <span>{svc.progress}% completed</span>
                  </div>

                  <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#5B4BDB] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${svc.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E7EB]">
              <div>
                <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  FINANCIAL LEDGER
                </div>
                <h3 className="text-[16px] font-bold text-[#0F172A] tracking-tight mt-0.5">
                  Invoices ({DEFAULT_ACCOUNT.invoices.length})
                </h3>
              </div>
              <Link href="/internal/invoices" className="text-[13px] font-semibold text-[#5B4BDB] hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {DEFAULT_ACCOUNT.invoices.map((inv) => (
                <div
                  key={inv.number}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] hover:bg-white transition-all shadow-soft"
                >
                  <span className="text-[#5B4BDB] font-semibold text-[13.5px]">{inv.number}</span>
                  <span className="text-[#0F172A] font-bold text-[14px]">{inv.amount}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      inv.isPaid
                        ? "bg-[#ECFDF5] text-[#059669]"
                        : "bg-[#FFFBEB] text-[#D97706]"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Billing summary + Activity */}
        <div className="lg:col-span-4 space-y-6">
          {/* Billing Summary */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
            <div className="pb-3 mb-4 border-b border-[#E5E7EB]">
              <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                COMMERCIAL OVERVIEW
              </div>
              <h3 className="text-[16px] font-bold text-[#0F172A] tracking-tight mt-0.5">
                Billing summary
              </h3>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9FB] border border-[#E5E7EB]">
                <span className="text-[13px] text-[#64748B] font-medium">Invoiced</span>
                <span className="text-[15px] font-bold text-[#0F172A]">{DEFAULT_ACCOUNT.billing.invoiced}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#ECFDF5]/50 border border-[#D1FAE5]">
                <span className="text-[13px] text-[#059669] font-medium">Collected</span>
                <span className="text-[15px] font-bold text-[#059669]">{DEFAULT_ACCOUNT.billing.collected}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFFBEB]/60 border border-[#FEF3C7]">
                <span className="text-[13px] text-[#D97706] font-medium">Outstanding</span>
                <span className="text-[15px] font-bold text-[#D97706]">{DEFAULT_ACCOUNT.billing.outstanding}</span>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
            <div className="pb-3 mb-4 border-b border-[#E5E7EB]">
              <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                AUDIT LOG
              </div>
              <h3 className="text-[16px] font-bold text-[#0F172A] tracking-tight mt-0.5">
                Activity
              </h3>
            </div>

            <div className="space-y-4">
              {DEFAULT_ACCOUNT.activities.map((act, i) => {
                const Icon = act.icon;
                return (
                  <div key={i} className="flex items-start space-x-3 text-[13px]">
                    <div className="h-7 w-7 rounded-full bg-[#EEF2FF] text-[#5B4BDB] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#0F172A]">{act.title}</div>
                      <div className="text-[11px] text-[#94A3B8]">{act.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
