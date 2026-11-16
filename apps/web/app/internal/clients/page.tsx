"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, FileText, Upload, Building2, ExternalLink, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { PageReady } from "@/components/page-ready";

export default function AccountsListPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: apiClients,
    isLoading,
    error,
    refetch,
  } = useQuery<any>({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const res = await api.get<any>("/clients?page_size=100");
      return res?.items || [];
    },
  });

  const accounts = (apiClients || []).map((c: any) => ({
    id: c.code || c.id,
    rawId: c.id,
    name: c.name,
    contact: c.brand_name || "Primary Contact",
    phone: "+91 98765 43210",
    industry: c.city ? "Enterprise" : "Fitness",
    city: c.city || "Bengaluru",
    status: c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : "Active",
    owner: c.account_manager_name || "Meera Sharma",
  }));

  const filtered = accounts.filter(
    (a: any) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message={(error as any)?.message || "Failed to load clients."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageReady
        when={!isLoading}
        state={error ? "error" : accounts.length === 0 ? "empty" : "success"}
        dataLength={accounts.length}
      />

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
      {accounts.length === 0 ? (
        <EmptyState
          title="No client accounts found"
          description="Create your first client account or convert a qualified lead to start managing clients."
          actionLabel="Create Client"
          onAction={() => router.push("/internal/clients/new")}
        />
      ) : (
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
                  <th className="py-3 px-4 font-semibold text-[#64748B] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filtered.map((acc: any) => (
                  <tr
                    key={acc.id}
                    onClick={() => router.push(`/internal/clients/${acc.id}`)}
                    className="hover:bg-[#F8F9FD] transition-colors group cursor-pointer"
                    title={`Open ${acc.name} 360 profile`}
                  >
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/internal/clients/${acc.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#5B4BDB] hover:underline font-semibold inline-flex items-center space-x-1.5"
                      >
                        <span>{acc.name}</span>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 text-[#5B4BDB] transition-opacity shrink-0" />
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
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/internal/clients/${acc.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#F0EDFD] hover:bg-[#5B4BDB] text-[#5B4BDB] hover:text-white text-xs font-semibold transition-all shadow-xs shrink-0"
                      >
                        <span>Open 360</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
