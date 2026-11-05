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
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  // Collect tasks from all projects
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
    <>
      <Header
        title="My Tasks & Assignments"
        subtitle="Operational tasks, collaborators, and milestone deadlines"
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant={filter === "all" ? "primary" : "outline"}
            onClick={() => setFilter("all")}
          >
            All Tasks ({tasks.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "pending" ? "primary" : "outline"}
            onClick={() => setFilter("pending")}
          >
            Pending
          </Button>
          <Button
            size="sm"
            variant={filter === "completed" ? "primary" : "outline"}
            onClick={() => setFilter("completed")}
          >
            Completed
          </Button>
        </div>

        <Card>
          <CardHeader className="p-4 border-b border-[#E9E5F0]">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#77738A]">
              Task Assignments ({filteredTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E9E5F0] bg-[#F8F8FC] text-[#77738A] font-medium">
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Logged Hours</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E5F0]">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#77738A]">
                      Loading tasks...
                    </td>
                  </tr>
                )}
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-[#F8F8FC]">
                    <td className="py-3 px-4 font-semibold text-[#1D1930]">{task.title}</td>
                    <td className="py-3 px-4 text-[#77738A]">{task.project_name || "Workspace"}</td>
                    <td className="py-3 px-4">
                      <Badge variant={task.priority === "urgent" ? "danger" : "default"} className="text-[10px]">
                        {task.priority.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          updateStatusMutation.mutate({
                            taskId: task.id,
                            status: e.target.value,
                          })
                        }
                        className="text-xs border border-[#E9E5F0] rounded px-2 py-1 bg-white font-medium"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="in_review">In Review</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#77738A]">
                      {task.logged_hours}h / {task.estimated_hours}h
                    </td>
                    <td className="py-3 px-4 text-[#77738A]">{task.due_date ? formatDate(task.due_date) : "—"}</td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/internal/projects/${task.project_id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          Workspace <ExternalLink className="h-3 w-3 ml-1 text-[#6C3BDB]" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
