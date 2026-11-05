"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Briefcase,
  FileText,
  CreditCard,
  Plus,
  Download,
  AlertCircle,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Clock,
  Layers,
  Headphones,
  CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { formatINRPrecise, formatDate } from "@/lib/utils";

interface ServiceOption {
  id: string;
  name: string;
  code: string;
  category: string;
  default_price_rupees: number;
  pricing_type: string;
}

interface Client360Detail {
  id: string;
  name: string;
  brand_name?: string;
  code: string;
  status: string;
  gstin?: string;
  website?: string;
  industry?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  account_manager?: { id: string; name: string; email: string };
  contacts: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    designation?: string;
    is_primary: boolean;
  }[];
  services: {
    id: string;
    service_id: string;
    service_name: string;
    category: string;
    status: string;
    price_rupees: number;
    billing_cycle: string;
    start_date: string;
    renewal_date?: string;
  }[];
  projects: {
    id: string;
    name: string;
    code: string;
    status: string;
    progress_percent: number;
    due_date?: string;
  }[];
  invoices: {
    id: string;
    invoice_number: string;
    issue_date: string;
    due_date: string;
    status: string;
    total_rupees: number;
    balance_rupees: number;
  }[];
  contracts: any[];
  proposals: any[];
  support_tickets: any[];
  metrics: {
    total_invoiced_rupees: number;
    total_collected_rupees: number;
    total_outstanding_rupees: number;
    services_count: number;
    projects_count: number;
  };
}

export default function Client360Page() {
  const params = useParams();
  const clientId = params.id as string;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"services" | "projects" | "invoices" | "contacts">("services");
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [subscribePriceRupees, setSubscribePriceRupees] = useState<number>(0);
  const [subscribeCycle, setSubscribeCycle] = useState("monthly");

  const { data: client, isLoading, error } = useQuery<Client360Detail>({
    queryKey: ["client-360", clientId],
    queryFn: () => api.get<Client360Detail>(`/clients/${clientId}`),
    enabled: !!clientId,
  });

  const { data: serviceCatalogue } = useQuery<ServiceOption[]>({
    queryKey: ["service-catalogue"],
    queryFn: () => api.get<ServiceOption[]>("/services"),
    enabled: isSubscribeModalOpen,
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/clients/${clientId}/services`, {
        service_id: selectedServiceId,
        price_paise: Math.round(subscribePriceRupees * 100),
        billing_cycle: subscribeCycle,
        start_date: new Date().toISOString().split("T")[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-360", clientId] });
      setIsSubscribeModalOpen(false);
      setSelectedServiceId("");
      setSubscribePriceRupees(0);
    },
    onError: (err: any) => {
      alert(err.message || "Failed to subscribe client to service.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-7 w-7 rounded-full border-2 border-[#6C3BDB] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-8 text-center text-rose-600 text-xs">
        Failed to load Client 360 profile. Ensure valid permissions and client ID.
      </div>
    );
  }

  return (
    <>
      <Header
        title={`Client 360: ${client.name}`}
        subtitle={`Code: ${client.code} • GSTIN: ${client.gstin || "Unregistered"}`}
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Client 360 Header Profile Card */}
        <Card className="border-[#E9E5F0] bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="h-14 w-14 rounded-xl bg-[#F5F1FF] text-[#6C3BDB] flex items-center justify-center font-bold text-xl flex-shrink-0 border border-[#E9E5F0]">
                  {client.name[0]}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-[#1D1930]">{client.name}</h2>
                    {client.brand_name && (
                      <Badge variant="default" className="text-xs">
                        {client.brand_name}
                      </Badge>
                    )}
                    <Badge variant={client.status === "active" ? "success" : "secondary"}>
                      {client.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#77738A] mt-2">
                    <span className="flex items-center">
                      <Building2 className="h-3.5 w-3.5 mr-1" />
                      {client.industry || "Enterprise"}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      {client.city ? `${client.city}, ${client.state}` : "India"}
                    </span>
                    <span className="font-mono text-[11px] bg-[#F8F8FC] px-1.5 py-0.5 rounded border border-[#E9E5F0]">
                      GSTIN: {client.gstin || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Manager Pill */}
              <div className="bg-[#F8F8FC] border border-[#E9E5F0] p-3 rounded-lg text-xs">
                <div className="text-[10px] text-[#77738A] font-semibold uppercase tracking-wider">
                  Account Manager
                </div>
                <div className="font-semibold text-[#1D1930] mt-0.5">
                  {client.account_manager?.name || "Senior Partner"}
                </div>
                <div className="text-[11px] text-[#77738A]">{client.account_manager?.email}</div>
              </div>
            </div>

            {/* Financial Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#E9E5F0]">
              <div>
                <p className="text-[11px] text-[#77738A] font-medium">Subscribed Services</p>
                <h4 className="text-lg font-bold text-[#1D1930] mt-0.5">{client.services.length} offerings</h4>
              </div>
              <div>
                <p className="text-[11px] text-[#77738A] font-medium">Active Projects</p>
                <h4 className="text-lg font-bold text-[#1D1930] mt-0.5">{client.projects.length} workspaces</h4>
              </div>
              <div>
                <p className="text-[11px] text-[#77738A] font-medium">Total Invoiced (GST)</p>
                <h4 className="text-lg font-bold text-[#1D1930] mt-0.5">
                  {formatINRPrecise(client.metrics.total_invoiced_rupees)}
                </h4>
              </div>
              <div>
                <p className="text-[11px] text-[#77738A] font-medium">Outstanding Balance</p>
                <h4 className="text-lg font-bold text-amber-600 mt-0.5">
                  {formatINRPrecise(client.metrics.total_outstanding_rupees)}
                </h4>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E9E5F0] space-x-6">
          <button
            onClick={() => setActiveTab("services")}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === "services"
                ? "border-[#6C3BDB] text-[#6C3BDB]"
                : "border-transparent text-[#77738A] hover:text-[#1D1930]"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Subscribed Services ({client.services.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("projects")}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === "projects"
                ? "border-[#6C3BDB] text-[#6C3BDB]"
                : "border-transparent text-[#77738A] hover:text-[#1D1930]"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Projects ({client.projects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("invoices")}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === "invoices"
                ? "border-[#6C3BDB] text-[#6C3BDB]"
                : "border-transparent text-[#77738A] hover:text-[#1D1930]"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Invoices & Billing ({client.invoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("contacts")}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === "contacts"
                ? "border-[#6C3BDB] text-[#6C3BDB]"
                : "border-transparent text-[#77738A] hover:text-[#1D1930]"
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>Contacts ({client.contacts.length})</span>
          </button>
        </div>

        {/* Tab Content: Subscribed Services */}
        {activeTab === "services" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1D1930]">Active Service Subscriptions</h3>
                <p className="text-xs text-[#77738A]">
                  One client buying multiple services (Website, SEO, Social Media, Custom ERP)
                </p>
              </div>
              <Button size="sm" onClick={() => setIsSubscribeModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Subscribe New Service
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.services.map((svc) => (
                <Card key={svc.id} className="hover:border-[#6C3BDB] transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="default" className="text-[10px] uppercase font-mono mb-1.5">
                          {svc.category}
                        </Badge>
                        <h4 className="text-sm font-bold text-[#1D1930]">{svc.service_name}</h4>
                        <div className="text-xs text-[#77738A] mt-1">
                          Billing: <span className="capitalize font-medium text-[#1D1930]">{svc.billing_cycle.replace("_", " ")}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-[#6C3BDB]">
                          {formatINRPrecise(svc.price_rupees)}
                        </div>
                        <span className="text-[10px] text-[#77738A]">
                          {svc.billing_cycle === "one_time" ? "Fixed price" : "/ billing cycle"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E9E5F0] flex items-center justify-between text-[11px] text-[#77738A]">
                      <span>Started: {formatDate(svc.start_date)}</span>
                      {svc.renewal_date && <span>Renews: {formatDate(svc.renewal_date)}</span>}
                      <Badge variant={svc.status === "active" ? "success" : "secondary"}>
                        {svc.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Projects */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1D1930]">Client Project Workspaces</h3>
                <p className="text-xs text-[#77738A]">Each service spawns projects with milestones and tasks</p>
              </div>
              <Link href="/internal/projects">
                <Button size="sm" variant="outline">
                  Manage Projects
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.projects.map((proj) => (
                <Card key={proj.id} className="hover:border-[#6C3BDB] transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-[#77738A]">{proj.code}</span>
                        <h4 className="text-sm font-bold text-[#1D1930] mt-0.5">{proj.name}</h4>
                      </div>
                      <Badge variant="default">{proj.status.replace("_", " ").toUpperCase()}</Badge>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-[#77738A] mb-1">
                        <span>Milestone Progress</span>
                        <span className="font-semibold text-[#1D1930]">{proj.progress_percent}%</span>
                      </div>
                      <div className="w-full bg-[#F3F1F8] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#6C3BDB] h-2 rounded-full"
                          style={{ width: `${proj.progress_percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E9E5F0] flex items-center justify-between">
                      <span className="text-xs text-[#77738A]">
                        Due: {proj.due_date ? formatDate(proj.due_date) : "TBD"}
                      </span>
                      <Link href={`/internal/projects/${proj.id}`}>
                        <Button size="sm" variant="secondary" className="h-7 text-xs">
                          Open Workspace <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Invoices & Tax Billing */}
        {activeTab === "invoices" && (
          <Card>
            <CardHeader className="p-4 border-b border-[#E9E5F0] flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#77738A]">
                  Tax Invoices & Indian GST Records
                </CardTitle>
                <p className="text-xs text-[#77738A] mt-0.5">
                  Immutable issued snapshots, integer paise calculations, and verified PDF generation
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E9E5F0] bg-[#F8F8FC] text-[#77738A] font-medium">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Total (INR)</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-right">Tax Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E5F0]">
                  {client.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#F8F8FC]">
                      <td className="py-3 px-4 font-bold text-[#1D1930]">{inv.invoice_number}</td>
                      <td className="py-3 px-4 text-[#77738A]">{formatDate(inv.issue_date)}</td>
                      <td className="py-3 px-4 text-[#77738A]">{formatDate(inv.due_date)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={inv.status === "paid" ? "success" : "warning"}>
                          {inv.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[#1D1930]">
                        {formatINRPrecise(inv.total_rupees)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600">
                        {formatINRPrecise(inv.balance_rupees)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() =>
                            api.downloadPdf(
                              `/invoices/${inv.id}/pdf`,
                              `Tax_Invoice_${inv.invoice_number}.pdf`
                            )
                          }
                        >
                          <Download className="h-3 w-3 mr-1 text-[#6C3BDB]" /> PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Tab Content: Contacts */}
        {activeTab === "contacts" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {client.contacts.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#1D1930]">{c.name}</h4>
                    {c.is_primary && <Badge variant="default">PRIMARY</Badge>}
                  </div>
                  <p className="text-[11px] text-[#77738A] mt-0.5">{c.designation || "Contact Person"}</p>
                  <div className="mt-3 space-y-1 text-xs text-[#77738A]">
                    <div className="flex items-center">
                      <Mail className="h-3 w-3 mr-1.5 text-[#6C3BDB]" /> {c.email}
                    </div>
                    {c.phone && (
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-1.5 text-[#6C3BDB]" /> {c.phone}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Subscribe Service Modal */}
        <Modal
          isOpen={isSubscribeModalOpen}
          onClose={() => setIsSubscribeModalOpen(false)}
          title="Subscribe Client to Service"
          description="Select from Digital Footprint's catalog offerings (Web, SEO, Social, ERP, EdTech)."
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">Select Service</label>
              <select
                className="w-full text-xs rounded-md border border-[#E9E5F0] p-2 bg-white"
                value={selectedServiceId}
                onChange={(e) => {
                  setSelectedServiceId(e.target.value);
                  const selected = serviceCatalogue?.find((s) => s.id === e.target.value);
                  if (selected) {
                    setSubscribePriceRupees(selected.default_price_rupees);
                  }
                }}
              >
                <option value="">-- Choose a service offering --</option>
                {serviceCatalogue?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category.toUpperCase()}) — Default: ₹{s.default_price_rupees.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">Agreed Price (INR)</label>
              <Input
                type="number"
                value={subscribePriceRupees || ""}
                onChange={(e) => setSubscribePriceRupees(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">Billing Cycle</label>
              <select
                className="w-full text-xs rounded-md border border-[#E9E5F0] p-2 bg-white"
                value={subscribeCycle}
                onChange={(e) => setSubscribeCycle(e.target.value)}
              >
                <option value="one_time">One Time</option>
                <option value="monthly">Monthly Subscription</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setIsSubscribeModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => subscribeMutation.mutate()}
                isLoading={subscribeMutation.isPending}
                disabled={!selectedServiceId || subscribePriceRupees <= 0}
              >
                Confirm Subscription
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </>
  );
}

