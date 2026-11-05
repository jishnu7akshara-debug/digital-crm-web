"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FolderKanban,
  CheckSquare,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Layers,
  Eye,
  Check,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { formatDate, formatINRPrecise } from "@/lib/utils";

interface MilestoneItem {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  is_completed: boolean;
  order_index: number;
}

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  owner_name?: string;
  estimated_hours: number;
  logged_hours: number;
  due_date?: string;
  is_client_visible: boolean;
  milestone_id?: string;
}

interface DeliverableItem {
  id: string;
  title: string;
  file_url: string;
  version: number;
  status: string;
  client_feedback?: string;
  approved_at?: string;
}

interface ProjectWorkspaceDetail {
  id: string;
  name: string;
  code: string;
  description?: string;
  client_id: string;
  client_name: string;
  status: string;
  priority: string;
  progress_percent: number;
  start_date?: string;
  due_date?: string;
  budget_rupees: number;
  manager?: { id: string; name: string; email: string };
  members: any[];
  milestones: MilestoneItem[];
  tasks: TaskItem[];
  deliverables: DeliverableItem[];
}

export default function ProjectWorkspacePage() {
  const params = useParams();
  const projectId = params.id as string;
  const queryClient = useQueryClient();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskEstHours, setTaskEstHours] = useState<number>(8);
  const [taskMilestoneId, setTaskMilestoneId] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  const { data: project, isLoading, error } = useQuery<ProjectWorkspaceDetail>({
    queryKey: ["project-workspace", projectId],
    queryFn: () => api.get<ProjectWorkspaceDetail>(`/projects/${projectId}`),
    enabled: !!projectId,
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/projects/${projectId}/tasks`, {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        estimated_hours: taskEstHours,
        milestone_id: taskMilestoneId || undefined,
        due_date: taskDueDate || undefined,
        is_client_visible: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-workspace", projectId] });
      setIsTaskModalOpen(false);
      setTaskTitle("");
      setTaskDesc("");
      setTaskDueDate("");
    },
    onError: (err: any) => {
      alert(err.message || "Failed to create task.");
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      return api.put(`/projects/tasks/${taskId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-workspace", projectId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-7 w-7 rounded-full border-2 border-[#6C3BDB] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8 text-center text-rose-600 text-xs">
        Failed to load project workspace. Verify permissions and project ID.
      </div>
    );
  }

  return (
    <>
      <Header
        title={`Project Workspace: ${project.name}`}
        subtitle={`Client: ${project.client_name} • Code: ${project.code}`}
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Project Overview Card */}
        <Card className="bg-white border-[#E9E5F0]">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-[#77738A] bg-[#F8F8FC] px-2 py-0.5 rounded border border-[#E9E5F0]">
                    {project.code}
                  </span>
                  <Badge variant={project.status === "completed" ? "success" : "default"}>
                    {project.status.replace("_", " ").toUpperCase()}
                  </Badge>
                  <Badge variant="outline">{project.priority.toUpperCase()} PRIORITY</Badge>
                </div>
                <h2 className="text-xl font-bold text-[#1D1930] mt-2">{project.name}</h2>
                <p className="text-xs text-[#77738A] mt-1 max-w-2xl">{project.description || "No project description provided."}</p>
              </div>

              {/* Manager & Client Links */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="p-3 bg-[#F8F8FC] rounded-lg border border-[#E9E5F0] text-xs">
                  <span className="text-[10px] text-[#77738A] font-semibold uppercase">Project Lead</span>
                  <div className="font-bold text-[#1D1930]">{project.manager?.name || "Senior PM"}</div>
                </div>

                <Link href={`/internal/clients/${project.client_id}`}>
                  <Button variant="outline" size="sm" className="h-full py-3 text-xs">
                    View Client 360
                  </Button>
                </Link>
              </div>
            </div>

            {/* Progress Bar & Key Dates */}
            <div className="mt-6 pt-6 border-t border-[#E9E5F0] grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <div className="flex items-center justify-between text-xs text-[#77738A] mb-1">
                  <span>Overall Delivery Progress</span>
                  <span className="font-bold text-[#1D1930]">{project.progress_percent}%</span>
                </div>
                <div className="w-full bg-[#F3F1F8] rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#6C3BDB] h-2.5 rounded-full transition-all"
                    style={{ width: `${project.progress_percent}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6 text-xs text-[#77738A]">
                <div>
                  <span className="block text-[10px] uppercase font-semibold">Start Date</span>
                  <span className="font-medium text-[#1D1930]">{formatDate(project.start_date)}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-semibold">Target Due Date</span>
                  <span className="font-medium text-[#1D1930]">{formatDate(project.due_date)}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#77738A] uppercase font-semibold">Allocated Budget</span>
                <div className="text-lg font-bold text-[#6C3BDB]">{formatINRPrecise(project.budget_rupees)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Milestones Horizontal Timeline */}
        <Card>
          <CardHeader className="p-4 border-b border-[#E9E5F0]">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#77738A]">
              Delivery Milestones ({project.milestones.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {project.milestones.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-lg border text-xs ${
                    m.is_completed ? "border-emerald-200 bg-emerald-50/50" : "border-[#E9E5F0] bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1D1930]">{m.title}</span>
                    {m.is_completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-[#77738A]" />
                    )}
                  </div>
                  <div className="mt-2 text-[11px] text-[#77738A]">Target: {formatDate(m.due_date)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks Section with Filter and Create */}
        <Card>
          <CardHeader className="p-4 border-b border-[#E9E5F0] flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#77738A]">
                Tasks ({project.tasks.length})
              </CardTitle>
              <p className="text-xs text-[#77738A] mt-0.5">
                One task owner, collaborators, and client visibility controls
              </p>
            </div>
            <Button size="sm" onClick={() => setIsTaskModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Task
            </Button>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E9E5F0] bg-[#F8F8FC] text-[#77738A] font-medium">
                  <th className="py-3 px-4">Task Title</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Hours (Est / Logged)</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-center">Client Visible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E5F0]">
                {project.tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-[#F8F8FC] transition-colors">
                    <td className="py-3 px-4 font-medium text-[#1D1930]">{task.title}</td>
                    <td className="py-3 px-4 text-[#77738A]">{task.owner_name || "Unassigned"}</td>
                    <td className="py-3 px-4">
                      <Badge variant={task.priority === "urgent" ? "danger" : "default"} className="text-[10px]">
                        {task.priority.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          updateTaskStatusMutation.mutate({
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
                        <option value="blocked">Blocked</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#77738A]">
                      {task.logged_hours}h / {task.estimated_hours}h
                    </td>
                    <td className="py-3 px-4 text-[#77738A]">{task.due_date ? formatDate(task.due_date) : "—"}</td>
                    <td className="py-3 px-4 text-center">
                      {task.is_client_visible ? (
                        <span className="text-emerald-600 font-semibold text-xs">Yes</span>
                      ) : (
                        <span className="text-[#77738A] text-xs">Internal Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Deliverables Section */}
        {project.deliverables.length > 0 && (
          <Card>
            <CardHeader className="p-4 border-b border-[#E9E5F0]">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#77738A]">
                Client Deliverables & Approvals
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {project.deliverables.map((del) => (
                <div key={del.id} className="p-3 border border-[#E9E5F0] rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-[#1D1930]">{del.title}</div>
                    <span className="text-[10px] text-[#77738A] font-mono">Version v{del.version}</span>
                  </div>
                  <Badge variant={del.status === "approved" ? "success" : "warning"}>
                    {del.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Add Task Modal */}
        <Modal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          title="Add Task to Workspace"
          description="Create task or subtask and allocate to team member."
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">Task Title *</label>
              <Input
                placeholder="e.g. Design System & Token Architecture"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">Description</label>
              <Input
                placeholder="Task details and acceptance criteria"
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#1D1930] mb-1">Milestone</label>
                <select
                  className="w-full text-xs rounded-md border border-[#E9E5F0] p-2 bg-white"
                  value={taskMilestoneId}
                  onChange={(e) => setTaskMilestoneId(e.target.value)}
                >
                  <option value="">-- No Milestone --</option>
                  {project.milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1D1930] mb-1">Priority</label>
                <select
                  className="w-full text-xs rounded-md border border-[#E9E5F0] p-2 bg-white"
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#1D1930] mb-1">Estimated Hours</label>
                <Input
                  type="number"
                  value={taskEstHours}
                  onChange={(e) => setTaskEstHours(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1D1930] mb-1">Due Date</label>
                <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setIsTaskModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createTaskMutation.mutate()}
                isLoading={createTaskMutation.isPending}
                disabled={!taskTitle.trim()}
              >
                Create Task
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </>
  );
}
