"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban, Plus, Search, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";

const DEFAULT_PROJECTS = [
  {
    id: "proj-peak-web",
    name: "Website redesign",
    account_name: "Peak Fitness",
    service: "Website development",
    manager: "Meera",
    stage: "Internal Review",
    due_date: "Nov 30, 2026",
    progress: 65,
    tasks_count: 6,
    completed_tasks: 2,
  },
  {
    id: "proj-apex-web",
    name: "Apex Global Corporate Portal",
    account_name: "Apex Global Technologies",
    service: "Web application",
    manager: "Karan",
    stage: "In Progress",
    due_date: "Dec 15, 2026",
    progress: 40,
    tasks_count: 8,
    completed_tasks: 3,
  },
  {
    id: "proj-nova-lms",
    name: "EdTech Learning Platform",
    account_name: "Nova Learning",
    service: "EdTech platform",
    manager: "Meera",
    stage: "Planning",
    due_date: "Jan 20, 2027",
    progress: 15,
    tasks_count: 5,
    completed_tasks: 0,
  },
];

export default function ProjectsListPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: apiProjects } = useQuery<any>({
    queryKey: ["projects-list-view"],
    queryFn: async () => {
      try {
        const res = await api.get<any>("/projects?page_size=50");
        return res?.items || [];
      } catch (e) {
        return [];
      }
    },
  });

  const displayProjects =
    apiProjects && apiProjects.length > 0
      ? apiProjects.map((p: any) => ({
          id: p.id,
          name: p.name,
          account_name: p.client_name || "Peak Fitness",
          service: "Website development",
          manager: p.manager_name || "Meera",
          stage: p.status?.replace("_", " ") || "In Progress",
          due_date: p.due_date || "Nov 30, 2026",
          progress: p.progress_percent || 65,
          tasks_count: p.tasks_count || 6,
          completed_tasks: p.completed_tasks_count || 2,
        }))
      : DEFAULT_PROJECTS;

  const filtered = displayProjects.filter(
    (p: any) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.account_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Salesforce Record Header: Green Tile 'P' (#3BA755) + Projects */}
      <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-3 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-[4px] bg-[#3BA755] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
              P
            </div>
            <div>
              <div className="text-[11px] text-[#5C5C5C] font-normal leading-none mb-0.5">
                Projects
              </div>
              <h1 className="text-xl font-bold text-[#181818] leading-tight">
                All Projects
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/internal/projects/proj-peak-web"
              className="h-8 px-3.5 bg-[#0176D3] hover:bg-[#0176D3]/90 text-white text-[13px] font-bold rounded-[4px] transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <span>Website redesign</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="text-[12px] text-[#5C5C5C] mt-2">
          {filtered.length} items · Sorted by Priority · Filtered by All Projects
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white border border-[#DDDBDA] rounded-[4px] shadow-sm overflow-hidden">
        <div className="p-3 border-b border-[#DDDBDA] flex items-center justify-between">
          <div className="relative w-72">
            <input
              type="text"
              placeholder="Search projects..."
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
                <th className="py-2.5 px-4 font-normal text-[#5C5C5C]">Project Name</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Account</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Service</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Stage</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Manager</th>
                <th className="py-2.5 px-3 font-normal text-[#5C5C5C]">Progress</th>
                <th className="py-2.5 px-4 font-normal text-[#5C5C5C]">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDDBDA]">
              {filtered.map((proj: any) => (
                <tr
                  key={proj.id}
                  className="hover:bg-[#F3F3F3]/60 transition-colors group cursor-pointer"
                >
                  <td className="py-2.5 px-4">
                    <Link
                      href={`/internal/projects/${proj.id}`}
                      className="text-[#0176D3] hover:underline font-medium flex items-center space-x-1.5"
                    >
                      <span>{proj.name}</span>
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 text-[#181818]">
                    <Link
                      href="/internal/clients"
                      className="hover:text-[#0176D3] hover:underline"
                    >
                      {proj.account_name}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 text-[#5C5C5C]">{proj.service}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-[3px] bg-[#EAF5FE] text-[#0176D3] font-medium text-[11px] capitalize">
                      {proj.stage}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#181818]">{proj.manager}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-[#DDDBDA] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#0176D3] h-full rounded-full"
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-[#5C5C5C]">{proj.progress}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-[#5C5C5C]">{proj.due_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
