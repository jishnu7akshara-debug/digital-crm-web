"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Send, X, AlertCircle, CheckCircle2 } from "lucide-react";
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
  due_date: "Nov 30",
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
  const router = useRouter();
  const queryClient = useQueryClient();
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

  // Stage change mutation
  const handleStageClick = async (stageId: string) => {
    setCurrentStage(stageId);
    try {
      await api.put(`/projects/${projectId}/stage`, { stage: stageId });
      setNotification(`Project stage updated to ${STAGES.find((s) => s.id === stageId)?.label}`);
      setTimeout(() => setNotification(null), 3000);
    } catch (e) {
      // optimistic update retained
    }
  };

  // Move task to next or specific lane
  const moveTask = async (taskId: string, targetStatus: "todo" | "in_progress" | "in_review" | "completed") => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );
    try {
      await api.put(`/projects/tasks/${taskId}/status`, { status: targetStatus });
    } catch (e) {
      // retained
    }
  };

  // Add Task
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
    } catch (e) {
      // optimistic update
    }
  };

  // Send to client
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
    <div className="space-y-3 pb-8">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#032D60] text-white px-4 py-2.5 rounded-[4px] shadow-lg flex items-center space-x-2 text-[13px] border border-[#0176D3] animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-[#2E844A]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Record Header Card: Green tile 'P' (#3BA755) + Website redesign */}
      <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-3 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {/* Green Tile 'P' */}
            <div className="h-8 w-8 rounded-[4px] bg-[#3BA755] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
              P
            </div>
            <div>
              <div className="text-[11px] text-[#5C5C5C] font-normal leading-none mb-0.5">
                Project
              </div>
              <h1 className="text-xl font-bold text-[#181818] leading-tight">
                {projectData?.name || DEFAULT_PROJECT.name}
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSendToClient}
              className="h-8 px-3.5 bg-white border border-[#DDDBDA] text-[#181818] text-[13px] font-normal rounded-[4px] hover:bg-[#F3F3F3] transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <Send className="h-3.5 w-3.5 text-[#5C5C5C]" />
              <span>Send to client</span>
            </button>
            <button
              onClick={() => setIsNewTaskOpen(true)}
              className="h-8 px-3.5 bg-[#0176D3] hover:bg-[#0176D3]/90 text-white text-[13px] font-bold rounded-[4px] transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Key Fields Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 pt-3 border-t border-[#DDDBDA] text-[12px]">
          <div>
            <div className="text-[11px] text-[#5C5C5C]">Account</div>
            <Link
              href="/internal/clients"
              className="text-[#0176D3] hover:underline font-normal text-[13px] truncate block"
            >
              {projectData?.client_name || DEFAULT_PROJECT.account_name}
            </Link>
          </div>
          <div>
            <div className="text-[11px] text-[#5C5C5C]">Service</div>
            <div className="text-[#181818] text-[13px]">
              {DEFAULT_PROJECT.service}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#5C5C5C]">Manager</div>
            <div className="text-[#181818] text-[13px]">
              {projectData?.manager?.name || DEFAULT_PROJECT.manager}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#5C5C5C]">Due date</div>
            <div className="text-[#181818] text-[13px]">
              {DEFAULT_PROJECT.due_date}
            </div>
          </div>
        </div>
      </div>

      {/* Stage Path Chevrons (Screen 4) */}
      <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-2.5 shadow-sm overflow-x-auto">
        <div className="flex items-center min-w-[700px]">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < stageIndex;
            const isCurrent = idx === stageIndex;
            const isUpcoming = idx > stageIndex;

            let bgColor = "bg-[#F3F3F3]";
            let textColor = "text-[#5C5C5C]";
            let borderColor = "border-[#DDDBDA]";

            if (isCompleted) {
              bgColor = "bg-[#2E844A]";
              textColor = "text-white";
              borderColor = "border-[#2E844A]";
            } else if (isCurrent) {
              bgColor = "bg-[#0176D3]";
              textColor = "text-white font-bold";
              borderColor = "border-[#0176D3]";
            }

            return (
              <button
                key={stage.id}
                onClick={() => handleStageClick(stage.id)}
                className={`flex-1 h-8 px-2 flex items-center justify-center text-[12px] font-medium transition-all relative select-none mr-1 first:rounded-l-[4px] last:rounded-r-[4px] last:mr-0 ${bgColor} ${textColor} hover:opacity-95`}
                style={{
                  clipPath:
                    idx === STAGES.length - 1
                      ? "polygon(0 0, 100% 0, 100% 100%, 0 100%, 8px 50%)"
                      : idx === 0
                      ? "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)"
                      : "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%, 8px 50%)",
                }}
                title={`Move to ${stage.label}`}
              >
                {isCompleted && <Check className="h-3 w-3 mr-1 text-white stroke-[3]" />}
                <span className="truncate">{stage.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kanban Task Board: Tasks (6) */}
      <div className="bg-white border border-[#DDDBDA] rounded-[4px] shadow-sm">
        {/* Board Header */}
        <div className="px-4 py-2.5 border-b border-[#DDDBDA] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-[14px] font-bold text-[#181818]">
              Tasks ({tasks.length})
            </h2>
          </div>
          <button
            onClick={() => setIsNewTaskOpen(true)}
            className="text-[12px] font-bold text-[#0176D3] hover:underline flex items-center space-x-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* 4 Lanes */}
        <div className="p-3 grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#F3F3F3]/40">
          {lanes.map((lane) => {
            const laneTasks = tasks.filter((t) => t.status === lane.id);

            return (
              <div
                key={lane.id}
                className="bg-[#F3F3F3] border border-[#DDDBDA] rounded-[4px] p-2 flex flex-col min-h-[360px]"
              >
                {/* Lane Header */}
                <div className="font-bold text-[12px] text-[#181818] mb-2 px-1 flex items-center justify-between">
                  <span>
                    {lane.label} ({laneTasks.length})
                  </span>
                </div>

                {/* Task Cards */}
                <div className="space-y-2 flex-1">
                  {laneTasks.map((task) => {
                    // Priority Pill Colors
                    let prioBg = "bg-[#F3F3F3]";
                    let prioText = "text-[#5C5C5C]";
                    if (task.priority === "high") {
                      prioBg = "bg-[#FEDED8]";
                      prioText = "text-[#BA0517]";
                    } else if (task.priority === "medium") {
                      prioBg = "bg-[#FEF1D6]";
                      prioText = "text-[#8A5200]";
                    }

                    return (
                      <div
                        key={task.id}
                        className="bg-white border border-[#DDDBDA] rounded-[4px] p-2.5 shadow-sm hover:shadow transition-shadow group relative"
                      >
                        <div className="text-[13px] font-medium text-[#181818] leading-tight mb-2">
                          {task.title}
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-[#5C5C5C] font-normal">
                            {task.owner_name}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded-[3px] font-medium capitalize text-[10px] ${prioBg} ${prioText}`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        {/* Quick Lane Mover Buttons on Hover */}
                        <div className="mt-2 pt-1.5 border-t border-[#DDDBDA]/60 hidden group-hover:flex items-center justify-end space-x-1 text-[10px]">
                          {lane.id !== "todo" && (
                            <button
                              onClick={() => {
                                const idx = lanes.findIndex((l) => l.id === lane.id);
                                moveTask(task.id, lanes[idx - 1].id);
                              }}
                              className="px-1.5 py-0.5 bg-[#F3F3F3] hover:bg-[#DDDBDA] rounded text-[#181818]"
                              title="Move left"
                            >
                              ←
                            </button>
                          )}
                          {lane.id !== "completed" && (
                            <button
                              onClick={() => {
                                const idx = lanes.findIndex((l) => l.id === lane.id);
                                moveTask(task.id, lanes[idx + 1].id);
                              }}
                              className="px-1.5 py-0.5 bg-[#0176D3] hover:bg-[#0176D3]/90 text-white rounded font-bold"
                              title="Move right"
                            >
                              →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {laneTasks.length === 0 && (
                    <div className="h-24 border border-dashed border-[#DDDBDA] rounded-[4px] flex items-center justify-center text-[11px] text-[#5C5C5C]">
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
          <div className="bg-white border border-[#DDDBDA] rounded-[4px] w-full max-w-md shadow-2xl p-5 text-[13px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDDBDA]">
              <h3 className="font-bold text-[15px] text-[#181818]">Create New Task</h3>
              <button
                onClick={() => setIsNewTaskOpen(false)}
                className="text-[#5C5C5C] hover:text-[#181818]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5C5C5C] uppercase mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navigation responsive bug"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full h-8 px-2.5 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] focus:border-[#0176D3] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#5C5C5C] uppercase mb-1">
                    Assignee
                  </label>
                  <select
                    value={newTaskOwner}
                    onChange={(e) => setNewTaskOwner(e.target.value)}
                    className="w-full h-8 px-2 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] focus:border-[#0176D3] focus:outline-none bg-white"
                  >
                    <option value="Meera">Meera (PM)</option>
                    <option value="Karan">Karan (Developer)</option>
                    <option value="Divya">Divya (Designer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5C5C5C] uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full h-8 px-2 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] focus:border-[#0176D3] focus:outline-none bg-white"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C5C5C] uppercase mb-1">
                  Lane
                </label>
                <select
                  value={newTaskLane}
                  onChange={(e) => setNewTaskLane(e.target.value as any)}
                  className="w-full h-8 px-2 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] focus:border-[#0176D3] focus:outline-none bg-white"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#DDDBDA]">
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="h-8 px-3 border border-[#DDDBDA] rounded-[4px] text-[13px] text-[#181818] hover:bg-[#F3F3F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 bg-[#0176D3] text-white rounded-[4px] text-[13px] font-bold hover:bg-[#0176D3]/90 shadow-sm"
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
