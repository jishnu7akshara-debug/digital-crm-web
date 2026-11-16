"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, ShieldCheck, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { PageReady } from "@/components/page-ready";

interface LineItemForm {
  id: string;
  description: string;
  hsn_sac_code: string;
  quantity: number;
  unit_price_rupees: number;
  tax_rate_percent: number;
}

export default function NewInvoicePage() {
  const router = useRouter();

  // Load clients
  const { data: clientsData, isLoading: isClientsLoading } = useQuery<{ items: any[] }>({
    queryKey: ["clients-all"],
    queryFn: () => api.get<any>("/clients?page_size=100"),
  });

  const clients = clientsData?.items || [];

  // Form State
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("Thank you for your business. Please remit payment via NEFT/RTGS.");
  const [terms, setTerms] = useState("Payment due within 15 days of invoice date.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    {
      id: "item-1",
      description: "Full-Stack Web App Development & Cloud Architecture",
      hsn_sac_code: "998314",
      quantity: 1,
      unit_price_rupees: 50000,
      tax_rate_percent: 18,
    },
  ]);

  const selectedClient = clients.find((c) => c.id === clientId);

  // Derived GST type: Karnataka (29) is intra_state, else inter_state
  const isIntraState = React.useMemo(() => {
    if (!selectedClient) return true;
    if (selectedClient.gstin && selectedClient.gstin.length >= 2) {
      return selectedClient.gstin.startsWith("29");
    }
    if (selectedClient.state) {
      const st = selectedClient.state.toLowerCase();
      return st === "karnataka" || st === "ka" || st === "29";
    }
    return true;
  }, [selectedClient]);

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        description: "",
        hsn_sac_code: "998314",
        quantity: 1,
        unit_price_rupees: 0,
        tax_rate_percent: 18,
      },
    ]);
  };

  const updateLineItem = (id: string, field: keyof LineItemForm, val: any) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculations
  const subtotalRupees = lineItems.reduce(
    (sum, item) => sum + item.quantity * (Number(item.unit_price_rupees) || 0),
    0
  );

  const totalTaxRupees = lineItems.reduce((sum, item) => {
    const itemSubtotal = item.quantity * (Number(item.unit_price_rupees) || 0);
    return sum + (itemSubtotal * item.tax_rate_percent) / 100;
  }, 0);

  const totalPayableRupees = subtotalRupees + totalTaxRupees;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Please select a client.");
      return;
    }

    if (lineItems.some((item) => !item.description.trim() || item.unit_price_rupees <= 0)) {
      toast.error("Please ensure all line items have a valid description and price.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        client_id: clientId,
        project_id: projectId.trim() || null,
        issue_date: issueDate,
        due_date: dueDate,
        line_items: lineItems.map((item) => ({
          description: item.description.trim(),
          hsn_sac_code: item.hsn_sac_code.trim() || "998314",
          quantity: Number(item.quantity) || 1,
          unit_price_paise: Math.round(Number(item.unit_price_rupees) * 100),
          tax_rate_percent: Number(item.tax_rate_percent) || 18,
        })),
        notes: notes.trim() || null,
        terms: terms.trim() || null,
      };

      const res = await api.post<string>("/invoices", payload);
      toast.success("Invoice generated and issued successfully!");
      if (res) {
        router.push(`/internal/invoices/${res}`);
      } else {
        router.push("/internal/invoices");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate invoice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageReady when={!isClientsLoading} />
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/internal/invoices"
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              New Tax Invoice
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Indian GST compliant invoicing with atomic sequential number assignment.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client & Metadata Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Invoice Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Client <span className="text-destructive">*</span>
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select a client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - {c.city || "India"}
                  </option>
                ))}
              </select>
              {isClientsLoading && (
                <p className="text-xs text-muted-foreground mt-1">Loading clients...</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                GST Tax Mode
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-muted/30 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-foreground">
                  {selectedClient ? (
                    isIntraState ? (
                      <span className="text-emerald-700 dark:text-emerald-400">
                        Intra-State: CGST (9%) + SGST (9%)
                      </span>
                    ) : (
                      <span className="text-blue-700 dark:text-blue-400">
                        Inter-State: IGST (18%)
                      </span>
                    )
                  ) : (
                    "Auto-derived on client selection"
                  )}
                </span>
                {selectedClient?.gstin && (
                  <span className="ml-auto text-muted-foreground font-mono">
                    GSTIN: {selectedClient.gstin}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Issue Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Due Date <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Line Items Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Line Items
            </h2>
            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent text-xs font-medium text-foreground transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, idx) => {
              const lineTotal =
                item.quantity *
                (Number(item.unit_price_rupees) || 0) *
                (1 + item.tax_rate_percent / 100);

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-3 items-end p-3 rounded-lg border border-border/60 bg-muted/10"
                >
                  <div className="col-span-12 md:col-span-4">
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Description #{idx + 1}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SEO Retainer Month 1"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                      required
                      className="w-full px-2.5 py-1.5 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="col-span-4 md:col-span-2">
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      HSN / SAC
                    </label>
                    <input
                      type="text"
                      value={item.hsn_sac_code}
                      onChange={(e) => updateLineItem(item.id, "hsn_sac_code", e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-input bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="col-span-3 md:col-span-1">
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateLineItem(item.id, "quantity", parseInt(e.target.value) || 1)
                      }
                      className="w-full px-2.5 py-1.5 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-center"
                    />
                  </div>

                  <div className="col-span-5 md:col-span-2">
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Unit Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.unit_price_rupees}
                      onChange={(e) =>
                        updateLineItem(
                          item.id,
                          "unit_price_rupees",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-md border border-input bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-right"
                    />
                  </div>

                  <div className="col-span-4 md:col-span-1">
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      GST %
                    </label>
                    <select
                      value={item.tax_rate_percent}
                      onChange={(e) =>
                        updateLineItem(item.id, "tax_rate_percent", parseInt(e.target.value) || 18)
                      }
                      className="w-full px-1.5 py-1.5 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-center"
                    >
                      <option value="18">18%</option>
                      <option value="12">12%</option>
                      <option value="5">5%</option>
                      <option value="0">0%</option>
                    </select>
                  </div>

                  <div className="col-span-6 md:col-span-1 text-right">
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      Total
                    </label>
                    <span className="inline-block py-1.5 text-xs font-semibold font-mono text-foreground">
                      ₹{lineTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="col-span-2 md:col-span-1 text-center">
                    <button
                      type="button"
                      disabled={lineItems.length <= 1}
                      onClick={() => removeLineItem(item.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end pt-4 border-t border-border">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-mono font-medium text-foreground">
                  ₹{subtotalRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              {isIntraState ? (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>CGST (9%):</span>
                    <span className="font-mono font-medium text-foreground">
                      ₹{(totalTaxRupees / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>SGST (9%):</span>
                    <span className="font-mono font-medium text-foreground">
                      ₹{(totalTaxRupees / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-muted-foreground">
                  <span>IGST (18%):</span>
                  <span className="font-mono font-medium text-foreground">
                    ₹{totalTaxRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-foreground pt-2 border-t border-border">
                <span>Total Payable:</span>
                <span className="font-mono text-primary">
                  ₹{totalPayableRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Client Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Payment Terms
              </label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/internal/invoices"
            className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-accent text-xs font-medium text-foreground transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? "Issuing Invoice..." : "Issue Tax Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
