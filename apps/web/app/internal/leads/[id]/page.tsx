"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Calendar,
  Clock,
  User,
  DollarSign,
  Send,
  Plus,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { PageReady } from "@/components/page-ready";

const STAGES = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "proposal_sent", label: "Proposal Sent" },
  { id: "negotiation", label: "Negotiation" },
  { id: "won", label: "Won Deal" },
];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = (params.id as string) || "";

  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [clientCode, setClientCode] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [isConverting, setIsConverting] = useState(false);

  // New Note
  const [newNoteText, setNewNoteText] = useState("");
  const [activityType, setActivityType] = useState("note");
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  // Fetch from FastAPI
  const {
    data: lead,
    isLoading: isLeadLoading,
    error: leadError,
    refetch: refetchLead,
  } = useQuery<any>({
    queryKey: ["lead-detail", leadId],
    queryFn: async () => {
      return await api.get<any>(`/leads/${leadId}`);
    },
  });

  const {
    data: activities,
    isLoading: isActivitiesLoading,
    refetch: refetchActivities,
  } = useQuery<any[]>({
    queryKey: ["lead-activities", leadId],
    queryFn: async () => {
      return await api.get<any[]>(`/leads/${leadId}/activities`);
    },
  });

  const handleStageChange = async (targetStage: string) => {
    try {
      await api.post(`/leads/${leadId}/stage`, { stage: targetStage });
      toast.success(`Stage updated to ${targetStage}`);
      await refetchLead();
      await refetchActivities();
    } catch (err: any) {
      toast.error(err?.message || "Invalid stage transition.");
    }
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = lead?.company_name || lead?.title || "Lead";
    const code = clientCode.trim() || `CLI-${name.slice(0, 4).toUpperCase()}-001`;

    try {
      setIsConverting(true);
      const res = await api.post<any>(`/leads/${leadId}/convert`, {
        client_code: code,
        city: city.trim(),
        state: "Karnataka",
      });
      toast.success("Lead successfully converted to Client!");
      const newClientId = res || code;
      router.push(`/internal/clients/${newClientId}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to convert lead.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    try {
      setIsAddingActivity(true);
      await api.post(`/leads/${leadId}/activities`, {
        activity_type: activityType,
        notes: newNoteText.trim(),
      });
      toast.success("Activity logged.");
      setNewNoteText("");
      await refetchActivities();
    } catch (err: any) {
      toast.error(err?.message || "Failed to record activity.");
    } finally {
      setIsAddingActivity(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!confirm("Are you sure you want to archive this lead?")) return;
    try {
      await api.delete(`/leads/${leadId}`);
      toast.success("Lead archived.");
      router.push("/internal/leads");
    } catch (err: any) {
      toast.error(err?.message || "Failed to archive lead.");
    }
  };

  if (isLeadLoading) {
    return <PageSkeleton />;
  }

  if (leadError || !lead) {
    return (
      <ErrorState
        message={(leadError as any)?.message || "Lead not found"}
        onRetry={() => refetchLead()}
      />
    );
  }

  const name = lead.company_name || lead.title || "Enterprise Lead";
  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const effectiveStatus = (lead.status || "new").toLowerCase();

  return (
    <div className="space-y-6 pb-12">
      <PageReady when={!isLeadLoading && !!lead} />
      {/* Back button */}
      <Link
        href="/internal/leads"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Leads Pipeline</span>
      </Link>

      {/* Top Profile Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="h-14 w-14 rounded-2xl bg-[#EEF2FF] border border-[#CBD5E1] text-[#5B4BDB] font-bold text-lg flex items-center justify-center">
            {initials}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">{name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                {effectiveStatus}
              </span>
            </div>
            <p className="text-[13px] text-[#64748B] mt-0.5">
              Contact: <span className="font-semibold text-[#0F172A]">{lead.contact_name}</span> · {lead.email}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {lead.converted_client_id ? (
            <Link
              href={`/internal/clients/${lead.converted_client_id}`}
              className="h-10 px-4 bg-[#059669] hover:bg-[#047857] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>View Converted Client</span>
            </Link>
          ) : (
            <button
              onClick={() => setIsConvertModalOpen(true)}
              className="h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Convert to Client</span>
            </button>
          )}

          <button
            onClick={handleDeleteLead}
            className="h-10 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors flex items-center space-x-1 text-xs font-medium"
            title="Archive lead"
          >
            <Trash2 className="h-4 w-4" />
            <span>Archive</span>
          </button>
        </div>
      </div>

      {/* Interactive Pipeline Stage Stepper */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-card">
        <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
          PIPELINE STAGE PROGRESSION
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {STAGES.map((s) => {
            const isCurrent = effectiveStatus === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleStageChange(s.id)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold text-center border transition-all ${
                  isCurrent
                    ? "bg-[#5B4BDB] text-white border-[#5B4BDB] shadow-soft"
                    : "bg-[#F8F9FA] hover:bg-[#F1F5F9] text-[#64748B] border-[#E5E7EB]"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Details (2 cols) & Timeline (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col: Details & Specification */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] border-b border-[#E5E7EB] pb-3">
              Lead Information
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#94A3B8] block">Interested Requirement</span>
                <span className="font-semibold text-[#0F172A] text-sm mt-0.5 block">{lead.title}</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block">Estimated Deal Value</span>
                <span className="font-bold text-[#5B4BDB] text-sm mt-0.5 block">
                  ₹{lead.estimated_value_rupees.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[#94A3B8] block">Lead Source</span>
                <span className="font-medium text-[#0F172A] mt-0.5 block capitalize">{lead.source}</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block">Assigned Account Exec</span>
                <span className="font-medium text-[#0F172A] mt-0.5 block">
                  {lead.assigned_to_name || "Unassigned"}
                </span>
              </div>
              <div>
                <span className="text-[#94A3B8] block">Phone</span>
                <span className="font-medium text-[#0F172A] mt-0.5 block">{lead.phone || "Not provided"}</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block">Email</span>
                <span className="font-medium text-[#0F172A] mt-0.5 block">{lead.email}</span>
              </div>
            </div>

            {lead.notes && (
              <div className="pt-3 border-t border-[#E5E7EB]">
                <span className="text-[#94A3B8] text-xs block mb-1">Requirement Notes</span>
                <p className="text-xs text-[#0F172A] bg-[#F8F9FA] p-3 rounded-xl leading-relaxed">
                  {lead.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right col: Activity Stream & Notes */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card flex flex-col h-full">
            <h3 className="text-sm font-bold text-[#0F172A] border-b border-[#E5E7EB] pb-3 mb-4 flex items-center justify-between">
              <span>Activity & Follow-ups</span>
              <span className="text-[11px] font-normal text-[#94A3B8]">
                {activities?.length || 0} events
              </span>
            </h3>

            {/* Add note form */}
            <form onSubmit={handleAddActivity} className="space-y-3 mb-6">
              <div className="flex items-center space-x-2">
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#F8F9FB] border border-[#CBD5E1] rounded-lg text-xs text-[#0F172A]"
                >
                  <option value="note">Note</option>
                  <option value="call">Phone Call</option>
                  <option value="meeting">Meeting</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <textarea
                rows={2}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Log a call, meeting recap, or note..."
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs focus:outline-none focus:border-[#5B4BDB]"
              />
              <button
                type="submit"
                disabled={isAddingActivity || !newNoteText.trim()}
                className="w-full py-1.5 bg-[#5B4BDB] hover:bg-[#4C3EBE] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-soft"
              >
                {isAddingActivity ? "Saving..." : "Log Activity"}
              </button>
            </form>

            {/* Activity Stream */}
            <div className="space-y-4 overflow-y-auto max-h-[400px]">
              {activities && activities.length > 0 ? (
                activities.map((act) => (
                  <div key={act.id} className="text-xs border-l-2 border-[#5B4BDB] pl-3 py-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0F172A] capitalize">
                        {act.activity_type.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">
                        {new Date(act.created_at).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[#64748B] mt-0.5 leading-snug">{act.notes}</p>
                    <span className="text-[10px] text-[#94A3B8] mt-1 block">by {act.user_name}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-[#94A3B8]">
                  No activities recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Converting Lead to Client */}
      {isConvertModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
              <h2 className="text-base font-bold text-[#0F172A]">Convert Lead to Client</h2>
              <button
                onClick={() => setIsConvertModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConvertLead} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Client Code *
                </label>
                <input
                  type="text"
                  required
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value)}
                  placeholder={`CLI-${name.slice(0, 4).toUpperCase()}-001`}
                  className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm uppercase focus:outline-none focus:border-[#5B4BDB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#5B4BDB]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConverting}
                  className="px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-soft"
                >
                  {isConverting ? "Converting..." : "Convert Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
