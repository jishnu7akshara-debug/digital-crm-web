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
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface TaskItem {
  id: string;
  project_id: string;
  project_name?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  owner_name?: string;
  estimated_hours: number;
  logged_hours: number;
  due_date?: string;
  is_client_visible: boolean;
}

export default function StaffTasksPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data: projects, isLoading } = useQuery<any>({
    queryKey: ["projects-tasks-aggregate"],
    queryFn: () => api.get<any>("/projects?page_size=20"),
  });

  const [tasks, setTasks] = useState<TaskItem[]>([]);

  React.useEffect(() => {
    async function loadAllTasks() {
      if (!projects?.items) return;
      const all: TaskItem[] = [];
      for (const p of projects.items) {
        try {
          const detail = await api.get<any>(`/projects/${p.id}`);
          if (detail.tasks) {
            detail.tasks.forEach((t: any) => {
              all.push({
                ...t,
                project_id: p.id,
                project_name: p.name,
              });
            });
          }
        } catch {
          // ignore individual fetch errors
        }
      }
      setTasks(all);
    }
    loadAllTasks();
  }, [projects]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      return api.put(`/projects/tasks/${taskId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects-tasks-aggregate"] });
    },
  });

  const filteredTasks = tasks.filter((t) => {
    if (filter === "completed") return t.status === "completed";
    if (filter === "pending") return t.status !== "completed";
    return true;
  });

  return (
    <div className="space-y-6 select-none">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              OPERATIONS & DELIVERY
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              Sprint Tasks
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Tasks & Work Items
          </h2>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Operational work items, milestone deliverables, and client-visible status.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 bg-[#F8F9FB] p-1.5 rounded-xl border border-[#E5E7EB]">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "all"
                ? "bg-white text-[#5B4BDB] shadow-soft"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "pending"
                ? "bg-white text-[#5B4BDB] shadow-soft"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "completed"
                ? "bg-white text-[#5B4BDB] shadow-soft"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Task Assignments Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card overflow-hidden">
        <div className="p-5 border-b border-[#E5E7EB]">
          <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
            Task Assignments ({filteredTasks.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#F1F5F9] bg-[#F8F9FB] text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                <th className="py-3 px-5">Task</th>
                <th className="py-3 px-5">Project</th>
                <th className="py-3 px-5">Priority</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Logged Hours</th>
                <th className="py-3 px-5">Due Date</th>
                <th className="py-3 px-5 text-right">Workspace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#64748B]">
                    Loading tasks...
                  </td>
                </tr>
              )}
              {filteredTasks.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#64748B]">
                    No tasks found in this view.
                  </td>
                </tr>
              )}
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-[#F8F9FB] transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-[#0F172A]">
                    {task.title}
                  </td>
                  <td className="py-3.5 px-5 text-[#64748B]">
                    {task.project_name || "Workspace"}
                  </td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        task.priority === "urgent"
                          ? "bg-[#FFF1F2] text-[#E11D48]"
                          : task.priority === "high"
                          ? "bg-[#FFF7ED] text-[#EA580C]"
                          : "bg-[#F1F5F9] text-[#64748B]"
                      }`}
                    >
                      {task.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          taskId: task.id,
                          status: e.target.value,
                        })
                      }
                      className="text-xs border border-[#E5E7EB] rounded-lg px-2.5 py-1 bg-white font-medium text-[#0F172A] focus:outline-none focus:border-[#5B4BDB]"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs text-[#64748B]">
                    {task.logged_hours}h / {task.estimated_hours}h
                  </td>
                  <td className="py-3.5 px-5 text-xs text-[#64748B]">
                    {task.due_date ? formatDate(task.due_date) : "—"}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <Link
                      href={`/internal/projects/${task.project_id}`}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-[#5B4BDB] hover:underline"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
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