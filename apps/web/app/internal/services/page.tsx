"use client";

import React, { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Monitor,
  Megaphone,
  Layers,
  Palette,
  Sparkles,
  Plus,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Clock,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { PageReady } from "@/components/page-ready";

export interface ServiceItem {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string | null;
  pricing_type: string;
  default_price_rupees: number;
  currency: string;
  hsn_sac_code: string | null;
  is_active: boolean;
}

const CATEGORY_ICONS: Record<string, any> = {
  Websites: Monitor,
  "Mobile Apps": Sparkles,
  "Digital Marketing": Megaphone,
  SEO: TrendingUp,
  Branding: Palette,
  Enterprise: Layers,
};

function ServicesView() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);

  // Modal State for New Service
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCode, setNewServiceCode] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState("Websites");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newPricingType, setNewPricingType] = useState("fixed");

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<ServiceItem[]>("/services");
      setServices(data || []);
      if (data && data.length > 0 && !activeServiceId) {
        setActiveServiceId(data[0].id);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServiceCode.trim()) {
      toast.error("Name and code are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const pricePaise = Math.round((parseFloat(newServicePrice) || 0) * 100);
      const created = await api.post<ServiceItem>("/services", {
        name: newServiceName.trim(),
        code: newServiceCode.trim().toUpperCase(),
        category: newServiceCategory,
        description: newServiceDesc.trim() || null,
        pricing_type: newPricingType,
        default_price_paise: pricePaise,
        currency: "INR",
        hsn_sac_code: "998314",
      });

      toast.success(`Service "${created.name}" created successfully.`);
      setShowCreateModal(false);
      setNewServiceName("");
      setNewServiceCode("");
      setNewServicePrice("");
      setNewServiceDesc("");
      await fetchServices();
      setActiveServiceId(created.id);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (service: ServiceItem) => {
    if (!confirm(`Are you sure you want to archive "${service.name}"?`)) return;

    try {
      await api.delete(`/services/${service.id}`);
      toast.success(`Service "${service.name}" archived.`);
      await fetchServices();
      if (activeServiceId === service.id) {
        setActiveServiceId(null);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to archive service.");
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchServices} />;
  }

  if (services.length === 0) {
    return (
      <EmptyState
        title="No Services in Catalogue"
        description="Get started by creating your agency's first service offering."
        actionLabel="Add Service"
        onAction={() => setShowCreateModal(true)}
      />
    );
  }

  const activeService =
    services.find((s) => s.id === activeServiceId) || services[0];
  const ActiveIcon =
    CATEGORY_ICONS[activeService.category] || Briefcase;

  return (
    <div className="space-y-6 pb-12">
      <PageReady when={!loading} state={error ? "error" : services.length === 0 ? "empty" : "success"} dataLength={services.length} />
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              SERVICE CATALOGUE
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              {activeService.code}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
            {activeService.name}
          </h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            {activeService.description || "Standard agency offering."}
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Service</span>
          </button>
          <button
            onClick={() => handleDeleteService(activeService)}
            className="h-10 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors flex items-center space-x-1 text-xs font-medium"
            title="Archive service"
          >
            <Trash2 className="h-4 w-4" />
            <span>Archive</span>
          </button>
        </div>
      </div>

      {/* Category Pills Navigation Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#E5E7EB] shadow-card flex items-center space-x-2 overflow-x-auto text-[13px]">
        {services.map((srv) => {
          const isSelected = activeService.id === srv.id;
          const SrvIcon = CATEGORY_ICONS[srv.category] || Briefcase;
          return (
            <button
              key={srv.id}
              onClick={() => setActiveServiceId(srv.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
                isSelected
                  ? "bg-[#5B4BDB] text-white shadow-soft"
                  : "bg-[#F8F9FB] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              }`}
            >
              <SrvIcon className="h-3.5 w-3.5" />
              <span>{srv.name}</span>
            </button>
          );
        })}
      </div>

      {/* KPI Specs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Base Pricing
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-[#5B4BDB]">
              ₹{activeService.default_price_rupees.toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-semibold text-[#64748B]">
              /{activeService.pricing_type}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Category
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-lg font-bold text-[#0F172A]">
              {activeService.category}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            SAC Code
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-lg font-bold text-[#0F172A]">
              {activeService.hsn_sac_code || "998314"}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Status
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                activeService.is_active
                  ? "bg-[#ECFDF5] text-[#059669]"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {activeService.is_active ? "Active in Catalogue" : "Archived"}
            </span>
          </div>
        </div>
      </div>

      {/* Detail Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card flex flex-col justify-between">
        <div>
          <div className="pb-3 mb-4 border-b border-[#E5E7EB]">
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              SPECIFICATION & INCLUSIONS
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
              Service Details
            </h3>
          </div>

          <p className="text-[14px] text-[#64748B] leading-relaxed mb-6">
            {activeService.description ||
              "Standard agency deliverable package configured in the system."}
          </p>

          <div className="flex items-center space-x-4">
            <Link
              href="/internal/opportunities"
              className="h-10 px-5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center justify-center space-x-2"
            >
              <span>Create Proposal with this Service</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/internal/clients"
              className="h-10 px-5 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#0F172A] text-[13px] font-semibold rounded-xl transition-colors flex items-center justify-center"
            >
              Assign to Client
            </Link>
          </div>
        </div>
      </div>

      {/* Modal for Creating New Service */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
              <h2 className="text-base font-bold text-[#0F172A]">
                Add Service to Catalogue
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="e.g. Next.js Web Application"
                  className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-hidden focus:border-[#5B4BDB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Service Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newServiceCode}
                    onChange={(e) => setNewServiceCode(e.target.value)}
                    placeholder="e.g. WEB-NEXT"
                    className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm uppercase focus:outline-hidden focus:border-[#5B4BDB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Category *
                  </label>
                  <select
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-hidden focus:border-[#5B4BDB]"
                  >
                    <option value="Websites">Websites</option>
                    <option value="Mobile Apps">Mobile Apps</option>
                    <option value="SEO">SEO</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="Branding">Branding</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-hidden focus:border-[#5B4BDB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Pricing Model *
                  </label>
                  <select
                    value={newPricingType}
                    onChange={(e) => setNewPricingType(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-hidden focus:border-[#5B4BDB]"
                  >
                    <option value="fixed">Fixed</option>
                    <option value="monthly">Monthly Retainer</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Description / Deliverables Scope
                </label>
                <textarea
                  rows={3}
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  placeholder="Detail what is included in this service package..."
                  className="w-full px-3.5 py-2 border border-[#E5E7EB] rounded-xl text-sm focus:outline-hidden focus:border-[#5B4BDB]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#5B4BDB] hover:bg-[#4C3EBE] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-soft"
                >
                  {isSubmitting ? "Creating..." : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ServicesView />
    </Suspense>
  );
}
