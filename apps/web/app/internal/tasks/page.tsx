"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckSquare,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  ArrowRight,
  Plus,
  X,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";

interface TaskItem {
  id: string;
  project_id: string;
  project_name: string;
  client_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  owner_id: string | null;
  owner_name: string | null;
  estimated_hours: number;
  logged_hours: number;
  due_date: string | null;
  completed_at: string | null;
  is_client_visible: boolean;
  created_at: string;
}

export default function StaffTasksPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all tasks via single non-N+1 endpoint
  const { data: apiResponse, isLoading, error, refetch } = useQuery<any>({
    queryKey: ["tasks-list", filter],
    queryFn: async () => {
      const q = filter !== "all" ? `&status_filter=${filter}` : "";
      return await api.get<any>(`/tasks?page_size=100${q}`);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      return api.patch(`/tasks/${taskId}`, { status });
    },
    onSuccess: () => {
      toast.success("Task status updated.");
      queryClient.invalidateQueries({ queryKey: ["tasks-list"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update task status.");
    },
  });

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState message={(error as any)?.message || "Failed to load tasks"} onRetry={() => refetch()} />;

  const tasks: TaskItem[] = apiResponse?.items || [];
  const filteredTasks = tasks.filter((t) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.title.toLowerCase().includes(term) ||
      t.project_name.toLowerCase().includes(term) ||
      (t.owner_name && t.owner_name.toLowerCase().includes(term))
    );
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = totalTasks - completedTasks;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              PROJECT EXECUTION & DELIVERY
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              {pendingTasks} Pending / {totalTasks} Total Tasks
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Tasks Management</h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Cross-project task tracker, owner assignments, and progress monitoring without N+1 fetch latency.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/internal/projects"
            className="h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
          >
            <FolderKanban className="h-4 w-4" />
            <span>Open Projects</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#E5E7EB] shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search tasks by title, project, or assignee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8F9FB] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#5B4BDB]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === "all"
                ? "bg-[#5B4BDB] text-white shadow-soft"
                : "bg-[#F8F9FB] text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            All Tasks ({totalTasks})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === "pending"
                ? "bg-[#5B4BDB] text-white shadow-soft"
                : "bg-[#F8F9FB] text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Pending ({pendingTasks})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === "completed"
                ? "bg-[#5B4BDB] text-white shadow-soft"
                : "bg-[#F8F9FB] text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Completed ({completedTasks})
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          title="No Tasks Found"
          description={searchTerm ? "No tasks match your search filter." : "All projects are up to date."}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead className="bg-[#F8F9FB] border-b border-[#E5E7EB] text-[#94A3B8] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Done</th>
                  <th className="py-3 px-4">Task Description</th>
                  <th className="py-3 px-4">Project Workspace</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[#0F172A]">
                {filteredTasks.map((t) => {
                  const isDone = t.status === "completed";
                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-[#F8F9FD] transition-colors ${
                        isDone ? "opacity-60 bg-[#FAFAFA]" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={(e) =>
                            updateStatusMutation.mutate({
                              taskId: t.id,
                              status: e.target.checked ? "completed" : "todo",
                            })
                          }
                          className="h-4 w-4 rounded border-[#CBD5E1] text-[#5B4BDB] focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold text-xs text-[#0F172A] ${
                            isDone ? "line-through text-[#94A3B8]" : ""
                          }`}
                        >
                          {t.title}
                        </span>
                        {t.description && (
                          <p className="text-[11px] text-[#64748B] mt-0.5">{t.description}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/internal/projects/${t.project_id}`}
                          className="text-xs font-semibold text-[#5B4BDB] hover:underline flex items-center space-x-1"
                        >
                          <span>{t.project_name}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#64748B]">
                        {t.owner_name || "Unassigned"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            t.priority === "urgent" || t.priority === "high"
                              ? "bg-red-50 text-red-700"
                              : t.priority === "medium"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#64748B]">
                        {t.due_date ? formatDate(t.due_date) : "No due date"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
