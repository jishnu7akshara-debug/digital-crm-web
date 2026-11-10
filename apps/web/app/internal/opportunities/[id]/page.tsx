"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  DollarSign,
  TrendingUp,
  FileText,
  FolderPlus,
  Receipt,
  FileSignature,
  ArrowRight,
  Send,
  MessageSquare,
  Sparkles,
  Check,
  Percent,
} from "lucide-react";

interface OppProfile {
  id: string;
  title: string;
  client: string;
  clientId?: string;
  service: string;
  value_rupees: number;
  stage: "leads" | "qualified" | "proposal" | "negotiation" | "won";
  expected_close: string;
  probability: number;
  owner: string;
  description: string;
  deliverables: string[];
}

const OPPORTUNITY_DATA: Record<string, OppProfile> = {
  "opp-1": {
    id: "opp-1",
    title: "E-Commerce Website Redesign",
    client: "Sashikiran Surveyors",
    clientId: "CLI-PEAK-001",
    service: "Websites",
    value_rupees: 180000,
    stage: "leads",
    expected_close: "Dec 15, 2026",
    probability: 30,
    owner: "Sai Varshith",
    description: "Complete overhaul of commercial survey booking portal with responsive client dashboards and payment gateway.",
    deliverables: [
      "Custom UI/UX System in Figma",
      "Next.js App Router & Tailwind CSS Frontend",
      "Automated Booking & Survey Scheduling Engine",
      "Razorpay / Stripe Payment Integration",
    ],
  },
  "opp-2": {
    id: "opp-2",
    title: "Healthcare Booking Portal",
    client: "MedPulse Clinic",
    service: "Websites",
    value_rupees: 240000,
    stage: "leads",
    expected_close: "Dec 20, 2026",
    probability: 25,
    owner: "Priya Sharma",
    description: "Telehealth video appointment portal with patient record vault and automated WhatsApp notifications.",
    deliverables: [
      "Patient Appointment Booking Flow",
      "Doctor Consultation Calendar & Slot Lock",
      "Prescription Storage Vault",
      "SMS & WhatsApp Notification Triggers",
    ],
  },
  "opp-3": {
    id: "opp-3",
    title: "Quarterly SEO & Growth Retainer",
    client: "Talenty Consulting",
    service: "Digital Marketing",
    value_rupees: 210000,
    stage: "qualified",
    expected_close: "Nov 30, 2026",
    probability: 50,
    owner: "Rahul Verma",
    description: "Comprehensive SEO audit, 25 target high-intent search keywords, blog strategy, and backlink authority building.",
    deliverables: [
      "On-Page Technical SEO Audit & Core Web Vitals Fix",
      "Monthly 8 Long-Form Thought Leadership Articles",
      "High Authority Backlink Building (DA 50+)",
      "Weekly Ranking & Search Console Dashboard",
    ],
  },
  "opp-4": {
    id: "opp-4",
    title: "Paid Ads Performance Setup",
    client: "Urban Nest Interiors",
    service: "Digital Marketing",
    value_rupees: 400000,
    stage: "qualified",
    expected_close: "Dec 05, 2026",
    probability: 60,
    owner: "Sai Varshith",
    description: "High-ROI Google Search and Meta Instagram lead campaigns targeting luxury interior homeowners.",
    deliverables: [
      "Google Ads Search & Display Campaign Setup",
      "Meta Ads Video Creative Production",
      "High-Converting Landing Page Design",
      "Conversion API & Offline Lead Tracking",
    ],
  },
  "opp-5": {
    id: "opp-5",
    title: "Custom CRM & Lead Routing",
    client: "KalpaTouch",
    service: "CRM / ERP",
    value_rupees: 450000,
    stage: "proposal",
    expected_close: "Nov 25, 2026",
    probability: 70,
    owner: "Ananya Iyer",
    description: "Dedicated sales pipeline CRM with WhatsApp lead capture, automated rep assignment, and invoice generation.",
    deliverables: [
      "Role-Based Sales & Management Dashboards",
      "Automated Round-Robin Lead Routing",
      "Multi-Currency Invoicing & Tax Calculations",
      "Real-Time Sales Velocity Reports",
    ],
  },
  "opp-6": {
    id: "opp-6",
    title: "Inventory & Billing ERP",
    client: "Apex Logistics",
    service: "CRM / ERP",
    value_rupees: 300000,
    stage: "proposal",
    expected_close: "Dec 10, 2026",
    probability: 65,
    owner: "Priya Sharma",
    description: "Multi-warehouse dispatch inventory tracking with automated GST e-way bill generation.",
    deliverables: [
      "Multi-Warehouse Stock Ledger",
      "Barcode & QR Code Dispatch Scanner",
      "Automated E-Way Bill Integration",
      "Supplier PO & Purchase Order Flow",
    ],
  },
  "opp-7": {
    id: "opp-7",
    title: "Brand Identity & Packaging",
    client: "Delights Gourmet",
    service: "Branding & Media",
    value_rupees: 250000,
    stage: "negotiation",
    expected_close: "Nov 22, 2026",
    probability: 80,
    owner: "Sai Varshith",
    description: "Complete visual identity design, logo guidelines, packaging print templates, and social media media kit.",
    deliverables: [
      "Primary & Secondary Brand Logos & Wordmarks",
      "Pantone Color Palette & Typography Guidelines",
      "12 SKU Packaging Print Die-Lines",
      "Brand Guidelines Brandbook PDF",
    ],
  },
  "opp-8": {
    id: "opp-8",
    title: "Product Catalogue & Digital Launch",
    client: "Aroma Dew",
    service: "Branding & Media",
    value_rupees: 180000,
    stage: "won",
    expected_close: "Nov 05, 2026",
    probability: 100,
    owner: "Sai Varshith",
    description: "Perfume luxury fragrance lookbook, high-definition 3D product renders, and digital launch campaign.",
    deliverables: [
      "Interactive 32-Page Digital Catalog",
      "3D Product Renderings & Mockups",
      "Social Media Launch Graphics & Reels",
      "Influencer Media PR Kit",
    ],
  },
};

const STAGES = [
  { key: "leads", label: "Leads" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal", label: "Proposal" },
  { key: "negotiation", label: "Negotiation" },
  { key: "won", label: "Won" },
] as const;

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const oppId = (params.id as string) || "opp-1";

  const initialOpp = OPPORTUNITY_DATA[oppId] || {
    id: oppId,
    title: "Enterprise Digital Opportunity",
    client: "Strategic Client Account",
    service: "Websites",
    value_rupees: 250000,
    stage: "proposal",
    expected_close: "Dec 15, 2026",
    probability: 70,
    owner: "Sai Varshith",
    description: "Digital transformation and ongoing full-stack technology delivery with dedicated project management.",
    deliverables: [
      "Custom Design System",
      "Next.js & FastAPI Architecture",
      "Production Deployment SLA",
      "Enterprise Retainer Scope",
    ],
  };

  const [opp, setOpp] = useState<OppProfile>(initialOpp);
  const [notification, setNotification] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [notesList, setNotesList] = useState([
    {
      title: "Commercial proposal reviewed with client leadership",
      time: "Yesterday, 03:30 PM",
      author: opp.owner,
    },
    {
      title: "Discovery scope requirements verified and deliverables outlined",
      time: "Nov 4, 2026",
      author: "Sai Varshith",
    },
  ]);

  const handleStageClick = (newStage: OppProfile["stage"]) => {
    setOpp((prev) => ({
      ...prev,
      stage: newStage,
      probability: newStage === "won" ? 100 : newStage === "negotiation" ? 80 : newStage === "proposal" ? 65 : 40,
    }));
    setNotification(`Deal stage updated to ${newStage.toUpperCase()}`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotesList([
      {
        title: newNote.trim(),
        time: "Just now",
        author: "Sai Varshith",
      },
      ...notesList,
    ]);
    setNewNote("");
  };

  const currentStageIndex = STAGES.findIndex((s) => s.key === opp.stage);

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs text-[#64748B]">
        <Link
          href="/internal/opportunities"
          className="hover:text-[#5B4BDB] font-medium flex items-center space-x-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Opportunities Pipeline</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#0F172A]">{opp.title}</span>
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
          <div>
            <div className="flex items-center space-x-2.5 mb-1">
              <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                DEAL OPPORTUNITY
              </span>
              <span className="text-[11px] text-[#94A3B8]">·</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
                {opp.service}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#059669] text-xs font-semibold capitalize">
                {opp.stage} Stage
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">{opp.title}</h1>
            <p className="text-[14px] text-[#64748B] mt-0.5 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#94A3B8]" />
              <Link
                href={`/internal/clients?search=${encodeURIComponent(opp.client)}`}
                className="font-semibold text-[#5B4BDB] hover:underline"
              >
                {opp.client}
              </Link>
              <span>·</span>
              <span>Owner: {opp.owner}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Link
              href="/internal/projects/proj-peak-web"
              className="h-10 px-4 bg-[#5B4BDB] hover:bg-[#4C3DC7] text-white text-[13px] font-semibold rounded-xl transition-all shadow-sm flex items-center space-x-1.5 active:scale-95"
            >
              <FolderPlus className="h-4 w-4" />
              <span>Convert to Project</span>
            </Link>
            <Link
              href="/internal/invoices"
              className="h-10 px-4 bg-white hover:bg-[#F8F9FB] border border-[#CBD5E1] text-[#0F172A] text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
            >
              <Receipt className="h-4 w-4 text-[#5B4BDB]" />
              <span>Issue Invoice</span>
            </Link>
          </div>
        </div>

        {/* Stage Chevron Progress Pipeline */}
        <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-[#64748B] uppercase tracking-wider">
              Deal Stage & Velocity
            </span>
            <span className="font-bold text-[#5B4BDB]">
              Win Probability: {opp.probability}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {STAGES.map((s, idx) => {
              const isPast = idx <= currentStageIndex;
              const isCurrent = s.key === opp.stage;

              return (
                <button
                  key={s.key}
                  onClick={() => handleStageClick(s.key)}
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

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Deal Value (INR)
          </span>
          <div className="text-2xl font-bold text-[#0F172A] mt-2">
            ₹{opp.value_rupees.toLocaleString("en-IN")}
          </div>
          <span className="text-xs font-semibold text-[#059669] mt-1 block">
            100% Milestone Based
          </span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Win Probability
          </span>
          <div className="text-2xl font-bold text-[#5B4BDB] mt-2">
            {opp.probability}%
          </div>
          <span className="text-xs font-semibold text-[#64748B] mt-1 block">
            Based on stage velocity
          </span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Target Close Date
          </span>
          <div className="text-lg font-bold text-[#0F172A] mt-2">
            {opp.expected_close}
          </div>
          <span className="text-xs font-semibold text-[#64748B] mt-1 block">
            Q4 2026 Target
          </span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Deal Rep / Owner
          </span>
          <div className="text-lg font-bold text-[#0F172A] mt-2">
            {opp.owner}
          </div>
          <span className="text-xs font-semibold text-[#059669] mt-1 block">
            Sales & Delivery Lead
          </span>
        </div>
      </div>

      {/* Main Grid: Scope & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Scope Specification & Deliverables */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
            <h3 className="font-bold text-base text-[#0F172A] mb-4 pb-3 border-b border-[#E5E7EB]">
              Scope Specification & Deliverables
            </h3>
            <p className="text-[13.5px] text-[#475569] leading-relaxed mb-5">
              {opp.description}
            </p>

            <div className="space-y-3">
              {opp.deliverables.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-3 p-3 bg-[#F8F9FD] rounded-xl border border-[#E5E7EB] text-[13px] text-[#0F172A]"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
            <h3 className="font-bold text-base text-[#0F172A] mb-4 pb-3 border-b border-[#E5E7EB]">
              Deal Activity & Progress History
            </h3>

            {/* Quick Note Input */}
            <form onSubmit={handleAddNote} className="mb-6">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Record call summary, meeting feedback, or update..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
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

            <div className="space-y-3">
              {notesList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-3 p-3 bg-[#F8F9FB] rounded-xl border border-[#E5E7EB] text-[13px]"
                >
                  <div className="h-8 w-8 rounded-full bg-[#EEF2FF] text-[#5B4BDB] flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
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

        {/* Right 1 Col: Quick Actions & Links */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
            <h3 className="font-bold text-base text-[#0F172A] mb-4 pb-3 border-b border-[#E5E7EB]">
              Deal Execution Actions
            </h3>

            <div className="space-y-2.5">
              <Link
                href="/internal/projects/proj-peak-web"
                className="w-full h-10 px-4 bg-[#5B4BDB] hover:bg-[#4C3DC7] text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-between"
              >
                <span>Open Project Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/internal/agreements"
                className="w-full h-10 px-4 bg-white hover:bg-[#F8F9FB] border border-[#CBD5E1] text-[#0F172A] text-xs font-semibold rounded-xl transition-colors shadow-soft flex items-center justify-between"
              >
                <span>Draft Service Agreement (MSA)</span>
                <FileSignature className="h-3.5 w-3.5 text-[#5B4BDB]" />
              </Link>
              <Link
                href="/internal/invoices"
                className="w-full h-10 px-4 bg-white hover:bg-[#F8F9FB] border border-[#CBD5E1] text-[#0F172A] text-xs font-semibold rounded-xl transition-colors shadow-soft flex items-center justify-between"
              >
                <span>Generate Advance Invoice</span>
                <Receipt className="h-3.5 w-3.5 text-[#059669]" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
            <h3 className="font-bold text-sm text-[#0F172A] mb-3">Client Information</h3>
            <div className="space-y-2.5 text-xs text-[#64748B]">
              <div>
                <span className="font-semibold text-[#0F172A] block text-[13px]">{opp.client}</span>
                <span>Commercial Client Account</span>
              </div>
              <div className="pt-2 border-t border-[#E5E7EB]">
                <Link
                  href={`/internal/clients?search=${encodeURIComponent(opp.client)}`}
                  className="text-[#5B4BDB] hover:underline font-semibold flex items-center space-x-1"
                >
                  <span>View Client 360 Profile</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
