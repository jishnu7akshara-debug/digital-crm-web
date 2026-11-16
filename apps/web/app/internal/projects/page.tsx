"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban, Plus, Search, ChevronRight, ArrowRight, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { PageReady } from "@/components/page-ready";

export default function ProjectsListPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: apiProjects,
    isLoading,
    error,
    refetch,
  } = useQuery<any>({
    queryKey: ["projects-list-view"],
    queryFn: async () => {
      const res = await api.get<any>("/projects?page_size=100");
      return res?.items || [];
    },
  });

  const displayProjects = (apiProjects || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    account_name: p.client_name || "Client Account",
    client_id: p.client_id,
    service: p.name?.toLowerCase().includes("seo")
      ? "SEO & Growth"
      : p.name?.toLowerCase().includes("lms")
      ? "EdTech Platform"
      : "Website Development",
    manager: p.manager_name || "Project Lead",
    stage: p.status ? p.status.replace(/_/g, " ") : "In Progress",
    due_date: p.due_date || "—",
    progress: p.progress_percent || 0,
    tasks_count: p.tasks_count || 0,
    completed_tasks: p.completed_tasks_count || 0,
  }));

  const filtered = displayProjects.filter(
    (p: any) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.account_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message={(error as any)?.message || "Failed to load projects."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageReady
        when={!isLoading}
        state={error ? "error" : displayProjects.length === 0 ? "empty" : "success"}
        dataLength={displayProjects.length}
      />

      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              DELIVERY WORKSPACES
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              {filtered.length} Active Workspaces
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Client Projects & Delivery Lifecycles
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Monitor sprint progress, review deliverables, and task completion across accounts.
          </p>
        </div>

        {filtered[0] && (
          <div className="flex items-center space-x-3 shrink-0">
            <Link
              href={`/internal/projects/${filtered[0].id}`}
              className="h-10 px-5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-2"
            >
              <span>Active Sprint Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search projects or accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 bg-[#F8F9FB] border border-[#E5E7EB] rounded-xl pl-10 pr-4 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 transition-all"
          />
        </div>

        <div className="text-[13px] text-[#64748B]">
          {filtered.length} projects · Sorted by priority
        </div>
      </div>

      {/* Projects Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Projects will appear here as client agreements are activated and projects initialized."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13.5px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8F9FB] text-[11px] text-[#94A3B8] uppercase font-bold tracking-wider">
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Project Name</th>
                  <th className="py-3 px-3 font-semibold text-[#64748B]">Account</th>
                  <th className="py-3 px-3 font-semibold text-[#64748B]">Service</th>
                  <th className="py-3 px-3 font-semibold text-[#64748B]">Stage</th>
                  <th className="py-3 px-3 font-semibold text-[#64748B]">Manager</th>
                  <th className="py-3 px-3 font-semibold text-[#64748B]">Progress</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B]">Due Date</th>
                  <th className="py-3 px-4 font-semibold text-[#64748B] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filtered.map((proj: any) => (
                  <tr
                    key={proj.id}
                    onClick={() => router.push(`/internal/projects/${proj.id}`)}
                    className="hover:bg-[#F8F9FD] transition-colors group cursor-pointer"
                    title={`Open ${proj.name} workspace`}
                  >
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/internal/projects/${proj.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#5B4BDB] hover:underline font-semibold flex items-center space-x-1.5"
                      >
                        <span>{proj.name}</span>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 text-[#5B4BDB] transition-opacity shrink-0" />
                      </Link>
                    </td>
                    <td className="py-3.5 px-3 text-[#0F172A] font-medium">
                      <Link
                        href={`/internal/clients/${proj.client_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline hover:text-[#5B4BDB]"
                      >
                        {proj.account_name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-3 text-[#64748B]">{proj.service}</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] font-semibold text-xs capitalize">
                        {proj.stage}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-[#0F172A] font-medium">{proj.manager}</td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-24 bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#5B4BDB] h-full rounded-full transition-all duration-500"
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>
                        <span className="text-[12px] font-semibold text-[#64748B]">{proj.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B]">{proj.due_date}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/internal/projects/${proj.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#F0EDFD] hover:bg-[#5B4BDB] text-[#5B4BDB] hover:text-white text-xs font-semibold transition-all shadow-xs shrink-0"
                      >
                        <span>Workspace</span>
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
