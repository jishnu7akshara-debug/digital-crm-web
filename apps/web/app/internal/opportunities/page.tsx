"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  User,
  ArrowRight,
  CheckCircle2,
  X,
  Clock,
} from "lucide-react";

interface Opportunity {
  id: string;
  title: string;
  client: string;
  service: string;
  value_rupees: number;
  stage: "leads" | "qualified" | "proposal" | "negotiation" | "won";
  expected_close: string;
  probability: number;
  owner: string;
}

const INITIAL_OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp-1",
    title: "E-Commerce Website Redesign",
    client: "Sashikiran Surveyors",
    service: "Websites",
    value_rupees: 180000,
    stage: "leads",
    expected_close: "Dec 15, 2026",
    probability: 30,
    owner: "Sai Varshith",
  },
  {
    id: "opp-2",
    title: "Healthcare Booking Portal",
    client: "MedPulse Clinic",
    service: "Websites",
    value_rupees: 240000,
    stage: "leads",
    expected_close: "Dec 20, 2026",
    probability: 25,
    owner: "Priya Sharma",
  },
  {
    id: "opp-3",
    title: "Quarterly SEO & Growth Retainer",
    client: "Talenty Consulting",
    service: "Digital Marketing",
    value_rupees: 210000,
    stage: "qualified",
    expected_close: "Nov 30, 2026",
    probability: 50,
    owner: "Rahul Verma",
  },
  {
    id: "opp-4",
    title: "Paid Ads Performance Setup",
    client: "Urban Nest Interiors",
    service: "Digital Marketing",
    value_rupees: 400000,
    stage: "qualified",
    expected_close: "Dec 05, 2026",
    probability: 60,
    owner: "Sai Varshith",
  },
  {
    id: "opp-5",
    title: "Custom CRM & Lead Routing",
    client: "KalpaTouch",
    service: "CRM / ERP",
    value_rupees: 450000,
    stage: "proposal",
    expected_close: "Nov 25, 2026",
    probability: 70,
    owner: "Ananya Iyer",
  },
  {
    id: "opp-6",
    title: "Inventory & Billing ERP",
    client: "Apex Logistics",
    service: "CRM / ERP",
    value_rupees: 300000,
    stage: "proposal",
    expected_close: "Dec 10, 2026",
    probability: 65,
    owner: "Priya Sharma",
  },
  {
    id: "opp-7",
    title: "Brand Identity & Packaging",
    client: "Delights Gourmet",
    service: "Branding & Media",
    value_rupees: 250000,
    stage: "negotiation",
    expected_close: "Nov 22, 2026",
    probability: 85,
    owner: "Sai Varshith",
  },
  {
    id: "opp-8",
    title: "Corporate Video & Media Kit",
    client: "Skyline Infra",
    service: "Branding & Media",
    value_rupees: 150000,
    stage: "negotiation",
    expected_close: "Nov 18, 2026",
    probability: 80,
    owner: "Rahul Verma",
  },
  {
    id: "opp-9",
    title: "Product Catalogue & Digital Launch",
    client: "Aroma Dew",
    service: "Branding & Media",
    value_rupees: 180000,
    stage: "won",
    expected_close: "Nov 05, 2026",
    probability: 100,
    owner: "Sai Varshith",
  },
  {
    id: "opp-10",
    title: "Mobile CRM Companion App",
    client: "FastTrack Logistics",
    service: "CRM / ERP",
    value_rupees: 120000,
    stage: "won",
    expected_close: "Nov 02, 2026",
    probability: 100,
    owner: "Ananya Iyer",
  },
];

const STAGES = [
  { key: "leads", label: "Leads", count: 18, total: "₹4,20,000" },
  { key: "qualified", label: "Qualified", count: 11, total: "₹6,10,000" },
  { key: "proposal", label: "Proposal", count: 8, total: "₹7,50,000" },
  { key: "negotiation", label: "Negotiation", count: 5, total: "₹4,00,000" },
  { key: "won", label: "Won", count: 4, total: "₹3,00,000" },
] as const;

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(INITIAL_OPPORTUNITIES);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState("All");

  const [newOpp, setNewOpp] = useState({
    title: "",
    client: "",
    service: "Websites",
    value_rupees: "",
    stage: "leads" as Opportunity["stage"],
    owner: "Sai Varshith",
  });

  const handleAddOpportunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpp.title || !newOpp.client) return;

    const opp: Opportunity = {
      id: `opp-${Date.now()}`,
      title: newOpp.title,
      client: newOpp.client,
      service: newOpp.service,
      value_rupees: Number(newOpp.value_rupees) || 100000,
      stage: newOpp.stage,
      expected_close: "Dec 31, 2026",
      probability: newOpp.stage === "won" ? 100 : newOpp.stage === "negotiation" ? 80 : 40,
      owner: newOpp.owner,
    };

    setOpportunities([opp, ...opportunities]);
    setIsNewModalOpen(false);
    setNewOpp({
      title: "",
      client: "",
      service: "Websites",
      value_rupees: "",
      stage: "leads",
      owner: "Sai Varshith",
    });
  };

  const moveStage = (oppId: string, nextStage: Opportunity["stage"]) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, stage: nextStage } : o))
    );
  };

  const filteredOpps = opportunities.filter((o) => {
    const matchesSearch =
      o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesService =
      selectedService === "All" || o.service.toLowerCase().includes(selectedService.toLowerCase());
    return matchesSearch && matchesService;
  });

  const totalValue = opportunities.reduce((acc, curr) => acc + curr.value_rupees, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              PIPELINE & SALES
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              {opportunities.length} Active Deals
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Opportunities & Deals Pipeline
          </h2>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Track deal velocity, pipeline values, and conversion across sales stages.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="bg-[#F8F9FB] border border-[#E5E7EB] px-4 py-2 rounded-xl text-right">
            <span className="text-[11px] text-[#94A3B8] uppercase font-semibold tracking-wider block">
              Total Pipeline Value
            </span>
            <span className="text-base font-bold text-[#5B4BDB]">
              ₹{totalValue.toLocaleString("en-IN")}
            </span>
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Opportunity</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search deals or clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 bg-[#F8F9FB] border border-[#E5E7EB] rounded-xl pl-10 pr-4 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 transition-all"
          />
        </div>

        {/* Service Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto text-[13px]">
          <span className="text-[#94A3B8] text-[12px] font-semibold mr-1 uppercase tracking-wider">
            Services:
          </span>
          {["All", "Websites", "Digital Marketing", "CRM / ERP", "Branding & Media"].map((srv) => (
            <button
              key={srv}
              onClick={() => setSelectedService(srv)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all whitespace-nowrap ${
                selectedService === srv
                  ? "bg-[#5B4BDB] text-white shadow-soft"
                  : "bg-[#F8F9FB] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              }`}
            >
              {srv}
            </button>
          ))}
        </div>
      </div>

      {/* 5-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        {STAGES.map((col, idx) => {
          const colOpps = filteredOpps.filter((o) => o.stage === col.key);
          const colTotalRupees = colOpps.reduce((sum, o) => sum + o.value_rupees, 0);

          return (
            <div
              key={col.key}
              className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card p-4 flex flex-col min-h-[520px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-3">
                <div>
                  <div className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    {col.label}
                  </div>
                  <div className="text-[13px] font-bold text-[#0F172A] mt-0.5">
                    ₹{colTotalRupees.toLocaleString("en-IN")}
                  </div>
                </div>
                <span className="h-6 w-6 rounded-full bg-[#EEF2FF] text-[#5B4BDB] font-bold text-xs flex items-center justify-center">
                  {colOpps.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colOpps.map((opp) => {
                  let badgeClass = "bg-[#EEF2FF] text-[#5B4BDB]";
                  if (opp.service === "Digital Marketing") badgeClass = "bg-[#F0F9FF] text-[#0284C7]";
                  if (opp.service === "CRM / ERP") badgeClass = "bg-[#ECFDF5] text-[#059669]";
                  if (opp.service.includes("Branding")) badgeClass = "bg-[#FFFBEB] text-[#D97706]";

                  return (
                    <div
                      key={opp.id}
                      className="bg-[#F8F9FB] hover:bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] rounded-xl p-3.5 transition-all shadow-soft group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${badgeClass}`}>
                          {opp.service}
                        </span>
                        <span className="text-[13px] font-bold text-[#0F172A]">
                          ₹{opp.value_rupees.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <h4 className="text-[13.5px] font-semibold text-[#0F172A] leading-snug mb-1">
                        {opp.title}
                      </h4>

                      <div className="flex items-center space-x-1.5 text-[12px] text-[#64748B] mb-2.5">
                        <Building2 className="h-3.5 w-3.5 text-[#94A3B8]" />
                        <span>{opp.client}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]/80 text-[11px] text-[#64748B]">
                        <span className="flex items-center space-x-1">
                          <User className="h-3 w-3 text-[#94A3B8]" />
                          <span>{opp.owner.split(" ")[0]}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-[#94A3B8]" />
                          <span>{opp.expected_close}</span>
                        </span>
                      </div>

                      {/* Advance Stage button */}
                      {col.key !== "won" ? (
                        <div className="mt-2.5 pt-2 border-t border-[#E5E7EB]/80 flex justify-end">
                          <button
                            onClick={() => {
                              const nextStage = STAGES[idx + 1]?.key;
                              if (nextStage) moveStage(opp.id, nextStage);
                            }}
                            className="text-[11.5px] font-semibold text-[#5B4BDB] hover:text-[#4B3DC7] flex items-center space-x-1"
                          >
                            <span>Advance Stage</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2.5 pt-2 border-t border-[#E5E7EB]/80 flex items-center justify-end text-[11.5px] font-semibold text-[#059669]">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          <span>Deal Closed</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {colOpps.length === 0 && (
                  <div className="h-32 border border-dashed border-[#E5E7EB] rounded-xl flex items-center justify-center text-[12px] text-[#94A3B8]">
                    No deals in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Opportunity Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] w-full max-w-md shadow-dropdown p-6 text-[14px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="font-bold text-[16px] text-[#0F172A]">Create New Opportunity</h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddOpportunity} className="mt-4 space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Opportunity Title <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. E-Commerce Redesign"
                  value={newOpp.title}
                  onChange={(e) => setNewOpp({ ...newOpp, title: e.target.value })}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Client / Account Name <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sashikiran Surveyors"
                  value={newOpp.client}
                  onChange={(e) => setNewOpp({ ...newOpp, client: e.target.value })}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                    Service Category
                  </label>
                  <select
                    value={newOpp.service}
                    onChange={(e) => setNewOpp({ ...newOpp, service: e.target.value })}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] bg-white focus:border-[#5B4BDB] focus:outline-none"
                  >
                    <option value="Websites">Websites</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="CRM / ERP">CRM / ERP</option>
                    <option value="Branding & Media">Branding & Media</option>
                    <option value="EdTech">EdTech</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                    Value (₹ INR)
                  </label>
                  <input
                    type="number"
                    placeholder="250000"
                    value={newOpp.value_rupees}
                    onChange={(e) => setNewOpp({ ...newOpp, value_rupees: e.target.value })}
                    className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="h-10 px-4 border border-[#E5E7EB] rounded-xl text-[13px] text-[#64748B] hover:bg-[#F8F9FB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl text-[13px] font-semibold shadow-soft"
                >
                  Create Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
