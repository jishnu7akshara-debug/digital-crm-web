"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Building,
  User,
  MoreVertical,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";

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
  { key: "leads", label: "Leads", count: 18, total: "₹4,20,000", color: "border-purple-200 bg-purple-50/50" },
  { key: "qualified", label: "Qualified", count: 11, total: "₹6,10,000", color: "border-blue-200 bg-blue-50/50" },
  { key: "proposal", label: "Proposal", count: 8, total: "₹7,50,000", color: "border-indigo-200 bg-indigo-50/50" },
  { key: "negotiation", label: "Negotiation", count: 5, total: "₹4,00,000", color: "border-amber-200 bg-amber-50/50" },
  { key: "won", label: "Won", count: 4, total: "₹3,00,000", color: "border-emerald-200 bg-emerald-50/50" },
];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(INITIAL_OPPORTUNITIES);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredOpps = opportunities.filter(
    (o) =>
      o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F8FC]">
      <Header />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Page Title & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-[#77738A] mb-1">
              <Link href="/internal/dashboard" className="hover:text-[#6437EA]">Dashboard</Link>
              <span>/</span>
              <span className="text-[#1D1930] font-medium">Opportunities</span>
            </div>
            <h1 className="text-2xl font-black text-[#1D1930] tracking-tight flex items-center space-x-3">
              <span>Opportunities & Deals Pipeline</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EFEBFC] text-[#6437EA]">
                46 Active Deals
              </span>
            </h1>
            <p className="text-xs text-[#77738A] mt-1">
              Track deal velocity, pipeline values, and conversion across sales stages.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-white border border-[#EBE8F3] px-4 py-2 rounded-xl shadow-sm text-right">
              <span className="text-[10px] text-[#77738A] uppercase font-bold tracking-wider block">Total Pipeline Value</span>
              <span className="text-sm font-extrabold text-[#6437EA]">₹24,80,000</span>
            </div>
            <Button
              onClick={() => setIsNewModalOpen(true)}
              className="bg-[#6437EA] hover:bg-[#5528DA] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Opportunity</span>
            </Button>
          </div>
        </div>

        {/* Search & Stage Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#EBE8F3] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#9D95B5]" />
            <input
              type="text"
              placeholder="Search deals or clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl pl-10 pr-4 py-2 text-xs text-[#1D1930] placeholder:text-[#9D95B5] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#77738A]">Services:</span>
            {["All", "Websites", "Digital Marketing", "CRM / ERP", "Branding & Media"].map((srv, idx) => (
              <button
                key={srv}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  idx === 0
                    ? "bg-[#6437EA] text-white"
                    : "bg-[#F6F5FA] text-[#77738A] hover:text-[#1D1930]"
                }`}
              >
                {srv}
              </button>
            ))}
          </div>
        </div>

        {/* 5-Column Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
          {STAGES.map((col) => {
            const colOpps = filteredOpps.filter((o) => o.stage === col.key);
            return (
              <div
                key={col.key}
                className="bg-white rounded-2xl border border-[#EBE8F3] shadow-sm p-4 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#F0EDF7] mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-[#1D1930] uppercase tracking-wider">{col.label}</h3>
                    <span className="text-[10px] text-[#77738A] font-semibold">{col.total}</span>
                  </div>
                  <span className="h-5 w-5 rounded-full bg-[#F6F5FA] text-[#6437EA] font-extrabold text-[11px] flex items-center justify-center">
                    {colOpps.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colOpps.map((opp) => (
                    <div
                      key={opp.id}
                      className="bg-[#FAFAFD] hover:bg-white border border-[#EBE8F3] hover:border-[#6437EA]/40 rounded-xl p-3.5 shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EFEBFC] text-[#6437EA]">
                          {opp.service}
                        </span>
                        <span className="text-xs font-bold text-[#1D1930]">
                          ₹{opp.value_rupees.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-[#1D1930] mt-2 group-hover:text-[#6437EA] transition-colors leading-snug">
                        {opp.title}
                      </h4>

                      <div className="flex items-center space-x-1.5 text-[11px] text-[#77738A] mt-1.5">
                        <Building className="h-3 w-3 text-[#9D95B5]" />
                        <span className="truncate">{opp.client}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-[#F0EDF7] text-[10px] text-[#77738A]">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3 text-[#9D95B5]" />
                          <span>{opp.owner}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-[#9D95B5]" />
                          <span>{opp.expected_close}</span>
                        </div>
                      </div>

                      {/* Stage Progression Quick Action */}
                      <div className="mt-2.5 pt-2 border-t border-dashed border-[#EBE8F3] flex justify-end">
                        {col.key !== "won" ? (
                          <button
                            onClick={() => {
                              const nextStageMap: Record<string, Opportunity["stage"]> = {
                                leads: "qualified",
                                qualified: "proposal",
                                proposal: "negotiation",
                                negotiation: "won",
                              };
                              moveStage(opp.id, nextStageMap[opp.stage]);
                            }}
                            className="text-[10px] text-[#6437EA] hover:text-[#5528DA] font-semibold flex items-center space-x-1"
                          >
                            <span>Advance Stage</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Deal Closed</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {colOpps.length === 0 && (
                    <div className="py-8 text-center text-xs text-[#9D95B5] border-2 border-dashed border-[#EBE8F3] rounded-xl">
                      No deals in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Add Opportunity Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#EBE8F3] animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-[#1D1930] mb-1">Create New Opportunity</h3>
            <p className="text-xs text-[#77738A] mb-4">Add a new prospective deal into the pipeline.</p>

            <form onSubmit={handleAddOpportunity} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#1D1930] mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brand Refresh & Website Portal"
                  value={newOpp.title}
                  onChange={(e) => setNewOpp({ ...newOpp, title: e.target.value })}
                  className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl px-3.5 py-2 text-xs text-[#1D1930] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1D1930] mb-1">Client / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Tech Solutions"
                  value={newOpp.client}
                  onChange={(e) => setNewOpp({ ...newOpp, client: e.target.value })}
                  className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl px-3.5 py-2 text-xs text-[#1D1930] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#1D1930] mb-1">Service Category</label>
                  <select
                    value={newOpp.service}
                    onChange={(e) => setNewOpp({ ...newOpp, service: e.target.value })}
                    className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl px-3 py-2 text-xs text-[#1D1930] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
                  >
                    <option value="Websites">Websites</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="CRM / ERP">CRM / ERP</option>
                    <option value="Branding & Media">Branding & Media</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1D1930] mb-1">Deal Value (₹)</label>
                  <input
                    type="number"
                    placeholder="250000"
                    value={newOpp.value_rupees}
                    onChange={(e) => setNewOpp({ ...newOpp, value_rupees: e.target.value })}
                    className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl px-3 py-2 text-xs text-[#1D1930] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#1D1930] mb-1">Initial Stage</label>
                  <select
                    value={newOpp.stage}
                    onChange={(e) => setNewOpp({ ...newOpp, stage: e.target.value as Opportunity["stage"] })}
                    className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl px-3 py-2 text-xs text-[#1D1930] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
                  >
                    <option value="leads">Leads</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Won</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1D1930] mb-1">Deal Owner</label>
                  <input
                    type="text"
                    value={newOpp.owner}
                    onChange={(e) => setNewOpp({ ...newOpp, owner: e.target.value })}
                    className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl px-3 py-2 text-xs text-[#1D1930] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-[#F0EDF7]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewModalOpen(false)}
                  className="text-xs px-4 py-2 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#6437EA] hover:bg-[#5528DA] text-white text-xs font-semibold px-4 py-2 rounded-xl"
                >
                  Add to Pipeline
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

