"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Check, Plus, Send, X, CheckCircle2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { PageReady } from "@/components/page-ready";

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

export default function ProjectWorkspacePage() {
  const params = useParams();
  const projectId = (params?.id as string) || "";

  const [currentStage, setCurrentStage] = useState("in_progress");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskOwner, setNewTaskOwner] = useState("Meera");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [newTaskLane, setNewTaskLane] = useState<"todo" | "in_progress" | "in_review" | "completed">("todo");
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch real project data
  const {
    data: projectData,
    isLoading,
    error,
    refetch,
  } = useQuery<any>({
    queryKey: ["project-workspace", projectId],
    queryFn: async () => {
      return await api.get<any>(`/projects/${projectId}`);
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (projectData?.tasks) {
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
          owner_name: t.owner_name || "Team Member",
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
      refetch();
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
      refetch();
    } catch (e) {}
  };

  const handleSendToClient = () => {
    setNotification("Deliverable sent to client portal for review.");
    setTimeout(() => setNotification(null), 4000);
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error || !projectData) {
    return (
      <ErrorState
        message={(error as any)?.message || "Project workspace not found."}
        onRetry={() => refetch()}
      />
    );
  }

  const stageIndex = STAGES.findIndex((s) => s.id === currentStage);

  const lanes = [
    { id: "todo", label: "To Do" },
    { id: "in_progress", label: "In Progress" },
    { id: "in_review", label: "In Review" },
    { id: "completed", label: "Completed" },
  ] as const;

  return (
    <div className="space-y-6 pb-12">
      <PageReady when={!isLoading && !!projectData} />

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
        <span className="font-semibold text-[#0F172A]">{projectData.name}</span>
      </div>

      {/* Record Header Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="h-11 w-11 rounded-xl bg-[#0F172A] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-soft">
              {projectData.name.split(" ").map((w: string) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase()}
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
                {projectData.code && (
                  <>
                    <span className="text-[11px] text-[#94A3B8]">·</span>
                    <span className="text-xs font-mono text-[#64748B]">{projectData.code}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight leading-tight">
                {projectData.name}
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

        {/* Milestone Steps Bar */}
        <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between max-w-4xl mx-auto overflow-x-auto py-2">
            {STAGES.map((s, idx) => {
              const isPast = idx < stageIndex;
              const isCurrent = idx === stageIndex;

              return (
                <div
                  key={s.id}
                  onClick={() => handleStageClick(s.id)}
                  className="flex flex-col items-center cursor-pointer group px-2 shrink-0"
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1.5 ${
                      isPast
                        ? "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]"
                        : isCurrent
                        ? "bg-[#5B4BDB] text-white shadow-md ring-4 ring-[#EEF2FF]"
                        : "bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0]"
                    }`}
                  >
                    {isPast ? <Check className="h-4 w-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-semibold tracking-tight transition-colors ${
                      isCurrent ? "text-[#5B4BDB]" : isPast ? "text-[#0F172A]" : "text-[#94A3B8]"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {lanes.map((lane) => {
          const laneTasks = tasks.filter((t) => t.status === lane.id);

          return (
            <div key={lane.id} className="bg-[#F8F9FD] border border-[#E5E7EB] rounded-2xl p-4 flex flex-col space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  {lane.label}
                </span>
                <span className="h-5 w-5 rounded-full bg-white text-xs font-bold text-[#0F172A] flex items-center justify-center shadow-xs border border-[#E5E7EB]">
                  {laneTasks.length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 min-h-[300px]">
                {laneTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-2 hover:shadow-card transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-semibold text-[#0F172A] leading-tight">
                        {task.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          task.priority === "high"
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : task.priority === "medium"
                            ? "bg-amber-50 text-amber-600 border border-amber-200"
                            : "bg-slate-50 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-1 border-t border-[#F1F5F9]">
                      <span className="text-[11px] font-medium text-[#64748B]">{task.owner_name}</span>
                      <div className="flex items-center space-x-1">
                        {lane.id !== "completed" && (
                          <button
                            onClick={() =>
                              moveTask(
                                task.id,
                                lane.id === "todo"
                                  ? "in_progress"
                                  : lane.id === "in_progress"
                                  ? "in_review"
                                  : "completed"
                              )
                            }
                            className="text-[11px] font-semibold text-[#5B4BDB] hover:underline"
                          >
                            Advance →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
