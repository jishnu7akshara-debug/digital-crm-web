"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Briefcase,
  Monitor,
  Megaphone,
  Layers,
  Palette,
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  ArrowRight,
  Building2,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  Filter,
} from "lucide-react";

interface SubscribedClient {
  id: string;
  name: string;
  contact: string;
  plan: string;
  value_rupees: number;
  renewal: string;
  status: "active" | "expiring_soon";
}

interface ServiceProject {
  id: string;
  name: string;
  client: string;
  progress: number;
  due_date: string;
  status: "In Progress" | "Review" | "Completed" | "Planning";
}

interface ServiceDetails {
  category: string;
  slug: string;
  name: string;
  tagline: string;
  clients_count: number;
  mtd_revenue: number;
  revenue_share_percent: number;
  active_projects_count: number;
  sla_delivery: string;
  pricing_model: string;
  base_price_rupees: number;
  description: string;
  icon: any;
  deliverables: string[];
  clients: SubscribedClient[];
  projects: ServiceProject[];
}

const SERVICES_DATA: Record<string, ServiceDetails> = {
  websites: {
    category: "Websites",
    slug: "websites",
    name: "Websites & Web Applications",
    tagline: "Custom high-performance web applications, portals, and e-commerce platforms.",
    clients_count: 56,
    mtd_revenue: 390000,
    revenue_share_percent: 40,
    active_projects_count: 14,
    sla_delivery: "3-4 Weeks",
    pricing_model: "Fixed Milestone / Retainer",
    base_price_rupees: 80000,
    description: "Production-grade Next.js, React, Tailwind, and REST API integration with enterprise SEO, sub-second load times, and custom administration dashboards.",
    icon: Monitor,
    deliverables: [
      "Custom Figma UI/UX Design System",
      "Next.js App Router & React 19 Frontend",
      "FastAPI / Node.js Backend & PostgreSQL Database",
      "Role-Based Client & Staff Portal",
      "Automated CI/CD Deployment & 99.9% SLA Hosting",
      "1-Year Maintenance & Security Patching",
    ],
    clients: [
      { id: "c-1", name: "Sashikiran Surveyors", contact: "Sashikiran R.", plan: "Web Portal + Maintenance", value_rupees: 180000, renewal: "Jan 2027", status: "active" },
      { id: "c-2", name: "Talenty Consulting", contact: "Priya Sharma", plan: "Corporate Showcase", value_rupees: 120000, renewal: "Feb 2027", status: "active" },
      { id: "c-3", name: "Aroma Dew", contact: "Kavita Rao", plan: "E-Commerce Webshop", value_rupees: 150000, renewal: "Dec 2026", status: "expiring_soon" },
      { id: "c-4", name: "MedPulse Clinic", contact: "Dr. Vikram Seth", plan: "Patient Booking Portal", value_rupees: 240000, renewal: "Mar 2027", status: "active" },
      { id: "c-5", name: "Skyline Infrastructure", contact: "Rahul Nair", plan: "B2B Showcase Portal", value_rupees: 95000, renewal: "Apr 2027", status: "active" },
    ],
    projects: [
      { id: "p-1", name: "Sashikiran Surveyors – Website", client: "Sashikiran Surveyors", progress: 80, due_date: "Nov 10, 2026", status: "In Progress" },
      { id: "p-2", name: "Aroma Dew – Catalogue & Store", client: "Aroma Dew", progress: 100, due_date: "Nov 5, 2026", status: "Completed" },
      { id: "p-3", name: "MedPulse – Telehealth Portal", client: "MedPulse Clinic", progress: 35, due_date: "Dec 15, 2026", status: "In Progress" },
    ],
  },
  digital_marketing: {
    category: "Digital Marketing",
    slug: "digital_marketing",
    name: "Search & Growth Marketing",
    tagline: "Data-driven SEO, Google Ads PPC management, and performance marketing funnels.",
    clients_count: 38,
    mtd_revenue: 243750,
    revenue_share_percent: 25,
    active_projects_count: 11,
    sla_delivery: "Continuous Monthly Retainer",
    pricing_model: "Monthly Retainer",
    base_price_rupees: 30000,
    description: "Complete organic search rankings, technical on-page & off-page SEO, conversion rate optimization, and high-ROI paid ad campaign management.",
    icon: Megaphone,
    deliverables: [
      "Technical SEO Audit & Schema Markup",
      "High-Intent Keyword Map & Content Briefs",
      "Google Search Console & GA4 Setup",
      "Google Ads Search & Display Campaigns",
      "Monthly Organic Traffic & Ranking Reports",
      "Conversion Funnel Optimization",
    ],
    clients: [
      { id: "c-6", name: "Talenty Consulting", contact: "Priya Sharma", plan: "Quarterly SEO Retainer", value_rupees: 210000, renewal: "Dec 2026", status: "active" },
      { id: "c-7", name: "Peak Fitness", contact: "Arjun S.", plan: "SEO + Local Map Pack", value_rupees: 90000, renewal: "Jan 2027", status: "active" },
      { id: "c-8", name: "Delights Gourmet", contact: "Sameer Joshi", plan: "Performance Ads", value_rupees: 180000, renewal: "Nov 2026", status: "expiring_soon" },
    ],
    projects: [
      { id: "p-4", name: "Talenty Consulting – SEO Sprint", client: "Talenty Consulting", progress: 60, due_date: "Nov 15, 2026", status: "In Progress" },
      { id: "p-5", name: "Peak Fitness – Local SEO", client: "Peak Fitness", progress: 40, due_date: "Nov 30, 2026", status: "In Progress" },
    ],
  },
  crm_erp: {
    category: "CRM / ERP",
    slug: "crm_erp",
    name: "Custom CRM & ERP Architecture",
    tagline: "Bespoke internal operating systems, inventory management, and automated sales workflows.",
    clients_count: 22,
    mtd_revenue: 146250,
    revenue_share_percent: 15,
    active_projects_count: 6,
    sla_delivery: "6-8 Weeks",
    pricing_model: "Custom Scope",
    base_price_rupees: 120000,
    description: "Multi-tenant operational platforms built for Indian businesses with GST compliance, WhatsApp API routing, automated lead assignment, and role-based permissions.",
    icon: Layers,
    deliverables: [
      "Custom Data Schema & RBAC Permissions",
      "Lead Capture & Sales Pipeline Kanban",
      "Indian GST Invoicing (CGST/SGST/IGST)",
      "WhatsApp & SMS Notification Gateways",
      "Client Self-Service Approval Portal",
      "Automated Daily Database Backups",
    ],
    clients: [
      { id: "c-9", name: "KalpaTouch", contact: "Ananya Iyer", plan: "Enterprise CRM Suite", value_rupees: 450000, renewal: "Mar 2027", status: "active" },
      { id: "c-10", name: "Apex Logistics Ltd", contact: "Vikram Mehta", plan: "Fleet & Inventory ERP", value_rupees: 300000, renewal: "Feb 2027", status: "active" },
      { id: "c-11", name: "FastTrack Courier", contact: "Deepak S.", plan: "Delivery Tracker API", value_rupees: 120000, renewal: "Jan 2027", status: "active" },
    ],
    projects: [
      { id: "p-6", name: "KalpaTouch – CRM Setup", client: "KalpaTouch", progress: 40, due_date: "Nov 20, 2026", status: "In Progress" },
      { id: "p-7", name: "Apex Logistics – ERP Flow", client: "Apex Logistics Ltd", progress: 95, due_date: "Nov 12, 2026", status: "Review" },
    ],
  },
  branding: {
    category: "Branding & Media",
    slug: "branding",
    name: "Corporate Identity & Creative Media",
    tagline: "Memorable brand identities, packaging, product catalogues, and high-impact corporate video.",
    clients_count: 18,
    mtd_revenue: 97500,
    revenue_share_percent: 10,
    active_projects_count: 5,
    sla_delivery: "2-3 Weeks",
    pricing_model: "Fixed Project",
    base_price_rupees: 45000,
    description: "Logo suites, comprehensive brand guidelines, corporate typography, product packaging design, and 3D product renders that command market presence.",
    icon: Palette,
    deliverables: [
      "Primary & Secondary Logo Architecture",
      "Color Palette, Typography & Usage Rules",
      "Corporate Stationery & Digital Asset Kit",
      "Product Packaging & Label Artwork",
      "Catalogue & Brochure Print Ready Files",
      "Social Media Post & Banner Templates",
    ],
    clients: [
      { id: "c-12", name: "Delights Gourmet", contact: "Sameer Joshi", plan: "Brand Identity Suite", value_rupees: 250000, renewal: "May 2027", status: "active" },
      { id: "c-13", name: "Aroma Dew", contact: "Kavita Rao", plan: "Product Catalogue Launch", value_rupees: 180000, renewal: "Jun 2027", status: "active" },
      { id: "c-14", name: "Skyline Infra", contact: "Rahul Nair", plan: "Corporate Media Kit", value_rupees: 150000, renewal: "Apr 2027", status: "active" },
    ],
    projects: [
      { id: "p-8", name: "Delights – Branding & Media", client: "Delights", progress: 90, due_date: "Nov 8, 2026", status: "Review" },
      { id: "p-9", name: "Aroma Dew – Catalogue", client: "Aroma Dew", progress: 100, due_date: "Nov 5, 2026", status: "Completed" },
    ],
  },
  others: {
    category: "Others",
    slug: "others",
    name: "EdTech Platforms & Cloud Consulting",
    tagline: "Specialized LMS systems, cloud infrastructure setup, automated student portals, and managed IT services.",
    clients_count: 26,
    mtd_revenue: 97500,
    revenue_share_percent: 10,
    active_projects_count: 2,
    sla_delivery: "4 Weeks",
    pricing_model: "Custom Scope",
    base_price_rupees: 60000,
    description: "Specialized technology solutions: automated learning management systems, secure exam testing portals, cloud cost optimization, and ongoing operational support.",
    icon: Sparkles,
    deliverables: [
      "Learning Management System (LMS) Architecture",
      "Video Streaming & Adaptive Bitrate CDN",
      "Automated Certificate Generation & Verifier",
      "Cloud Infrastructure Hardening & Backups",
      "Enterprise SSO & Active Directory Integration",
      "24/7 Server Monitoring & Incident Response SLA",
    ],
    clients: [
      { id: "c-16", name: "EduSpark Academy", contact: "Dr. N. Murthy", plan: "LMS & Video Streaming", value_rupees: 280000, renewal: "Feb 2027", status: "active" },
      { id: "c-17", name: "Prime Skills Institute", contact: "Rekha Das", plan: "Student Assessment Portal", value_rupees: 160000, renewal: "Jan 2027", status: "active" },
    ],
    projects: [
      { id: "p-10", name: "EduSpark – Live Classroom Engine", client: "EduSpark Academy", progress: 50, due_date: "Dec 20, 2026", status: "In Progress" },
    ],
  },
};

function ServicesView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get("category");

  const normalizedParam = categoryParam ? categoryParam.toLowerCase().replace(/-/g, "_") : "websites";
  const activeSlug = SERVICES_DATA[normalizedParam] ? normalizedParam : "websites";
  const activeService = SERVICES_DATA[activeSlug];

  const handleTabChange = (slug: string) => {
    router.push(`/internal/services?category=${slug.replace(/_/g, "-")}`);
  };

  const Icon = activeService.icon;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              SERVICE CATALOGUE
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              {activeService.clients_count} Subscribed Clients
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
            {activeService.name}
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            {activeService.tagline}
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            href="/internal/clients/new"
            className="h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Client to Service</span>
          </Link>
        </div>
      </div>

      {/* Category Pills Navigation Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#E5E7EB] shadow-card flex items-center space-x-2 overflow-x-auto text-[13px]">
        {Object.values(SERVICES_DATA).map((srv) => {
          const isSelected = activeSlug === srv.slug;
          const SrvIcon = srv.icon;
          return (
            <button
              key={srv.slug}
              onClick={() => handleTabChange(srv.slug)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
                isSelected
                  ? "bg-[#5B4BDB] text-white shadow-soft"
                  : "bg-[#F8F9FB] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              }`}
            >
              <SrvIcon className="h-3.5 w-3.5" />
              <span>{srv.category}</span>
              <span
                className={`text-[10px] px-2 py-0.2 rounded-full font-bold ml-1 ${
                  isSelected ? "bg-white/20 text-white" : "bg-[#E5E7EB] text-[#64748B]"
                }`}
              >
                {srv.clients_count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">Active Clients</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-[#0F172A]">{activeService.clients_count}</span>
            <span className="text-xs font-semibold text-[#059669]">Subscribed</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">MTD Revenue</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-[#5B4BDB]">
              ₹{activeService.mtd_revenue.toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-semibold text-[#64748B]">({activeService.revenue_share_percent}% MTD)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">Active Projects</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-[#0F172A]">{activeService.active_projects_count}</span>
            <span className="text-xs font-semibold text-[#0284C7]">In Progress</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">Delivery SLA</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-sm font-bold text-[#0F172A] truncate">{activeService.sla_delivery}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Subscribed Clients & Deliverables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscribed Clients Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E7EB]">
            <div>
              <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                ACTIVE SUBSCRIBERS
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                Subscribed Clients ({activeService.clients.length})
              </h3>
            </div>
            <Link
              href="/internal/clients"
              className="text-xs font-semibold text-[#5B4BDB] hover:underline flex items-center space-x-1"
            >
              <span>View All Clients</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead className="bg-[#F8F9FB] border-b border-[#E5E7EB] text-[#94A3B8] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">Renewal</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-[#0F172A]">
                {activeService.clients.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/internal/clients?search=${encodeURIComponent(c.name)}`)}
                    className="hover:bg-[#F8F9FD] transition-colors group cursor-pointer"
                    title={`Open ${c.name} account`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-[#5B4BDB]">
                      <Link
                        href={`/internal/clients?search=${encodeURIComponent(c.name)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline flex items-center space-x-1.5"
                      >
                        <span>{c.name}</span>
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#5B4BDB]" />
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B]">{c.contact}</td>
                    <td className="py-3.5 px-4 font-medium text-xs text-[#0F172A]">{c.plan}</td>
                    <td className="py-3.5 px-4 font-bold">₹{c.value_rupees.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-4 text-[#64748B]">{c.renewal}</td>
                    <td className="py-3.5 px-4">
                      {c.status === "active" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669]">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#D97706]">
                          Renewal Due
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Active Delivery Projects Table */}
          {activeService.projects && activeService.projects.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E7EB]">
                <div>
                  <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                    ENGINEERING PIPELINE
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A] mt-0.5">
                    Active Delivery Projects ({activeService.projects.length})
                  </h4>
                </div>
                <Link
                  href="/internal/projects"
                  className="text-xs font-semibold text-[#5B4BDB] hover:underline flex items-center space-x-1"
                >
                  <span>All Projects</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[#94A3B8] font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Project Workspace</th>
                      <th className="py-2 px-3">Client</th>
                      <th className="py-2 px-3">Progress</th>
                      <th className="py-2 px-3">Target Due</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {activeService.projects.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => router.push(`/internal/projects/proj-peak-web`)}
                        className="hover:bg-[#F8F9FD] transition-colors group cursor-pointer"
                      >
                        <td className="py-3 px-3 font-semibold text-[#0F172A] group-hover:text-[#5B4BDB]">
                          {p.name}
                        </td>
                        <td className="py-3 px-3 text-[#64748B]">{p.client}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-2 w-24">
                            <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#5B4BDB] h-full rounded-full"
                                style={{ width: `${p.progress}%` }}
                              />
                            </div>
                            <span className="font-semibold text-[#64748B]">{p.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[#64748B]">{p.due_date}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/internal/projects/proj-peak-web`);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-[#EEF2FF] border border-[#CBD5E1] hover:border-[#5B4BDB] text-[#5B4BDB] font-semibold rounded-lg text-xs transition-all shadow-xs"
                          >
                            Workspace →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Deliverables Scope Checklist (1 col) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card flex flex-col justify-between">
          <div>
            <div className="pb-3 mb-4 border-b border-[#E5E7EB]">
              <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                SCOPE SPECIFICATION
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mt-0.5">Package Inclusions</h3>
            </div>

            <p className="text-[13px] text-[#64748B] leading-relaxed mb-4">{activeService.description}</p>

            <div className="space-y-3 pt-3 border-t border-[#E5E7EB]">
              {activeService.deliverables.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2.5 text-[13px] text-[#0F172A]">
                  <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0 mt-0.5" />
                  <span className="font-medium leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider block">
                {activeService.pricing_model}
              </span>
              <span className="text-lg font-bold text-[#0F172A]">
                From ₹{activeService.base_price_rupees.toLocaleString("en-IN")}
              </span>
            </div>
            <Link
              href="/internal/opportunities"
              className="h-9 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center justify-center"
            >
              Create Proposal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[#64748B]">Loading service catalogue...</div>}>
      <ServicesView />
    </Suspense>
  );
}
