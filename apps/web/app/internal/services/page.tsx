"use client";

import React, { useState, useEffect, Suspense } from "react";
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
  Building,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";

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
  color: string;
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
    color: "#6C3BDB",
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
      { id: "p-3", name: "MedPulse – Booking Engine", client: "MedPulse Clinic", progress: 35, due_date: "Dec 15, 2026", status: "In Progress" },
    ],
  },
  "digital-marketing": {
    category: "Digital Marketing",
    slug: "digital-marketing",
    name: "Growth Marketing & Performance SEO",
    tagline: "End-to-end customer acquisition through Google Search ads, Meta performance ads, and organic SEO.",
    clients_count: 38,
    mtd_revenue: 243750,
    revenue_share_percent: 25,
    active_projects_count: 12,
    sla_delivery: "Continuous Monthly Retainer",
    pricing_model: "Monthly Retainer + Ad Spend %",
    base_price_rupees: 30000,
    description: "Data-driven performance marketing focused on qualified pipeline generation, high-intent Google Search campaigns, technical SEO audits, and conversion optimization.",
    color: "#38BDF8",
    icon: Megaphone,
    deliverables: [
      "High-Intent Keyword Discovery & Mapping",
      "Google Search & Performance Max Setup",
      "Meta (Instagram & Facebook) Ad Creative Sprints",
      "Conversion Tracking, Pixels & GA4 Infrastructure",
      "Bi-Weekly Pipeline Performance Audits",
      "Landing Page A/B Testing & Speed Optimization",
    ],
    clients: [
      { id: "c-6", name: "Talenty Consulting", contact: "Priya Sharma", plan: "Growth Marketing Retainer", value_rupees: 360000, renewal: "Feb 2027", status: "active" },
      { id: "c-7", name: "Urban Nest Interiors", contact: "Manoj Kumar", plan: "Paid Ads Performance", value_rupees: 400000, renewal: "Dec 2026", status: "active" },
      { id: "c-8", name: "FreshRoot Organics", contact: "Sunita Roy", plan: "Social & SEO Retainer", value_rupees: 280000, renewal: "Jan 2027", status: "active" },
      { id: "c-9", name: "Apex Logistics", contact: "Harish Gupta", plan: "Search Engine Ads", value_rupees: 300000, renewal: "Nov 2026", status: "expiring_soon" },
    ],
    projects: [
      { id: "p-4", name: "Talenty Consulting – Marketing", client: "Talenty Consulting", progress: 60, due_date: "Nov 15, 2026", status: "In Progress" },
      { id: "p-5", name: "Urban Nest – Festive Ad Campaigns", client: "Urban Nest Interiors", progress: 75, due_date: "Nov 22, 2026", status: "In Progress" },
    ],
  },
  "crm-erp": {
    category: "CRM / ERP",
    slug: "crm-erp",
    name: "Enterprise Workflow & Custom CRM / ERP",
    tagline: "Tailored process automation, pipeline routing, invoice generation, and custom data workflows.",
    clients_count: 22,
    mtd_revenue: 146250,
    revenue_share_percent: 15,
    active_projects_count: 6,
    sla_delivery: "4-6 Weeks",
    pricing_model: "Project Milestone + SLA",
    base_price_rupees: 120000,
    description: "Replace fragmented spreadsheets with a scalable operational system tailored to your exact business rules, automated billing, and permission boundaries.",
    color: "#10B981",
    icon: Layers,
    deliverables: [
      "Process Architecture & Requirements Specification",
      "Relational Database Modeling & Migration",
      "Role-Based Access Control (RBAC) Engine",
      "Automated Invoicing & GST Tax Integration",
      "Real-time Analytics & Executive Reporting",
      "Admin Training, Documentation & Dedicated SLA",
    ],
    clients: [
      { id: "c-10", name: "KalpaTouch", contact: "Venkat Raman", plan: "Enterprise CRM & Hosting", value_rupees: 550000, renewal: "Mar 2027", status: "active" },
      { id: "c-11", name: "Apex Logistics", contact: "Harish Gupta", plan: "Inventory & Dispatch ERP", value_rupees: 380000, renewal: "Jan 2027", status: "active" },
      { id: "c-12", name: "FastTrack Cargo", contact: "Alok Verma", plan: "Mobile Field CRM", value_rupees: 220000, renewal: "Dec 2026", status: "active" },
    ],
    projects: [
      { id: "p-6", name: "KalpaTouch – CRM Setup", client: "KalpaTouch", progress: 40, due_date: "Nov 20, 2026", status: "In Progress" },
      { id: "p-7", name: "Apex Logistics – ERP Invoicing", client: "Apex Logistics", progress: 55, due_date: "Dec 10, 2026", status: "In Progress" },
    ],
  },
  "branding-media": {
    category: "Branding & Media",
    slug: "branding-media",
    name: "Brand Identity, Guidelines & Media Collaterals",
    tagline: "Holistic brand positioning: typography, iconography, logo suites, packaging, and catalogue design.",
    clients_count: 16,
    mtd_revenue: 97500,
    revenue_share_percent: 10,
    active_projects_count: 4,
    sla_delivery: "2-3 Weeks",
    pricing_model: "Fixed Milestone",
    base_price_rupees: 50000,
    description: "Craft distinctive, premium brand aesthetics that resonate with your target market across print, packaging, digital showcases, and video media.",
    color: "#F59E0B",
    icon: Palette,
    deliverables: [
      "Brand Positioning & Tone of Voice Guide",
      "Primary, Secondary & Monogram Logo Suite",
      "Typography, Color Tokens & Design System Kit",
      "Print Packaging, Labels & Product Boxes",
      "Digital Product Catalogue & Marketing Deck",
      "Social Media Templates & IP Transfer Agreement",
    ],
    clients: [
      { id: "c-13", name: "Delights Gourmet", contact: "Simran Kaur", plan: "Brand Identity & Packaging", value_rupees: 220000, renewal: "Dec 2026", status: "active" },
      { id: "c-14", name: "Aroma Dew", contact: "Kavita Rao", plan: "Product Catalogue Design", value_rupees: 180000, renewal: "Nov 2026", status: "active" },
      { id: "c-15", name: "Zenith Luxe", contact: "Arjun Reddy", plan: "Brand Refresh & Stationery", value_rupees: 120000, renewal: "Jan 2027", status: "active" },
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
    color: "#EC4899",
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

  // Determine active category
  const activeSlug = categoryParam && SERVICES_DATA[categoryParam] ? categoryParam : "websites";
  const activeService = SERVICES_DATA[activeSlug];

  const handleTabChange = (slug: string) => {
    router.push(`/internal/services?category=${slug}`);
  };

  const Icon = activeService.icon;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-[#77738A] mb-1">
            <Link href="/internal/dashboard" className="hover:text-[#6437EA]">Dashboard</Link>
            <span>/</span>
            <span className="text-[#1D1930] font-medium">Services</span>
            <span>/</span>
            <span className="text-[#6437EA] font-semibold">{activeService.category}</span>
          </div>
          <h1 className="text-2xl font-black text-[#1D1930] tracking-tight flex items-center space-x-3">
            <span>{activeService.name}</span>
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: activeService.color }}
            >
              {activeService.clients_count} Active Clients
            </span>
          </h1>
          <p className="text-xs text-[#77738A] mt-1">{activeService.tagline}</p>
        </div>

        <div className="flex items-center space-x-3">
          <Link href="/internal/projects">
            <Button
              variant="outline"
              className="text-xs px-4 py-2.5 rounded-xl border-[#EBE8F3] text-[#1D1930] flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Project</span>
            </Button>
          </Link>
          <Link href="/internal/clients">
            <Button
              className="bg-[#6437EA] hover:bg-[#5528DA] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-2"
            >
              <Building className="h-4 w-4" />
              <span>Add Client</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Category Navigation Tabs */}
      <div className="flex items-center space-x-2 text-xs overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-[#EBE8F3] shadow-sm">
        {Object.values(SERVICES_DATA).map((srv) => {
          const isSelected = activeSlug === srv.slug;
          const SrvIcon = srv.icon;
          return (
            <button
              key={srv.slug}
              onClick={() => handleTabChange(srv.slug)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                isSelected
                  ? "bg-[#6437EA] text-white shadow-md shadow-purple-900/20"
                  : "text-[#77738A] hover:text-[#1D1930] hover:bg-[#F6F5FA]"
              }`}
            >
              <SrvIcon className="h-4 w-4 flex-shrink-0" />
              <span>{srv.category}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 ${
                  isSelected ? "bg-white/20 text-white" : "bg-[#F0EDF7] text-[#6437EA]"
                }`}
              >
                {srv.clients_count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4 Metric KPI Cards for this Service */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#EBE8F3] shadow-sm">
          <span className="text-[10px] font-bold text-[#77738A] uppercase tracking-wider block">Active Clients</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-black text-[#1D1930]">{activeService.clients_count}</span>
            <span className="text-xs font-semibold text-emerald-600">Subscribed</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EBE8F3] shadow-sm">
          <span className="text-[10px] font-bold text-[#77738A] uppercase tracking-wider block">MTD Revenue Generated</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-black text-[#6437EA]">
              ₹{activeService.mtd_revenue.toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-bold text-[#77738A]">({activeService.revenue_share_percent}% MTD)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EBE8F3] shadow-sm">
          <span className="text-[10px] font-bold text-[#77738A] uppercase tracking-wider block">Active Projects</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-black text-[#1D1930]">{activeService.active_projects_count}</span>
            <span className="text-xs font-semibold text-blue-600">In Pipeline</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EBE8F3] shadow-sm">
          <span className="text-[10px] font-bold text-[#77738A] uppercase tracking-wider block">Delivery SLA / Model</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-sm font-black text-[#1D1930] truncate">{activeService.sla_delivery}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Subscribed Clients & Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscribed Clients Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EBE8F3] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#1D1930]">
                Subscribed Clients ({activeService.clients.length})
              </h3>
              <p className="text-xs text-[#77738A]">Organizations currently billed under {activeService.category}</p>
            </div>
            <Link
              href="/internal/clients"
              className="text-xs font-semibold text-[#6437EA] hover:text-[#5528DA] flex items-center space-x-1"
            >
              <span>View All Clients</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FD] border-b border-[#ECE9F4] text-[#77738A] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Client Organization</th>
                  <th className="py-3 px-4">Primary Contact</th>
                  <th className="py-3 px-4">Contract Plan</th>
                  <th className="py-3 px-4">Value (₹)</th>
                  <th className="py-3 px-4">Renewal</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDF7] text-[#1D1930]">
                {activeService.clients.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF9FD] transition-colors">
                    <td className="py-3.5 px-4 font-bold flex items-center space-x-2.5">
                      <div className="h-6 w-6 rounded-md bg-[#120B2E] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {c.name[0]}
                      </div>
                      <span className="truncate">{c.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#77738A]">{c.contact}</td>
                    <td className="py-3.5 px-4 font-medium text-xs text-[#6437EA]">{c.plan}</td>
                    <td className="py-3.5 px-4 font-bold">₹{c.value_rupees.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-4 text-[#77738A]">{c.renewal}</td>
                    <td className="py-3.5 px-4">
                      {c.status === "active" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                          Renewal Due
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Deliverables & Scope Checklist (1 col) */}
        <div className="bg-white rounded-2xl border border-[#EBE8F3] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: activeService.color }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1D1930]">Service Deliverables</h3>
                <span className="text-[11px] text-[#77738A]">Standard package inclusions</span>
              </div>
            </div>

            <p className="text-xs text-[#77738A] leading-relaxed mb-4">{activeService.description}</p>

            <div className="space-y-2.5 pt-3 border-t border-[#F0EDF7]">
              {activeService.deliverables.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-[#1D1930]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="font-medium leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#F0EDF7] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#77738A] font-semibold block">{activeService.pricing_model}</span>
              <span className="text-lg font-black text-[#1D1930]">
                From ₹{activeService.base_price_rupees.toLocaleString("en-IN")}
              </span>
            </div>
            <Link href="/internal/opportunities">
              <Button
                size="sm"
                className="bg-[#6437EA] hover:bg-[#5528DA] text-white text-xs px-3.5 py-2 rounded-xl"
              >
                Create Proposal
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Active Projects under this Service */}
      <div className="bg-white rounded-2xl border border-[#EBE8F3] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#1D1930]">
              Active Projects in {activeService.category} ({activeService.projects.length})
            </h3>
            <p className="text-xs text-[#77738A]">Delivery milestones, completion percentages, and deadlines</p>
          </div>
          <Link
            href="/internal/projects"
            className="text-xs font-semibold text-[#6437EA] hover:text-[#5528DA] flex items-center space-x-1"
          >
            <span>View All Projects</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeService.projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-[#FAF9FD] border border-[#ECE9F4] rounded-xl p-4 flex flex-col justify-between hover:border-[#6437EA]/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EFEBFC] text-[#6437EA]">
                    {proj.client}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      proj.status === "Completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : proj.status === "Review"
                        ? "bg-purple-50 text-[#6437EA]"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {proj.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[#1D1930] mt-2.5 leading-snug">{proj.name}</h4>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F0EDF7]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#77738A] text-[11px]">Progress</span>
                  <span className="font-bold text-[#1D1930]">{proj.progress}%</span>
                </div>
                <div className="w-full bg-[#EBE8F3] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#6437EA] h-1.5 rounded-full"
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#77738A] mt-2">
                  <span>Due Date</span>
                  <span className="font-semibold text-[#1D1930]">{proj.due_date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F8FC]">
      <Header />
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <Suspense fallback={<div className="p-8 text-center text-xs text-[#77738A]">Loading service details...</div>}>
          <ServicesView />
        </Suspense>
      </main>
    </div>
  );
}
