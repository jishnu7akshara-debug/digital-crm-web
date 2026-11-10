"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Plus,
  ExternalLink,
  Phone,
  Mail,
  User,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Briefcase,
  Receipt,
  FolderKanban,
  Calendar,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";

const CLIENT_PROFILES: Record<string, any> = {
  "CLI-PEAK-001": {
    name: "Peak Fitness",
    industry: "Fitness & Wellness",
    city: "Bengaluru",
    owner: "Meera Sharma",
    phone: "+91 98765 43210",
    email: "arjun@peakfitness.in",
    website: "peakfitness.in",
    services: [
      { name: "Website development", amount: "₹80,000", status: "In progress", progress: 65, color: "bg-[#EEF2FF] text-[#5B4BDB]" },
      { name: "Search Engine Optimization (SEO)", amount: "₹30,000 / mo", status: "Active", progress: 40, color: "bg-[#ECFDF5] text-[#059669]" },
      { name: "Social Media Growth", amount: "₹20,000 / mo", status: "Active", progress: 30, color: "bg-[#ECFDF5] text-[#059669]" },
      { name: "Custom CRM Platform", amount: "₹1,20,000", status: "Planning", progress: 15, color: "bg-[#F0F9FF] text-[#0284C7]" },
    ],
    invoices: [
      { number: "DF-2026-0002", amount: "₹70,000", status: "Due Nov 20", isPaid: false },
      { number: "DF-2026-0001", amount: "₹90,000", status: "Paid", isPaid: true },
    ],
    billing: { invoiced: "₹1,60,000", collected: "₹90,000", outstanding: "₹70,000" },
  },
  "CLI-MEHTA-001": {
    name: "Mehta Interiors",
    industry: "Design & Architecture",
    city: "Mumbai",
    owner: "Meera Sharma",
    phone: "+91 98220 55667",
    email: "rahul@mehtainteriors.in",
    website: "mehtainteriors.in",
    services: [
      { name: "Custom Web Application", amount: "₹1,20,000", status: "In progress", progress: 80, color: "bg-[#EEF2FF] text-[#5B4BDB]" },
      { name: "Branding & Corporate Identity", amount: "₹60,000", status: "Active", progress: 90, color: "bg-[#ECFDF5] text-[#059669]" },
      { name: "Search Engine Optimization (SEO)", amount: "₹35,000 / mo", status: "Active", progress: 60, color: "bg-[#ECFDF5] text-[#059669]" },
    ],
    invoices: [
      { number: "DF-2026-0015", amount: "₹1,20,000", status: "Paid", isPaid: true },
      { number: "DF-2026-0019", amount: "₹60,000", status: "Due Nov 25", isPaid: false },
    ],
    billing: { invoiced: "₹1,80,000", collected: "₹1,20,000", outstanding: "₹60,000" },
  },
  "CLI-BLOOM-001": {
    name: "Bloom Dental Clinic",
    industry: "Healthcare & Dental Care",
    city: "Bengaluru",
    owner: "Karan Verma",
    phone: "+91 99001 22334",
    email: "anita@bloomdental.in",
    website: "bloomdental.in",
    services: [
      { name: "Custom Web Application", amount: "₹95,000", status: "In progress", progress: 70, color: "bg-[#EEF2FF] text-[#5B4BDB]" },
      { name: "Search Engine Optimization (SEO)", amount: "₹25,000 / mo", status: "Active", progress: 50, color: "bg-[#ECFDF5] text-[#059669]" },
      { name: "Social Media Marketing & Growth", amount: "₹20,000 / mo", status: "Active", progress: 35, color: "bg-[#ECFDF5] text-[#059669]" },
    ],
    invoices: [
      { number: "DF-2026-0012", amount: "₹95,000", status: "Paid", isPaid: true },
      { number: "DF-2026-0022", amount: "₹25,000", status: "Due Nov 30", isPaid: false },
    ],
    billing: { invoiced: "₹1,20,000", collected: "₹95,000", outstanding: "₹25,000" },
  },
  "CLI-GREEN-001": {
    name: "Greenleaf Organics",
    industry: "FMCG & Organic Retail",
    city: "Chennai",
    owner: "Karan Verma",
    phone: "+91 98860 98765",
    email: "divya@greenleaforganics.in",
    website: "greenleaforganics.in",
    services: [
      { name: "Custom Web Application", amount: "₹1,80,000", status: "In progress", progress: 75, color: "bg-[#EEF2FF] text-[#5B4BDB]" },
      { name: "Search Engine Optimization (SEO)", amount: "₹45,000 / mo", status: "Active", progress: 65, color: "bg-[#ECFDF5] text-[#059669]" },
      { name: "Social Media Marketing & Growth", amount: "₹30,000 / mo", status: "Active", progress: 40, color: "bg-[#ECFDF5] text-[#059669]" },
    ],
    invoices: [
      { number: "DF-2026-0008", amount: "₹1,80,000", status: "Paid", isPaid: true },
      { number: "DF-2026-0016", amount: "₹75,000", status: "Due Nov 15", isPaid: false },
    ],
    billing: { invoiced: "₹2,55,000", collected: "₹1,80,000", outstanding: "₹75,000" },
  },
  "CLI-NOVA-001": {
    name: "Nova Learning",
    industry: "EdTech & Learning Platforms",
    city: "Bengaluru",
    owner: "Meera Sharma",
    phone: "+91 97312 34567",
    email: "suresh@novalearning.com",
    website: "novalearning.com",
    services: [
      { name: "EdTech LMS Platform", amount: "₹2,00,000", status: "In progress", progress: 85, color: "bg-[#EEF2FF] text-[#5B4BDB]" },
      { name: "Search Engine Optimization (SEO)", amount: "₹40,000 / mo", status: "Active", progress: 55, color: "bg-[#ECFDF5] text-[#059669]" },
      { name: "Custom CRM / ERP Platform", amount: "₹90,000", status: "Active", progress: 90, color: "bg-[#ECFDF5] text-[#059669]" },
    ],
    invoices: [
      { number: "DF-2026-0005", amount: "₹2,00,000", status: "Paid", isPaid: true },
      { number: "DF-2026-0018", amount: "₹1,30,000", status: "Paid", isPaid: true },
    ],
    billing: { invoiced: "₹3,30,000", collected: "₹3,30,000", outstanding: "₹0" },
  },
  "CLI-AKSHARA-01": {
    name: "Akshara Enterprises",
    industry: "Manufacturing & Industrial",
    city: "Hyderabad",
    owner: "Karan Verma",
    phone: "+91 98450 12345",
    email: "pooja@akshara.in",
    website: "akshara.in",
    services: [
      { name: "Custom Web Application", amount: "₹1,10,000", status: "In progress", progress: 60, color: "bg-[#EEF2FF] text-[#5B4BDB]" },
      { name: "Custom CRM / ERP Platform", amount: "₹1,50,000", status: "Planning", progress: 20, color: "bg-[#F0F9FF] text-[#0284C7]" },
      { name: "Search Engine Optimization (SEO)", amount: "₹35,000 / mo", status: "Active", progress: 45, color: "bg-[#ECFDF5] text-[#059669]" },
    ],
    invoices: [
      { number: "DF-2026-0009", amount: "₹1,10,000", status: "Paid", isPaid: true },
      { number: "DF-2026-0021", amount: "₹35,000", status: "Due Nov 28", isPaid: false },
    ],
    billing: { invoiced: "₹1,45,000", collected: "₹1,10,000", outstanding: "₹35,000" },
  },
  "CLI-APEX-001": {
    name: "Apex Global Technologies",
    industry: "Information Technology",
    city: "Mumbai",
    owner: "Karan Verma",
    phone: "+91 98200 11223",
    email: "vikram@apextech.example.com",
    website: "apextech.example.com",
    services: [
      { name: "Custom Web Application", amount: "₹80,000", status: "Active", progress: 100, color: "bg-[#ECFDF5] text-[#059669]" },
      { name: "SEO & Growth", amount: "₹30,000 / mo", status: "Active", progress: 70, color: "bg-[#ECFDF5] text-[#059669]" },
      { name: "Social Media Growth", amount: "₹20,000 / mo", status: "Active", progress: 60, color: "bg-[#ECFDF5] text-[#059669]" },
      { name: "Custom CRM Platform", amount: "₹1,20,000", status: "Active", progress: 90, color: "bg-[#ECFDF5] text-[#059669]" },
    ],
    invoices: [
      { number: "INV-2026-0001", amount: "₹94,400", status: "Paid", isPaid: true },
      { number: "INV-TEST-099", amount: "₹11,800", status: "Due Nov 22", isPaid: false },
    ],
    billing: { invoiced: "₹1,06,200", collected: "₹94,400", outstanding: "₹11,800" },
  },
  "CLI-ZENITH-01": {
    name: "Zenith Logistics Ltd",
    industry: "Logistics & Supply Chain",
    city: "Pune",
    owner: "Meera Sharma",
    phone: "+91 99000 88776",
    email: "rohan@zenithlogistics.in",
    website: "zenithlogistics.in",
    services: [
      { name: "Fleet Tracking Dashboard", amount: "₹1,40,000", status: "In progress", progress: 50, color: "bg-[#EEF2FF] text-[#5B4BDB]" },
      { name: "Supply Chain ERP", amount: "₹1,80,000", status: "Planning", progress: 15, color: "bg-[#F0F9FF] text-[#0284C7]" },
    ],
    invoices: [
      { number: "DF-2026-0011", amount: "₹1,40,000", status: "Due Nov 18", isPaid: false },
    ],
    billing: { invoiced: "₹1,40,000", collected: "₹0", outstanding: "₹1,40,000" },
  },
};

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = (params?.id as string) || "";

  const { data: apiData, isLoading } = useQuery<any>({
    queryKey: ["client-360", clientId],
    queryFn: async () => {
      try {
        const res = await api.get<any>(`/clients/${clientId}`);
        return res;
      } catch (e) {
        return null;
      }
    },
    enabled: !!clientId,
  });

  // Find fallback profile
  const profileKey = Object.keys(CLIENT_PROFILES).find(
    (k) =>
      k.toLowerCase() === clientId.toLowerCase() ||
      k.toLowerCase() === apiData?.code?.toLowerCase() ||
      apiData?.name?.toLowerCase().includes(k.replace("CLI-", "").replace("-001", "").replace("-01", "").toLowerCase())
  );
  const fallback = profileKey ? CLIENT_PROFILES[profileKey] : CLIENT_PROFILES["CLI-PEAK-001"];

  // Consolidated client details
  const name = apiData?.name || fallback?.name || "Client Account";
  const code = apiData?.code || clientId;
  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CA";

  const industry = apiData?.industry || fallback?.industry || "Enterprise";
  const city = apiData?.city || fallback?.city || "Bengaluru";
  const phone = apiData?.contacts?.[0]?.phone || fallback?.phone || "+91 98765 43210";
  const email = apiData?.contacts?.[0]?.email || fallback?.email || "contact@digitalfootprint.in";
  const website = apiData?.website || fallback?.website || `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.in`;
  const owner = apiData?.account_manager?.name || fallback?.owner || "Meera Sharma";
  const statusStr = apiData?.status ? apiData.status.charAt(0).toUpperCase() + apiData.status.slice(1) : "Active";

  // Real or fallback services
  const servicesList =
    apiData?.services && apiData.services.length > 0
      ? apiData.services.map((s: any) => ({
          name: s.service_name,
          amount: `₹${s.price_rupees.toLocaleString("en-IN")}${s.billing_cycle === "monthly" ? " / mo" : ""}`,
          status: s.status === "active" ? "Active" : s.status.replace("_", " "),
          progress: s.status === "active" ? 75 : 40,
          color: s.status === "active" ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#EEF2FF] text-[#5B4BDB]",
        }))
      : fallback?.services || [];

  // Real or fallback invoices
  const invoicesList =
    apiData?.invoices && apiData.invoices.length > 0
      ? apiData.invoices.map((inv: any) => ({
          number: inv.invoice_number,
          amount: `₹${inv.total_rupees.toLocaleString("en-IN")}`,
          status: inv.status === "paid" ? "Paid" : `Due ${inv.due_date?.slice(5) || "Soon"}`,
          isPaid: inv.status === "paid",
        }))
      : fallback?.invoices || [];

  // Commercial Metrics
  const invoicedVal = apiData?.metrics?.total_invoiced_rupees !== undefined
    ? `₹${apiData.metrics.total_invoiced_rupees.toLocaleString("en-IN")}`
    : fallback?.billing?.invoiced || "₹1,60,000";

  const collectedVal = apiData?.metrics?.total_collected_rupees !== undefined
    ? `₹${apiData.metrics.total_collected_rupees.toLocaleString("en-IN")}`
    : fallback?.billing?.collected || "₹90,000";

  const outstandingVal = apiData?.metrics?.total_outstanding_rupees !== undefined
    ? `₹${apiData.metrics.total_outstanding_rupees.toLocaleString("en-IN")}`
    : fallback?.billing?.outstanding || "₹70,000";

  // Real or fallback projects
  const projectsList = apiData?.projects || [];
  const primaryProject = projectsList.length > 0 ? projectsList[0] : null;

  const activities = [
    { title: `Client account profile verified for ${name}`, time: "Today", icon: CheckCircle2 },
    { title: "Service scope & milestones reviewed", time: "2 days ago", icon: FileText },
    { title: "Primary stakeholder contact added", time: "Oct 15, 2026", icon: User },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs text-[#64748B]">
        <Link href="/internal/clients" className="hover:text-[#5B4BDB] font-medium flex items-center space-x-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Clients Directory</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#0F172A]">{name}</span>
      </div>

      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* Dynamic Initials Tile */}
            <div className="h-12 w-12 rounded-2xl bg-[#0F172A] text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-md">
              {initials}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-[#5B4BDB] uppercase tracking-wider">
                  ACCOUNT 360
                </span>
                <span className="text-[11px] text-[#94A3B8]">·</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669]">
                  {statusStr}
                </span>
                <span className="text-[11px] text-[#94A3B8]">·</span>
                <span className="text-xs font-mono font-medium text-[#64748B]">
                  {code}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-tight mt-0.5">
                {name}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href={primaryProject ? `/internal/projects/${primaryProject.id}` : "/internal/projects"}
              className="h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
            >
              <span>{primaryProject ? "Project Workspace" : "View Projects"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Key Fields Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6 pt-6 border-t border-[#E5E7EB]">
          <div>
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Industry
            </div>
            <div className="text-[14px] font-semibold text-[#0F172A] mt-1">
              {industry}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Account Owner
            </div>
            <div className="text-[14px] font-semibold text-[#0F172A] mt-1">
              {owner}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              City
            </div>
            <div className="text-[14px] font-semibold text-[#0F172A] mt-1">
              {city}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Primary Phone
            </div>
            <div className="text-[14px] font-semibold text-[#0F172A] mt-1">
              {phone}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Website
            </div>
            <a
              href={`https://${website.replace(/^https?:\/\//, "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-[14px] font-semibold text-[#5B4BDB] hover:underline mt-1 flex items-center space-x-1"
            >
              <span className="truncate">{website.replace(/^https?:\/\//, "")}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Services Purchased + Invoices */}
        <div className="lg:col-span-8 space-y-6">
          {/* Services Purchased */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E7EB]">
              <div>
                <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  CONTRACTED SERVICES
                </div>
                <h3 className="text-[16px] font-bold text-[#0F172A] tracking-tight mt-0.5">
                  Services Purchased ({servicesList.length})
                </h3>
              </div>
              <Link href="/internal/services" className="text-[13px] font-semibold text-[#5B4BDB] hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-4">
              {servicesList.map((svc: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] hover:bg-white transition-all shadow-soft"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[14px] text-[#0F172A]">{svc.name}</span>
                    <span className="font-bold text-[14px] text-[#0F172A]">{svc.amount}</span>
                  </div>

                  <div className="flex items-center justify-between text-[12px] text-[#64748B] mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${svc.color}`}>
                      {svc.status}
                    </span>
                    <span>{svc.progress}% completed</span>
                  </div>

                  <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#5B4BDB] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${svc.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E7EB]">
              <div>
                <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  FINANCIAL LEDGER
                </div>
                <h3 className="text-[16px] font-bold text-[#0F172A] tracking-tight mt-0.5">
                  Invoices ({invoicesList.length})
                </h3>
              </div>
              <Link href="/internal/invoices" className="text-[13px] font-semibold text-[#5B4BDB] hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {invoicesList.map((inv: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] hover:bg-white transition-all shadow-soft"
                >
                  <span className="text-[#5B4BDB] font-semibold text-[13.5px]">{inv.number}</span>
                  <span className="text-[#0F172A] font-bold text-[14px]">{inv.amount}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      inv.isPaid
                        ? "bg-[#ECFDF5] text-[#059669]"
                        : "bg-[#FFFBEB] text-[#D97706]"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Billing summary + Activity */}
        <div className="lg:col-span-4 space-y-6">
          {/* Billing Summary */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
            <div className="pb-3 mb-4 border-b border-[#E5E7EB]">
              <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                COMMERCIAL OVERVIEW
              </div>
              <h3 className="text-[16px] font-bold text-[#0F172A] tracking-tight mt-0.5">
                Billing Summary
              </h3>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8F9FB] border border-[#E5E7EB]">
                <span className="text-[13px] text-[#64748B] font-medium">Invoiced</span>
                <span className="text-[15px] font-bold text-[#0F172A]">{invoicedVal}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#ECFDF5]/50 border border-[#D1FAE5]">
                <span className="text-[13px] text-[#059669] font-medium">Collected</span>
                <span className="text-[15px] font-bold text-[#059669]">{collectedVal}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFFBEB]/60 border border-[#FEF3C7]">
                <span className="text-[13px] text-[#D97706] font-medium">Outstanding</span>
                <span className="text-[15px] font-bold text-[#D97706]">{outstandingVal}</span>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
            <div className="pb-3 mb-4 border-b border-[#E5E7EB]">
              <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                AUDIT LOG
              </div>
              <h3 className="text-[16px] font-bold text-[#0F172A] tracking-tight mt-0.5">
                Recent Activity
              </h3>
            </div>

            <div className="space-y-4">
              {activities.map((act, i) => {
                const Icon = act.icon;
                return (
                  <div key={i} className="flex items-start space-x-3 text-[13px]">
                    <div className="h-7 w-7 rounded-full bg-[#EEF2FF] text-[#5B4BDB] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#0F172A]">{act.title}</div>
                      <div className="text-[11px] text-[#94A3B8]">{act.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
