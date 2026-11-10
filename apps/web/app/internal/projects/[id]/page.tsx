"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Check, Plus, Send, X, CheckCircle2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "in_review" | "completed";
  priority: "high" | "medium" | "low";
  owner_name: string;
}

const STAGES = [
  { id: "not_started", label: "Not Started" },
  { id: "planning", label: "Planning" },
  { id: "in_progress", label: "In Progress" },
  { id: "internal_review", label: "Internal Review" },
  { id: "client_review", label: "Client Review" },
  { id: "revision", label: "Revision" },
  { id: "completed", label: "Completed" },
];

const DEFAULT_PROJECT = {
  id: "proj-peak-web",
  name: "Website redesign",
  account_name: "Peak Fitness",
  account_id: "CLI-PEAK-001",
  service: "Website development",
  manager: "Meera",
  due_date: "Nov 30, 2026",
  current_stage: "internal_review",
};

const DEFAULT_TASKS: TaskItem[] = [
  { id: "t1", title: "Contact page copy", status: "todo", priority: "medium", owner_name: "Divya" },
  { id: "t2", title: "Pricing page", status: "in_progress", priority: "high", owner_name: "Karan" },
  { id: "t3", title: "Mobile menu fix", status: "in_progress", priority: "low", owner_name: "Karan" },
  { id: "t4", title: "Home page design", status: "in_review", priority: "high", owner_name: "Meera" },
  { id: "t5", title: "Wireframes", status: "completed", priority: "medium", owner_name: "Divya" },
  { id: "t6", title: "Brand colors", status: "completed", priority: "low", owner_name: "Meera" },
];

export default function ProjectWorkspacePage() {
  const params = useParams();
  const projectId = params.id as string;

  const [currentStage, setCurrentStage] = useState("internal_review");
  const [tasks, setTasks] = useState<TaskItem[]>(DEFAULT_TASKS);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskOwner, setNewTaskOwner] = useState("Meera");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [newTaskLane, setNewTaskLane] = useState<"todo" | "in_progress" | "in_review" | "completed">("todo");
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch real project data
  const { data: projectData } = useQuery<any>({
    queryKey: ["project-workspace", projectId],
    queryFn: async () => {
      try {
        const res = await api.get<any>(`/projects/${projectId}`);
        return res;
      } catch (e) {
        return null;
      }
    },
  });

  useEffect(() => {
    if (projectData?.tasks && projectData.tasks.length > 0) {
      setTasks(
        projectData.tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          status: (t.status === "in_review" || t.status === "review"
            ? "in_review"
            : t.status === "in_progress"
            ? "in_progress"
            : t.status === "completed"
            ? "completed"
            : "todo") as any,
          priority: (t.priority?.toLowerCase() || "medium") as any,
          owner_name: t.owner_name || "Meera",
        }))
      );
    }
    if (projectData?.status) {
      const match = STAGES.find((s) => s.id === projectData.status);
      if (match) setCurrentStage(match.id);
    }
  }, [projectData]);

  const handleStageClick = async (stageId: string) => {
    setCurrentStage(stageId);
    try {
      await api.put(`/projects/${projectId}/stage`, { stage: stageId });
      setNotification(`Project stage updated to ${STAGES.find((s) => s.id === stageId)?.label}`);
      setTimeout(() => setNotification(null), 3000);
    } catch (e) {}
  };

  const moveTask = async (taskId: string, targetStatus: "todo" | "in_progress" | "in_review" | "completed") => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );
    try {
      await api.put(`/projects/tasks/${taskId}/status`, { status: targetStatus });
    } catch (e) {}
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      status: newTaskLane,
      priority: newTaskPriority,
      owner_name: newTaskOwner,
    };
    setTasks((prev) => [newTask, ...prev]);
    setIsNewTaskOpen(false);
    setNewTaskTitle("");

    try {
      await api.post(`/projects/${projectId}/tasks`, {
        title: newTask.title,
        status: newTask.status,
        priority: newTask.priority,
      });
      setNotification("Task created successfully");
      setTimeout(() => setNotification(null), 3000);
    } catch (e) {}
  };

  const handleSendToClient = () => {
    setNotification("Home page design deliverable sent to Peak Fitness portal for review");
    setTimeout(() => setNotification(null), 4000);
  };

  const stageIndex = STAGES.findIndex((s) => s.id === currentStage);

  const lanes = [
    { id: "todo", label: "To Do" },
    { id: "in_progress", label: "In Progress" },
    { id: "in_review", label: "In Review" },
    { id: "completed", label: "Completed" },
  ] as const;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#0F172A] text-white px-4 py-3 rounded-xl shadow-dropdown flex items-center space-x-2 text-[13px] border border-[#E5E7EB] animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-[#059669]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs text-[#64748B]">
        <Link href="/internal/projects" className="hover:text-[#5B4BDB] font-medium flex items-center space-x-1">
          <ArrowRight className="h-3.5 w-3.5 rotate-180" />
          <span>Projects Directory</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#0F172A]">{projectData?.name || DEFAULT_PROJECT.name}</span>
      </div>

      {/* Record Header Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="h-11 w-11 rounded-xl bg-[#0F172A] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-soft">
              {(projectData?.name || DEFAULT_PROJECT.name).split(" ").map((w: string) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-0.5">
                <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  PROJECT WORKSPACE
                </span>
                <span className="text-[11px] text-[#94A3B8]">·</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EEF2FF] text-[#5B4BDB]">
                  {STAGES.find((s) => s.id === currentStage)?.label || "Active"}
                </span>
                {projectData?.code && (
                  <>
                    <span className="text-[11px] text-[#94A3B8]">·</span>
                    <span className="text-xs font-mono text-[#64748B]">{projectData.code}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight leading-tight">
                {projectData?.name || DEFAULT_PROJECT.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleSendToClient}
              className="h-10 px-4 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FB] text-[#0F172A] text-[13px] font-medium rounded-xl transition-colors shadow-soft flex items-center space-x-2"
            >
              <Send className="h-4 w-4 text-[#5B4BDB]" />
              <span>Send to client</span>
            </button>
            <button
              onClick={() => setIsNewTaskOpen(true)}
              className="h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Key Fields Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#E5E7EB]">
          <div>
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Account</div>
            <Link
              href={`/internal/clients/${projectData?.client_code || projectData?.client_id || "CLI-PEAK-001"}`}
              className="text-[#5B4BDB] hover:underline font-semibold text-[14px] mt-1 block"
            >
              {projectData?.client_name || DEFAULT_PROJECT.account_name}
            </Link>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Service</div>
            <div className="text-[#0F172A] font-semibold text-[14px] mt-1">
              {projectData?.service_name || ((projectData?.name || DEFAULT_PROJECT.name).toLowerCase().includes("seo") ? "SEO & Growth" : (projectData?.name || DEFAULT_PROJECT.name).toLowerCase().includes("lms") ? "EdTech Platform" : "Website Development")}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Project Manager</div>
            <div className="text-[#0F172A] font-semibold text-[14px] mt-1">
              {projectData?.manager?.name || DEFAULT_PROJECT.manager}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Due date</div>
            <div className="text-[#0F172A] font-semibold text-[14px] mt-1">
              {projectData?.due_date || DEFAULT_PROJECT.due_date}
            </div>
          </div>
        </div>
      </div>

      {/* Stage Path Chevrons / Step Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-card overflow-x-auto">
        <div className="flex items-center space-x-2 min-w-[720px]">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < stageIndex;
            const isCurrent = idx === stageIndex;

            let badgeStyle = "bg-[#F8F9FB] text-[#64748B] border border-[#E5E7EB]";
            if (isCompleted) {
              badgeStyle = "bg-[#ECFDF5] text-[#059669] border border-[#D1FAE5]";
            } else if (isCurrent) {
              badgeStyle = "bg-[#5B4BDB] text-white border border-[#5B4BDB] shadow-soft font-semibold";
            }

            return (
              <button
                key={stage.id}
                onClick={() => handleStageClick(stage.id)}
                className={`flex-1 h-10 px-3 rounded-xl flex items-center justify-center text-[12.5px] transition-all ${badgeStyle}`}
              >
                {isCompleted && <Check className="h-3.5 w-3.5 mr-1.5 stroke-[2.5]" />}
                <span className="truncate">{stage.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kanban Task Board */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card p-6">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E5E7EB]">
          <div>
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              DELIVERY BOARD
            </div>
            <h2 className="text-[17px] font-bold text-[#0F172A] tracking-tight mt-0.5">
              Tasks ({tasks.length})
            </h2>
          </div>
          <button
            onClick={() => setIsNewTaskOpen(true)}
            className="text-[13px] font-semibold text-[#5B4BDB] hover:underline flex items-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>

        {/* 4 Lanes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {lanes.map((lane) => {
            const laneTasks = tasks.filter((t) => t.status === lane.id);

            return (
              <div
                key={lane.id}
                className="bg-[#F8F9FB] rounded-xl border border-[#E5E7EB] p-3 flex flex-col min-h-[420px]"
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E5E7EB] px-1">
                  <span className="text-[11.5px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    {lane.label}
                  </span>
                  <span className="h-5 w-5 rounded-full bg-white text-[#5B4BDB] font-bold text-[11px] flex items-center justify-center border border-[#E5E7EB]">
                    {laneTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {laneTasks.map((task) => {
                    let prioColor = "bg-[#F1F5F9] text-[#64748B]";
                    if (task.priority === "high") prioColor = "bg-[#FFF1F2] text-[#E11D48]";
                    if (task.priority === "medium") prioColor = "bg-[#FFFBEB] text-[#D97706]";

                    return (
                      <div
                        key={task.id}
                        className="bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] rounded-xl p-3.5 shadow-soft transition-all group"
                      >
                        <div className="text-[13.5px] font-semibold text-[#0F172A] mb-2 leading-snug">
                          {task.title}
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-[#64748B] font-medium">{task.owner_name}</span>
                          <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${prioColor}`}>
                            {task.priority}
                          </span>
                        </div>

                        {/* Quick Lane Mover */}
                        <div className="mt-2.5 pt-2 border-t border-[#E5E7EB] hidden group-hover:flex items-center justify-end space-x-1 text-[11px]">
                          {lane.id !== "todo" && (
                            <button
                              onClick={() => {
                                const idx = lanes.findIndex((l) => l.id === lane.id);
                                moveTask(task.id, lanes[idx - 1].id);
                              }}
                              className="px-2 py-0.5 bg-[#F8F9FB] hover:bg-[#E5E7EB] rounded-lg text-[#0F172A]"
                            >
                              ← Back
                            </button>
                          )}
                          {lane.id !== "completed" && (
                            <button
                              onClick={() => {
                                const idx = lanes.findIndex((l) => l.id === lane.id);
                                moveTask(task.id, lanes[idx + 1].id);
                              }}
                              className="px-2 py-0.5 bg-[#5B4BDB] hover:bg-[#4B3DC7] text-white rounded-lg font-semibold"
                            >
                              Next →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {laneTasks.length === 0 && (
                    <div className="h-28 border border-dashed border-[#E5E7EB] rounded-xl flex items-center justify-center text-[11px] text-[#94A3B8]">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Task Modal */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] w-full max-w-md shadow-dropdown p-6 text-[14px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="font-bold text-[16px] text-[#0F172A]">Create New Task</h3>
              <button onClick={() => setIsNewTaskOpen(false)} className="text-[#64748B] hover:text-[#0F172A]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Task Title <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navigation responsive fix"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">Assignee</label>
                  <select
                    value={newTaskOwner}
                    onChange={(e) => setNewTaskOwner(e.target.value)}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] bg-white focus:border-[#5B4BDB] focus:outline-none"
                  >
                    <option value="Meera">Meera (PM)</option>
                    <option value="Karan">Karan (Developer)</option>
                    <option value="Divya">Divya (Designer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] bg-white focus:border-[#5B4BDB] focus:outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">Lane</label>
                <select
                  value={newTaskLane}
                  onChange={(e) => setNewTaskLane(e.target.value as any)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] bg-white focus:border-[#5B4BDB] focus:outline-none"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="h-10 px-4 border border-[#E5E7EB] rounded-xl text-[13px] text-[#64748B] hover:bg-[#F8F9FB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl text-[13px] font-semibold shadow-soft"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
