"use client";

import React, { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";

interface ServiceItem {
  id: string;
  category: string;
  name: string;
  clients_count: number;
  pricing_model: string;
  base_price_rupees: number;
  description: string;
  deliverables: string[];
  icon: any;
  color: string;
}

const SERVICES_CATALOGUE: ServiceItem[] = [
  {
    id: "srv-1",
    category: "Websites",
    name: "Custom Web Application & Portal",
    clients_count: 56,
    pricing_model: "Fixed Milestone",
    base_price_rupees: 80000,
    description: "Production-grade Next.js, React, Tailwind and API integration with high performance and SEO.",
    deliverables: ["Custom UI/UX", "Next.js App", "Database & API Integration", "Admin Dashboard", "1 Year Support"],
    icon: Monitor,
    color: "#6C3BDB",
  },
  {
    id: "srv-2",
    category: "Digital Marketing",
    name: "Growth Marketing & Technical SEO",
    clients_count: 38,
    pricing_model: "Monthly Retainer",
    base_price_rupees: 30000,
    description: "End-to-end multi-channel acquisition: Google Search ads, Meta performance ads, on-page SEO, conversion tracking.",
    deliverables: ["Keyword Research", "Ad Campaign Setup", "Monthly Reporting", "A/B Testing", "Conversion Audit"],
    icon: Megaphone,
    color: "#38BDF8",
  },
  {
    id: "srv-3",
    category: "CRM / ERP",
    name: "Enterprise Workflow & CRM Setup",
    clients_count: 22,
    pricing_model: "Project + SLA",
    base_price_rupees: 120000,
    description: "Tailored business process automation, pipeline routing, invoice generation, and custom data workflows.",
    deliverables: ["Process Mapping", "Custom Database Models", "Role-Based Access Control", "Automated Billing", "Training"],
    icon: Layers,
    color: "#10B981",
  },
  {
    id: "srv-4",
    category: "Branding & Media",
    name: "Brand Identity, Guidelines & Packaging",
    clients_count: 16,
    pricing_model: "Fixed Milestone",
    base_price_rupees: 50000,
    description: "Holistic brand positioning: typography, iconography, logo suites, social media guidelines, and packaging.",
    deliverables: ["Brand Strategy", "Primary & Secondary Logos", "Design System Kit", "Catalogue / Collaterals"],
    icon: Palette,
    color: "#F59E0B",
  },
  {
    id: "srv-5",
    category: "Others",
    name: "EdTech Platforms & Cloud Consulting",
    clients_count: 10,
    pricing_model: "Custom Scope",
    base_price_rupees: 60000,
    description: "Specialized LMS systems, cloud infrastructure setup, automated student portals, and managed IT services.",
    deliverables: ["LMS Architecture", "Cloud Deployment", "Video Streaming Setup", "SLA & Maintenance"],
    icon: Sparkles,
    color: "#EC4899",
  },
];

export default function ServicesPage() {
  const [services] = useState<ServiceItem[]>(SERVICES_CATALOGUE);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filtered = services.filter(
    (s) => selectedCategory === "all" || s.category === selectedCategory
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F8FC]">
      <Header />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-[#77738A] mb-1">
              <Link href="/internal/dashboard" className="hover:text-[#6437EA]">Dashboard</Link>
              <span>/</span>
              <span className="text-[#1D1930] font-medium">Services</span>
            </div>
            <h1 className="text-2xl font-black text-[#1D1930] tracking-tight flex items-center space-x-3">
              <span>Service Catalogue & Offerings</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EFEBFC] text-[#6437EA]">
                142 Active Client Subscriptions
              </span>
            </h1>
            <p className="text-xs text-[#77738A] mt-1">
              Standardized agency service definitions, default workflows, deliverables, and billing rules.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/internal/clients">
              <Button
                variant="outline"
                className="text-xs px-4 py-2.5 rounded-xl border-[#EBE8F3] text-[#1D1930] flex items-center space-x-2"
              >
                <Building className="h-4 w-4" />
                <span>View Subscribed Clients</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 text-xs overflow-x-auto pb-1">
          {["all", "Websites", "Digital Marketing", "CRM / ERP", "Branding & Media", "Others"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-[#6437EA] text-white shadow-md shadow-purple-900/20"
                  : "bg-white text-[#77738A] border border-[#EBE8F3] hover:text-[#1D1930]"
              }`}
            >
              {cat === "all" ? "All Services" : cat}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-[#EBE8F3] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: s.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#F6F5FA] text-[#6437EA]">
                      {s.clients_count} Active Clients
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#1D1930] mt-4">{s.name}</h3>
                  <p className="text-xs text-[#77738A] mt-1.5 leading-relaxed">{s.description}</p>

                  <div className="mt-4 pt-4 border-t border-[#F0EDF7]">
                    <span className="text-[10px] uppercase font-bold text-[#77738A] tracking-wider block mb-2">
                      Key Deliverables
                    </span>
                    <ul className="space-y-1.5">
                      {s.deliverables.map((deliv, idx) => (
                        <li key={idx} className="flex items-center space-x-2 text-xs text-[#1D1930]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                          <span>{deliv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[#F0EDF7] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#77738A] font-semibold block">{s.pricing_model}</span>
                    <span className="text-base font-black text-[#1D1930]">
                      From ₹{s.base_price_rupees.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <Link href={`/internal/clients?service=${s.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                    <Button
                      size="sm"
                      className="bg-[#6437EA] hover:bg-[#5528DA] text-white text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1"
                    >
                      <span>View Clients</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
