"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FolderKanban,
  Plus,
  Search,
  ExternalLink,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface ProjectSummary {
  id: string;
  name: string;
  code: string;
  client_id: string;
  client_name: string;
  status: string;
  priority: string;
  progress_percent: number;
  due_date?: string;
  manager_name?: string;
  tasks_count: number;
  completed_tasks_count: number;
}

interface PaginatedProjects {
  items: ProjectSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function ProjectsListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create Project Form
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  const { data: clients } = useQuery<any>({
    queryKey: ["clients-dropdown"],
    queryFn: () => api.get<any>("/clients?page_size=100"),
    enabled: isCreateOpen,
  });

  const { data, isLoading, error } = useQuery<PaginatedProjects>({
    queryKey: ["projects-list", search, statusFilter],
    queryFn: () =>
      api.get<PaginatedProjects>(
        `/projects?search=${encodeURIComponent(search)}&status_filter=${encodeURIComponent(statusFilter)}`
      ),
  });

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      return api.post("/projects", {
        name: newName,
        code: newCode,
        client_id: newClientId,
        due_date: newDueDate || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects-list"] });
      setIsCreateOpen(false);
      setNewName("");
      setNewCode("");
      setNewClientId("");
      setNewDueDate("");
    },
    onError: (err: any) => {
      alert(err.message || "Failed to create project.");
    },
  });

  return (
    <>
      <Header
        title="Project Workspaces"
        subtitle="Track delivery lifecycles, milestones, tasks, and client review approvals"
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#77738A]" />
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <select
              className="text-xs rounded-md border border-[#E9E5F0] p-2 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="internal_review">Internal Review</option>
              <option value="client_review">Client Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> New Project
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">Unable to load projects.</span>
          </div>
        )}

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading && (
            <div className="col-span-3 text-center py-12 text-[#77738A] text-xs">
              Loading project workspaces...
            </div>
          )}

          {data?.items.map((project) => (
            <Card key={project.id} className="hover:border-[#6C3BDB] transition-all flex flex-col justify-between">
              <CardContent className="p-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-medium text-[#77738A]">{project.code}</span>
                    <Badge variant={project.status === "completed" ? "success" : "default"}>
                      {project.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-bold text-[#1D1930] mt-1 line-clamp-1">{project.name}</h3>
                  <p className="text-xs text-[#77738A] mt-0.5">{project.client_name}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-[#77738A] mb-1">
                    <span>Progress</span>
                    <span className="font-semibold text-[#1D1930]">{project.progress_percent}%</span>
                  </div>
                  <div className="w-full bg-[#F3F1F8] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#6C3BDB] h-1.5 rounded-full"
                      style={{ width: `${project.progress_percent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E9E5F0] flex items-center justify-between text-[11px] text-[#77738A]">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {project.due_date ? formatDate(project.due_date) : "No due date"}
                  </span>
                  <span>
                    {project.completed_tasks_count}/{project.tasks_count} tasks
                  </span>
                </div>

                <Link href={`/internal/projects/${project.id}`} className="block">
                  <Button variant="secondary" size="sm" className="w-full text-xs font-medium">
                    Open Project Dashboard <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Project Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create New Project"
          description="Initialize a project workspace for an active client."
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">Client *</label>
              <select
                className="w-full text-xs rounded-md border border-[#E9E5F0] p-2 bg-white"
                value={newClientId}
                onChange={(e) => setNewClientId(e.target.value)}
              >
                <option value="">-- Select Client --</option>
                {clients?.items?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">Project Name *</label>
              <Input
                placeholder="e.g. Next.js Mobile Application & SEO"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#1D1930] mb-1">Project Code *</label>
                <Input
                  placeholder="PRJ-APP-01"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1D1930] mb-1">Due Date</label>
                <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createProjectMutation.mutate()}
                isLoading={createProjectMutation.isPending}
                disabled={!newName.trim() || !newCode.trim() || !newClientId}
              >
                Create Workspace
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </>
  );
}

