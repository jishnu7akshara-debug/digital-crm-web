"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Headphones,
  Plus,
  MessageSquare,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  Lock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { PageReady } from "@/components/page-ready";

interface TicketSummary {
  id: string;
  ticket_number: string;
  client_id: string;
  client_name: string;
  subject: string;
  priority: string;
  status: string;
  assigned_to_name?: string;
  created_at: string;
}

interface PaginatedTickets {
  items: TicketSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function SupportDeskPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // New Comment state
  const [commentContent, setCommentContent] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);

  const { data, isLoading } = useQuery<PaginatedTickets>({
    queryKey: ["support-tickets", statusFilter],
    queryFn: () => api.get<PaginatedTickets>(`/support/tickets?status_filter=${statusFilter}`),
  });

  const { data: ticketDetail, refetch: refetchDetail } = useQuery<any>({
    queryKey: ["ticket-detail", selectedTicketId],
    queryFn: () => api.get<any>(`/support/tickets/${selectedTicketId}`),
    enabled: !!selectedTicketId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicketId) return;
      return api.post(`/support/tickets/${selectedTicketId}/comments`, {
        content: commentContent,
        is_internal: isInternalNote,
      });
    },
    onSuccess: () => {
      setCommentContent("");
      setIsInternalNote(false);
      refetchDetail();
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to post comment."),
  });

  return (
    <div className="space-y-6 select-none">
      <PageReady when={!isLoading && !!data} />
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              HELP DESK & INQUIRIES
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              Client Support SLA
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Support & Client Inquiries
          </h2>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Manage client tickets, SLA response commitments, and internal private notes.
          </p>
        </div>

        <select
          className="text-xs rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 bg-white text-[#0F172A] font-medium shadow-soft focus:outline-none focus:border-[#5B4BDB]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Tickets</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ticket List */}
          <Card className="md:col-span-1">
            <CardHeader className="p-4 border-b border-[#E9E5F0]">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#77738A]">
                Tickets ({data?.total || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {isLoading && <div className="p-4 text-xs text-[#77738A]">Loading tickets...</div>}
              {data?.items.map((t) => {
                const isSelected = selectedTicketId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      isSelected
                        ? "bg-[#F5F1FF] border border-[#E9E5F0]"
                        : "hover:bg-[#F8F8FC]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] text-[#77738A]">{t.ticket_number}</span>
                      <Badge variant={t.status === "open" ? "warning" : "default"} className="text-[9px]">
                        {t.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-xs font-semibold text-[#1D1930] line-clamp-1">{t.subject}</div>
                    <div className="text-[11px] text-[#77738A] mt-1">{t.client_name}</div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Ticket Thread */}
          <Card className="md:col-span-2">
            {ticketDetail ? (
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#77738A]">{ticketDetail.ticket_number}</span>
                    <Badge variant="default">{ticketDetail.status.toUpperCase()}</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-[#1D1930] mt-1">{ticketDetail.subject}</h3>
                  <p className="text-xs text-[#77738A] mt-0.5">
                    Client: <span className="font-semibold text-[#1D1930]">{ticketDetail.client_name}</span>
                  </p>
                  <div className="mt-3 p-3 bg-[#F8F8FC] rounded-lg text-xs text-[#1D1930] border border-[#E9E5F0]">
                    {ticketDetail.description}
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#77738A] uppercase tracking-wider">Conversation</h4>
                  {ticketDetail.comments?.map((c: any) => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-lg text-xs border ${
                        c.is_internal
                          ? "bg-amber-50/70 border-amber-200"
                          : "bg-white border-[#E9E5F0]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[#1D1930] flex items-center">
                          {c.user_name}
                          {c.is_internal && (
                            <span className="ml-2 flex items-center text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-mono">
                              <Lock className="h-2.5 w-2.5 mr-0.5" /> STAFF INTERNAL NOTE
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-[#77738A]">{formatDate(c.created_at)}</span>
                      </div>
                      <p className="text-[#1D1930] mt-1">{c.content}</p>
                    </div>
                  ))}
                </div>

                {/* Reply Box */}
                <div className="pt-4 border-t border-[#E9E5F0] space-y-3">
                  <Input
                    placeholder="Type your response or internal note..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 text-xs text-[#77738A] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded border-[#E9E5F0] text-[#6C3BDB] focus:ring-[#6C3BDB]"
                      />
                      <span>Internal Staff Note (Hidden from client)</span>
                    </label>

                    <Button
                      size="sm"
                      onClick={() => addCommentMutation.mutate()}
                      isLoading={addCommentMutation.isPending}
                      disabled={!commentContent.trim()}
                    >
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-[#77738A]">
                Select a ticket to view conversation thread and replies.
              </div>
            )}
          </Card>
        </div>
    </div>
  );
}

