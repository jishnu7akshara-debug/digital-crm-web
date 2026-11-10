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
  CheckCircle2,
  Clock,
  User,
  DollarSign,
  TrendingUp,
  FileText,
  UserCheck,
  Send,
  Plus,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";

const LEAD_PROFILES: Record<string, any> = {
  "c41b7b3d-2303-4672-8964-61c87afae46f": {
    name: "Sri Venkata Traders",
    contact: "Ravi Kumar",
    email: "ravi@srivenkata.in",
    phone: "+91 98450 11223",
    service: "Website Redesign & Product Catalog",
    status: "new",
    owner: "Meera Sharma",
    value_rupees: 180000,
    source: "Google Search (Organic)",
    notes: "Requires a modern responsive catalog website with WhatsApp ordering integration for retail distribution.",
  },
  "6866993b-1f8f-46c6-a69f-afcfb229fff1": {
    name: "Bloom Dental Clinic",
    contact: "Dr. Anita Rao",
    email: "anita@bloomdental.in",
    phone: "+91 99001 22334",
    service: "Search Engine Optimization & Local Maps",
    status: "contacted",
    owner: "Karan Verma",
    value_rupees: 90000,
    source: "Direct Referral",
    notes: "Wants rank #1 for dental implants in Indiranagar & Koramangala. Initial discovery call completed.",
  },
  "f90ae948-1177-42c9-aec7-5695a3677bd6": {
    name: "Nova Learning",
    contact: "Suresh Patil",
    email: "suresh@novalearning.com",
    phone: "+91 98860 33445",
    service: "Custom EdTech LMS & Student Portal",
    status: "qualified",
    owner: "Meera Sharma",
    value_rupees: 240000,
    source: "Inbound Website Form",
    notes: "Budget approved. Looking for custom video streaming, student attendance tracking, and automated certificate generation.",
  },
  "1a3d3615-3046-4623-a701-666a67e731cc": {
    name: "Greenleaf Organics",
    contact: "Divya Reddy",
    email: "divya@greenleaforganics.in",
    phone: "+91 97410 44556",
    service: "Social Media Growth & Meta Ads",
    status: "proposal",
    owner: "Karan Verma",
    value_rupees: 120000,
    source: "Instagram Campaign",
    notes: "Proposal submitted for 6 months growth retainer. Awaiting sign-off from director.",
  },
  "c49b35b5-defa-420b-a7d3-99e10204a8a5": {
    name: "Lakshmi Silks",
    contact: "Mohan Teja",
    email: "mohan@lakshmisilks.in",
    phone: "+91 98220 55667",
    service: "E-Commerce Webshop & Payment Gateway",
    status: "negotiation",
    owner: "Meera Sharma",
    value_rupees: 350000,
    source: "Trade Expo",
    notes: "Final stage commercial negotiation on payment milestones (50-30-20 vs 40-40-20).",
  },
  "c9dff69d-f2a6-4973-83cd-80bc9e6c7800": {
    name: "Mehta Interiors",
    contact: "Rahul Mehta",
    email: "rahul@mehtainteriors.in",
    phone: "+91 98220 55667",
    service: "Branding, Packaging & Showcase Site",
    status: "qualified",
    owner: "Karan Verma",
    value_rupees: 150000,
    source: "LinkedIn InMail",
    notes: "High-end luxury interior studio in Bandra. High brand aesthetics required.",
  },
  "c591b2a8-aab0-4377-8e5a-2836555d9bc8": {
    name: "Zenith Logistics Ltd",
    contact: "Vikram Malhotra",
    email: "vikram@zenithlogistics.in",
    phone: "+91 98110 88990",
    service: "Enterprise Fleet & Dispatch ERP",
    status: "won",
    owner: "Sai Varshith",
    value_rupees: 450000,
    source: "Enterprise RFP",
    notes: "Converted to official agency client account.",
  },
};

const STAGES = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "proposal", label: "Proposal" },
  { id: "negotiation", label: "Negotiation" },
  { id: "won", label: "Won" },
];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = (params.id as string) || "";

  const [currentStatus, setCurrentStatus] = useState<string>("new");
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [clientCode, setClientCode] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [isConverting, setIsConverting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // New Note
  const [newNoteText, setNewNoteText] = useState("");
  const [timelineNotes, setTimelineNotes] = useState([
    {
      title: "Discovery call scheduled with decision maker",
      time: "Today, 11:30 AM",
      author: "Meera Sharma",
      type: "call",
    },
    {
      title: "Inbound inquiry received via Digital Footprint web portal",
      time: "Nov 5, 2026, 04:15 PM",
      author: "System Bot",
      type: "system",
    },
  ]);

  // Fetch from FastAPI
  const { data: apiData, refetch } = useQuery<any>({
    queryKey: ["lead-detail", leadId],
    queryFn: async () => {
      try {
        const res = await api.get<any>(`/leads/${leadId}`);
        return res;
      } catch (e) {
        return null;
      }
    },
  });

  const fallback = LEAD_PROFILES[leadId] || {
    name: "Enterprise Business Lead",
    contact: "Chief Marketing Officer",
    email: "contact@lead.in",
    phone: "+91 98765 43210",
    service: "Custom Digital Infrastructure",
    status: "new",
    owner: "Meera Sharma",
    value_rupees: 180000,
    source: "Direct Web Inquiry",
    notes: "Interested in full-stack agency delivery and SEO retainers.",
  };

  const name = apiData?.company_name || apiData?.title || fallback.name;
  const contactName = apiData?.contact_name || fallback.contact;
  const email = apiData?.email || fallback.email;
  const phone = apiData?.phone || fallback.phone;
  const service = apiData?.title || fallback.service;
  const owner = apiData?.assigned_to_name || fallback.owner;
  const valueRupees = apiData?.estimated_value_rupees || fallback.value_rupees || 180000;
  const source = apiData?.source || fallback.source;
  const notes = apiData?.notes || fallback.notes;
  const effectiveStatus = (apiData?.status || fallback.status || "new").toLowerCase();

  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConverting(true);
    const code = clientCode.trim() || `CLI-${name.slice(0, 4).toUpperCase()}-001`;

    try {
      const res = await api.post<any>(`/leads/${leadId}/convert`, {
        client_code: code,
        city: city.trim(),
        state: "Karnataka",
      });
      const newClientId = res || code;
      router.push(`/internal/clients/${newClientId}`);
    } catch (e) {
      // In case of demo, navigate directly to clients list
      router.push(`/internal/clients`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setTimelineNotes([
      {
        title: newNoteText.trim(),
        time: "Just now",
        author: "Sai Varshith",
        type: "note",
      },
      ...timelineNotes,
    ]);
    setNewNoteText("");
  };

  const currentStageIndex = STAGES.findIndex((s) => s.id === (currentStatus || effectiveStatus));

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs text-[#64748B]">
        <Link href="/internal/leads" className="hover:text-[#5B4BDB] font-medium flex items-center space-x-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Leads Directory</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#0F172A]">{name}</span>
      </div>

      {notification && (
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] p-3.5 rounded-xl text-xs text-[#065F46] font-semibold flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-[#059669]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#5B4BDB] to-[#3730A3] text-white flex items-center justify-center font-bold text-2xl shadow-soft shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center space-x-2.5 mb-1">
                <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  PROSPECTIVE LEAD
                </span>
                <span className="text-[11px] text-[#94A3B8]">·</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold capitalize">
                  {effectiveStatus}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#059669] text-xs font-semibold">
                  {source}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">{name}</h1>
              <p className="text-[14px] text-[#64748B] mt-0.5 flex items-center gap-2">
                <span>{contactName}</span>
                <span>·</span>
                <span>Assigned to {owner}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setIsConvertModalOpen(true)}
              className="h-10 px-4 bg-[#5B4BDB] hover:bg-[#4C3DC7] text-white text-[13px] font-semibold rounded-xl transition-all shadow-sm flex items-center space-x-1.5 active:scale-95"
            >
              <UserCheck className="h-4 w-4" />
              <span>Convert to Client Account</span>
            </button>
            <Link
              href="/internal/opportunities"
              className="h-10 px-4 bg-white hover:bg-[#F8F9FB] border border-[#CBD5E1] text-[#0F172A] text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
            >
              <TrendingUp className="h-4 w-4 text-[#5B4BDB]" />
              <span>Deals Pipeline</span>
            </Link>
          </div>
        </div>

        {/* Stage Chevron Progress Pipeline */}
        <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-[#64748B] uppercase tracking-wider">
              Lead Progression Stage
            </span>
            <span className="font-bold text-[#5B4BDB]">
              Est. Deal Value: ₹{valueRupees.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {STAGES.map((s, idx) => {
              const isPast = idx <= (currentStageIndex >= 0 ? currentStageIndex : 0);
              const isCurrent = s.id === (currentStatus || effectiveStatus);

              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentStatus(s.id)}
                  className={`py-2 px-3 rounded-xl text-center text-xs font-semibold transition-all border ${
                    isCurrent
                      ? "bg-[#5B4BDB] text-white border-[#5B4BDB] shadow-soft"
                      : isPast
                      ? "bg-[#EEF2FF] text-[#5B4BDB] border-[#C7D2FE]"
                      : "bg-[#F8F9FB] text-[#94A3B8] border-[#E5E7EB] hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1">
                    {isPast && <Check className="h-3 w-3 stroke-[2.5]" />}
                    <span>{s.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Lead Information & Interaction Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Information Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
            <h3 className="font-bold text-base text-[#0F172A] mb-4 pb-3 border-b border-[#E5E7EB] flex items-center justify-between">
              <span>Lead Details & Commercial Scope</span>
              <span className="text-xs font-medium text-[#64748B]">Updated Today</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-[13.5px]">
              <div>
                <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1">
                  Interested Service
                </span>
                <span className="font-semibold text-[#0F172A]">{service}</span>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1">
                  Estimated Contract Value
                </span>
                <span className="font-bold text-base text-[#0F172A]">
                  ₹{valueRupees.toLocaleString("en-IN")}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1">
                  Lead Acquisition Channel
                </span>
                <span className="font-medium text-[#0F172A]">{source}</span>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1">
                  Account Manager / Sales Rep
                </span>
                <span className="font-medium text-[#0F172A]">{owner}</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#E5E7EB]">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider block mb-1.5">
                Initial Inquiry Notes & Scope Requirements
              </span>
              <p className="text-[13.5px] text-[#475569] bg-[#F8F9FD] p-3.5 rounded-xl border border-[#E5E7EB] leading-relaxed">
                {notes}
              </p>
            </div>
          </div>

          {/* Activity Timeline & Notes */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
            <h3 className="font-bold text-base text-[#0F172A] mb-4 pb-3 border-b border-[#E5E7EB]">
              Activity & Interaction Log
            </h3>

            {/* Quick Note Input */}
            <form onSubmit={handleAddNote} className="mb-6">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Log a call, client feedback, or next step..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 h-10 px-3.5 bg-[#F8F9FB] border border-[#CBD5E1] rounded-xl text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15"
                />
                <button
                  type="submit"
                  className="h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5 shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Log Note</span>
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {timelineNotes.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-[13px]">
                  <div className="h-8 w-8 rounded-full bg-[#EEF2FF] text-[#5B4BDB] flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="flex-1 bg-[#F8F9FB] p-3 rounded-xl border border-[#E5E7EB]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[#0F172A]">{item.author}</span>
                      <span className="text-[11px] text-[#94A3B8]">{item.time}</span>
                    </div>
                    <p className="text-[#475569]">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Primary Stakeholder & Direct Actions */}
        <div className="space-y-6">
          {/* Contact Details Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
            <h3 className="font-bold text-base text-[#0F172A] mb-4 pb-3 border-b border-[#E5E7EB]">
              Primary Contact Stakeholder
            </h3>

            <div className="space-y-3.5 text-[13px]">
              <div>
                <div className="text-[11px] font-semibold text-[#94A3B8] uppercase">Full Name</div>
                <div className="font-semibold text-[#0F172A] text-sm mt-0.5">{contactName}</div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-[#94A3B8] uppercase">Direct Email</div>
                <a
                  href={`mailto:${email}`}
                  className="font-medium text-[#5B4BDB] hover:underline flex items-center space-x-1.5 mt-0.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>{email}</span>
                </a>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-[#94A3B8] uppercase">Phone & WhatsApp</div>
                <a
                  href={`tel:${phone}`}
                  className="font-medium text-[#0F172A] hover:text-[#5B4BDB] flex items-center space-x-1.5 mt-0.5"
                >
                  <Phone className="h-3.5 w-3.5 text-[#059669]" />
                  <span>{phone}</span>
                </a>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E5E7EB] space-y-2">
              <a
                href={`https://wa.me/${phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="w-full h-9 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>Chat on WhatsApp</span>
              </a>
              <button
                onClick={() => setIsConvertModalOpen(true)}
                className="w-full h-9 bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>Convert to Official Client</span>
              </button>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
            <h3 className="font-bold text-sm text-[#0F172A] mb-3">Next Action Steps</h3>
            <ul className="space-y-2 text-xs text-[#64748B]">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                <span>Verify company GSTIN & legal registered address</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                <span>Send Digital Footprint Master Service Agreement (MSA)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                <span>Schedule project kickoff with delivery engineering</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Convert to Client Modal */}
      {isConvertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">Convert Lead to Client</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Creates an official client account and primary contact record.
                </p>
              </div>
            </div>

            <form onSubmit={handleConvertLead} className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  disabled
                  value={name}
                  className="w-full h-10 px-3.5 bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl text-[13px] text-[#64748B]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Client Account Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={`CLI-${name.slice(0, 4).toUpperCase()}-001`}
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value)}
                  className="w-full h-10 px-3.5 bg-[#F8F9FB] border border-[#CBD5E1] rounded-xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#5B4BDB]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Registered City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-10 px-3.5 bg-[#F8F9FB] border border-[#CBD5E1] rounded-xl text-[13px] text-[#0F172A] focus:outline-none focus:border-[#5B4BDB]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="px-4 py-2 border border-[#CBD5E1] hover:bg-[#F8F9FB] text-[#64748B] font-semibold text-[13px] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConverting}
                  className="px-5 py-2 bg-[#5B4BDB] hover:bg-[#4C3DC7] text-white font-semibold text-[13px] rounded-xl shadow-soft"
                >
                  {isConverting ? "Converting..." : "Confirm & Open Client 360 →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
