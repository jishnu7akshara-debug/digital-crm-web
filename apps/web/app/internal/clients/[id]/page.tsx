"use client";

import React, { useState } from "react";
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
  Trash2,
  X,
  Pause,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { PageReady } from "@/components/page-ready";

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = (params?.id as string) || "";

  // Contact Modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactDesignation, setContactDesignation] = useState("");
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);

  // Service Modal
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [servicePriceRupees, setServicePriceRupees] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [isServiceSubmitting, setIsServiceSubmitting] = useState(false);

  // Fetch client 360 profile
  const {
    data: client,
    isLoading,
    error,
    refetch,
  } = useQuery<any>({
    queryKey: ["client-360", clientId],
    queryFn: async () => {
      return await api.get<any>(`/clients/${clientId}`);
    },
    enabled: !!clientId,
  });

  // Fetch services for subscription modal
  const { data: catalogueServices } = useQuery<any[]>({
    queryKey: ["services-catalogue"],
    queryFn: async () => {
      return await api.get<any[]>("/services");
    },
    enabled: showServiceModal,
  });

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim()) {
      toast.error("Name and email are required.");
      return;
    }

    try {
      setIsContactSubmitting(true);
      await api.post(`/clients/${client.id}/contacts`, {
        name: contactName.trim(),
        email: contactEmail.trim().toLowerCase(),
        phone: contactPhone.trim() || null,
        designation: contactDesignation.trim() || null,
        is_primary: false,
      });

      toast.success("Contact person added.");
      setShowContactModal(false);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactDesignation("");
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add contact.");
    } finally {
      setIsContactSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Remove this contact person?")) return;
    try {
      await api.delete(`/clients/${client.id}/contacts/${contactId}`);
      toast.success("Contact removed.");
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove contact.");
    }
  };

  const handleSubscribeService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !servicePriceRupees) {
      toast.error("Select a service and specify the billing price.");
      return;
    }

    try {
      setIsServiceSubmitting(true);
      const pricePaise = Math.round((parseFloat(servicePriceRupees) || 0) * 100);
      const today = new Date().toISOString().split("T")[0];

      await api.post(`/clients/${client.id}/services`, {
        service_id: selectedServiceId,
        price_paise: pricePaise,
        billing_cycle: billingCycle,
        start_date: today,
      });

      toast.success("Subscribed client to service.");
      setShowServiceModal(false);
      setSelectedServiceId("");
      setServicePriceRupees("");
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to subscribe service.");
    } finally {
      setIsServiceSubmitting(false);
    }
  };

  const handleToggleServiceStatus = async (subId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "paused" : "active";
    try {
      await api.post(
        `/clients/${client.id}/services/${subId}/status?target_status=${nextStatus}`
      );
      toast.success(`Service status set to ${nextStatus}.`);
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update service status.");
    }
  };

  const handleArchiveClient = async () => {
    if (!confirm(`Are you sure you want to archive account "${client.name}"?`)) return;
    try {
      await api.delete(`/clients/${client.id}`);
      toast.success("Client account archived.");
      router.push("/internal/clients");
    } catch (err: any) {
      toast.error(err?.message || "Failed to archive client.");
    }
  };

  if (isLoading) return <PageSkeleton />;
  if (error || !client) {
    return (
      <ErrorState
        message={(error as any)?.message || "Client profile not found"}
        onRetry={() => refetch()}
      />
    );
  }

  const initials = client.name
    .split(" ")
    .map((w: string) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CA";

  return (
    <div className="space-y-6 pb-12">
      <PageReady when={!isLoading && !!client} />
      {/* Back button */}
      <Link
        href="/internal/clients"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Accounts</span>
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="h-16 w-16 rounded-2xl bg-[#EEF2FF] border border-[#CBD5E1] text-[#5B4BDB] font-bold text-xl flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                {client.code}
              </span>
              <span className="text-[11px] text-[#94A3B8]">·</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">
                {client.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">{client.name}</h1>
            <p className="text-[14px] text-[#64748B] mt-0.5">
              {client.industry || "General Industry"} · {client.city || "India"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setShowServiceModal(true)}
            className="h-10 px-4 bg-[#5B4BDB] hover:bg-[#4C3EBE] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Service</span>
          </button>
          <button
            onClick={handleArchiveClient}
            className="h-10 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors flex items-center space-x-1 text-xs font-medium"
            title="Archive client"
          >
            <Trash2 className="h-4 w-4" />
            <span>Archive</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Invoiced, Collected, Outstanding, Services */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Total Invoiced
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-[#0F172A]">
              ₹{client.financial_summary?.total_invoiced_rupees.toLocaleString("en-IN") || "0"}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Total Collected
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-[#059669]">
              ₹{client.financial_summary?.total_paid_rupees.toLocaleString("en-IN") || "0"}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Outstanding Due
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-[#5B4BDB]">
              ₹{client.financial_summary?.outstanding_rupees.toLocaleString("en-IN") || "0"}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-card">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block">
            Active Retainers
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-[#0F172A]">
              {client.services?.length || 0}
            </span>
            <span className="text-xs font-semibold text-[#64748B]">Services</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Subscribed Services & Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col: Subscribed Services Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E7EB]">
              <div>
                <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  ACTIVE CONTRACTS
                </span>
                <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                  Subscribed Services ({client.services?.length || 0})
                </h3>
              </div>
              <button
                onClick={() => setShowServiceModal(true)}
                className="text-xs font-semibold text-[#5B4BDB] hover:underline flex items-center space-x-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Subscribe Service</span>
              </button>
            </div>

            {client.services && client.services.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F9FB] border-b border-[#E5E7EB] text-[#94A3B8] font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Service Name</th>
                      <th className="py-2.5 px-3">Billing Cycle</th>
                      <th className="py-2.5 px-3">Price</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {client.services.map((s: any) => (
                      <tr key={s.id} className="hover:bg-[#F8F9FA]">
                        <td className="py-3 px-3 font-semibold text-[#0F172A]">
                          {s.service_name}
                        </td>
                        <td className="py-3 px-3 text-[#64748B] capitalize">{s.billing_cycle}</td>
                        <td className="py-3 px-3 font-bold text-[#0F172A]">
                          ₹{s.price_rupees.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              s.status === "active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleToggleServiceStatus(s.id, s.status)}
                            className="px-2.5 py-1 bg-white hover:bg-[#EEF2FF] border border-[#CBD5E1] text-[#5B4BDB] font-semibold rounded-lg text-xs"
                          >
                            {s.status === "active" ? "Pause" : "Resume"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#94A3B8] border border-dashed border-[#CBD5E1] rounded-xl">
                No active services subscribed yet.
              </div>
            )}
          </div>
        </div>

        {/* Right col: Contacts List */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E7EB]">
              <div>
                <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  DIRECTORY
                </span>
                <h3 className="text-base font-bold text-[#0F172A] mt-0.5">
                  Contacts ({client.contacts?.length || 0})
                </h3>
              </div>
              <button
                onClick={() => setShowContactModal(true)}
                className="text-xs font-semibold text-[#5B4BDB] hover:underline flex items-center space-x-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Contact</span>
              </button>
            </div>

            <div className="space-y-3">
              {client.contacts?.map((ct: any) => (
                <div
                  key={ct.id}
                  className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#0F172A]">{ct.name}</span>
                      {ct.is_primary && (
                        <span className="px-1.5 py-0.2 bg-[#EEF2FF] text-[#5B4BDB] text-[9px] font-bold rounded-sm">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">{ct.email}</div>
                    {ct.phone && <div className="text-[11px] text-[#94A3B8]">{ct.phone}</div>}
                  </div>
                  {!ct.is_primary && (
                    <button
                      onClick={() => handleDeleteContact(ct.id)}
                      className="p-1 hover:bg-red-50 text-[#94A3B8] hover:text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove contact"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
              <h2 className="text-base font-bold text-[#0F172A]">Add Contact Person</h2>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="rahul@domain.com"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Phone</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Designation</label>
                <input
                  type="text"
                  value={contactDesignation}
                  onChange={(e) => setContactDesignation(e.target.value)}
                  placeholder="e.g. Chief Marketing Officer"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isContactSubmitting}
                  className="px-4 py-2 bg-[#5B4BDB] hover:bg-[#4C3EBE] text-white text-xs font-semibold rounded-xl"
                >
                  {isContactSubmitting ? "Adding..." : "Add Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscribe Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
              <h2 className="text-base font-bold text-[#0F172A]">Subscribe Service</h2>
              <button
                onClick={() => setShowServiceModal(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubscribeService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Catalogue Offering *
                </label>
                <select
                  required
                  value={selectedServiceId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedServiceId(id);
                    const found = catalogueServices?.find((s) => s.id === id);
                    if (found) {
                      setServicePriceRupees(String(found.default_price_rupees || 0));
                    }
                  }}
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs"
                >
                  <option value="">-- Choose Catalogue Offering --</option>
                  {catalogueServices?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Agreed Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={servicePriceRupees}
                    onChange={(e) => setServicePriceRupees(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Billing Cycle *
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs"
                  >
                    <option value="monthly">Monthly Retainer</option>
                    <option value="fixed">Fixed One-Time</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isServiceSubmitting}
                  className="px-4 py-2 bg-[#5B4BDB] hover:bg-[#4C3EBE] text-white text-xs font-semibold rounded-xl"
                >
                  {isServiceSubmitting ? "Subscribing..." : "Confirm Subscription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
