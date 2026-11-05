"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Headphones, Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function PortalSupportPage() {
  const queryClient = useQueryClient();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");

  const { data: tickets, isLoading } = useQuery<any>({
    queryKey: ["portal-tickets"],
    queryFn: () => api.get<any>("/support/tickets"),
  });

  const createTicketMutation = useMutation({
    mutationFn: async () => {
      return api.post("/support/tickets", {
        subject,
        description,
        priority,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-tickets"] });
      setIsOpenModal(false);
      setSubject("");
      setDescription("");
    },
    onError: (err: any) => alert(err.message || "Failed to create ticket."),
  });

  return (
    <>
      <Header
        title="Client Support & Helpdesk"
        subtitle="Submit inquiries, report issues, and communicate directly with your dedicated account team"
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setIsOpenModal(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Submit Support Request
          </Button>
        </div>

        <Card>
          <CardHeader className="p-4 border-b border-[#E9E5F0]">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#77738A]">
              Your Support Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E9E5F0] bg-[#F8F8FC] text-[#77738A] font-medium">
                  <th className="py-3 px-4">Ticket #</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E5F0]">
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#77738A]">
                      Loading tickets...
                    </td>
                  </tr>
                )}
                {tickets?.items?.map((t: any) => (
                  <tr key={t.id} className="hover:bg-[#F8F8FC]">
                    <td className="py-3 px-4 font-mono font-bold text-[#1D1930]">{t.ticket_number}</td>
                    <td className="py-3 px-4 font-semibold text-[#1D1930]">{t.subject}</td>
                    <td className="py-3 px-4">
                      <Badge variant={t.priority === "urgent" ? "danger" : "default"}>
                        {t.priority.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={t.status === "open" ? "warning" : "default"}>
                        {t.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-[#77738A]">{formatDate(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Create Ticket Modal */}
        <Modal
          isOpen={isOpenModal}
          onClose={() => setIsOpenModal(false)}
          title="Submit Support Request"
          description="Our technical and account team will respond directly in your portal."
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">Subject *</label>
              <Input
                placeholder="Brief summary of request"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">Priority</label>
              <select
                className="w-full text-xs rounded-md border border-[#E9E5F0] p-2 bg-white"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">Description *</label>
              <textarea
                className="w-full text-xs rounded-md border border-[#E9E5F0] p-2 bg-white h-24 focus:ring-1 focus:ring-[#6C3BDB] focus:outline-none"
                placeholder="Describe the issue or deliverable inquiry..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setIsOpenModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createTicketMutation.mutate()}
                isLoading={createTicketMutation.isPending}
                disabled={!subject.trim() || !description.trim()}
              >
                Submit Ticket
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </>
  );
}

