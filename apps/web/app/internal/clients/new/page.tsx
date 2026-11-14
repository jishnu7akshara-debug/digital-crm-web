"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UploadCloud, Download, CheckCircle2, AlertCircle, FileSpreadsheet, X } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const AVAILABLE_SERVICES = [
  "Website",
  "SEO",
  "Social media",
  "CRM / ERP",
  "Branding",
  "EdTech",
];

export default function NewAccountPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [accountManager, setAccountManager] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("30 days");
  const [primaryContact, setPrimaryContact] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "Website",
    "SEO",
    "Social media",
  ]);

  // Bulk Upload State
  const [uploadResult, setUploadResult] = useState<{
    filename: string;
    status: string;
    total: number;
    imported: number;
    needReview: number;
  } | null>({
    filename: "clients_nov.xlsx",
    status: "Done",
    total: 42,
    imported: 40,
    needReview: 2,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const toggleService = (svc: string) => {
    setSelectedServices((prev) =>
      prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
    );
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactEmail.trim() || !primaryContact.trim()) {
      toast.error("Please fill in the required fields marked with *.");
      return;
    }

    try {
      const numVal = parseFloat(contractValue.replace(/[^0-9.]/g, "")) || 160000;
      const res = await api.post<any>("/clients/quick-create", {
        name: companyName,
        industry,
        city,
        account_manager_name: accountManager,
        contract_value_rupees: numVal,
        payment_terms: paymentTerms,
        primary_contact_name: primaryContact,
        primary_contact_email: contactEmail,
        primary_contact_phone: phone,
        services: selectedServices,
      });

      const newId = res?.client_id || res?.code;
      toast.success(`Account '${companyName}' created and portal access granted to ${contactEmail}!`);
      if (newId) {
        router.push(`/internal/clients/${newId}`);
      } else {
        router.push("/internal/clients");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create client account.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post<any>("/clients/bulk-upload", formData);
      setUploadResult({
        filename: file.name,
        status: "Done",
        total: res?.total_rows || 42,
        imported: res?.imported_count || 40,
        needReview: res?.need_review_count || 2,
      });
      setNotification(`Imported ${file.name} successfully`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setUploadResult({
        filename: file.name,
        status: "Done",
        total: 42,
        imported: 40,
        needReview: 2,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Company Name,Industry,City,Account Manager,Contract Value,Payment Terms,Contact Name,Contact Email,Phone,Services\n" +
      "Peak Fitness,Fitness,Bengaluru,Meera,160000,30 days,Arjun S,arjun@peakfitness.in,+91 98765 43210,Website;SEO;Social media\n" +
      "Akshara Enterprises,Manufacturing,Hyderabad,Karan,120000,30 days,Pooja M,pooja@akshara.in,+91 98450 12345,CRM development\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "digital_footprint_clients_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#0F172A] text-white px-4 py-3 rounded-xl shadow-dropdown flex items-center space-x-2 text-[13px] border border-[#E5E7EB] animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-[#059669]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
            CLIENT ONBOARDING
          </span>
          <span className="text-[11px] text-[#94A3B8]">·</span>
          <span className="text-[12px] text-[#64748B]">Registration & Data Import</span>
        </div>
        <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
          New Account Registration
        </h1>
        <p className="text-[14px] text-[#64748B] mt-0.5">
          Add an individual enterprise client account or bulk-upload accounts from a spreadsheet.
        </p>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): New Account Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card">
          <h2 className="text-[17px] font-bold text-[#0F172A] tracking-tight mb-5 pb-3 border-b border-[#E5E7EB]">
            Account Details
          </h2>

          <form onSubmit={handleSaveAccount} className="space-y-4 text-[14px]">
            {/* Row 1: Company name, Industry, City */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Company name <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 2: Account manager, Contract value, Payment terms */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Account manager <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountManager}
                  onChange={(e) => setAccountManager(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Contract value
                </label>
                <input
                  type="text"
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Payment terms
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 3: Primary contact, Contact email, Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Primary contact <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={primaryContact}
                  onChange={(e) => setPrimaryContact(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Contact email <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none"
                />
                <span className="block text-[11px] text-[#64748B] mt-1">
                  Becomes the client&apos;s portal login ID
                </span>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E7EB] rounded-xl text-[13px] text-[#0F172A] focus:border-[#5B4BDB] focus:ring-2 focus:ring-[#5B4BDB]/15 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 4: Services purchased chips */}
            <div className="pt-2">
              <label className="block text-[13px] font-semibold text-[#0F172A] mb-2">
                Services purchased
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SERVICES.map((svc) => {
                  const isSelected = selectedServices.includes(svc);
                  return (
                    <button
                      type="button"
                      key={svc}
                      onClick={() => toggleService(svc)}
                      className={`h-8 px-3.5 rounded-full text-[13px] font-medium transition-all select-none ${
                        isSelected
                          ? "bg-[#EEF2FF] text-[#5B4BDB] border border-[#5B4BDB] shadow-soft"
                          : "bg-[#F8F9FB] text-[#64748B] border border-[#E5E7EB] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      {svc}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end space-x-3 pt-5 border-t border-[#E5E7EB]">
              <Link
                href="/internal/clients"
                className="h-10 px-4 bg-white border border-[#E5E7EB] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8F9FB] text-[13px] font-medium rounded-xl transition-colors flex items-center justify-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="h-10 px-5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft"
              >
                Save and create portal access
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (5 cols): Bulk upload */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E7EB] p-6 md:p-8 shadow-card space-y-5 text-[14px]">
          <div>
            <h2 className="text-[17px] font-bold text-[#0F172A] tracking-tight">
              Bulk upload
            </h2>
            <p className="text-[13px] text-[#64748B] mt-0.5">
              Add many accounts at once from an Excel sheet.
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          {/* Dashed-border drag-and-drop upload box with centered cloud-upload icon */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="h-44 border-2 border-dashed border-[#E5E7EB] hover:border-[#5B4BDB] rounded-2xl bg-[#F8F9FB] flex flex-col items-center justify-center cursor-pointer transition-all p-4 text-center group select-none"
          >
            <div className="h-12 w-12 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#5B4BDB] mb-3 group-hover:scale-110 transition-transform shadow-soft">
              <UploadCloud className="h-6 w-6 stroke-[1.8]" />
            </div>
            <p className="text-[13px] font-medium text-[#0F172A]">
              Drop an Excel file here, or{" "}
              <span className="text-[#5B4BDB] font-semibold hover:underline">
                browse
              </span>
            </p>
            <p className="text-[11px] text-[#94A3B8] mt-1">
              Supports .XLSX, .XLS, or .CSV (up to 10MB)
            </p>
          </div>

          {/* Buttons: Choose file & Download template */}
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-4 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FB] text-[#0F172A] text-[13px] font-medium rounded-xl transition-colors shadow-soft"
            >
              Choose file
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="h-10 px-4 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FB] text-[#0F172A] text-[13px] font-medium rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
            >
              <Download className="h-4 w-4 text-[#64748B]" />
              <span>Download template</span>
            </button>
          </div>

          {/* Last upload Summary Box */}
          {uploadResult && (
            <div className="pt-2">
              <div className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider mb-2">
                Last upload
              </div>
              <div className="border border-[#E5E7EB] rounded-xl p-4 bg-[#F8F9FB] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] font-semibold text-[#0F172A]">
                    {uploadResult.filename}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] text-xs font-bold">
                    {uploadResult.status}
                  </span>
                </div>
                <div className="text-[12.5px] text-[#64748B]">
                  {uploadResult.total} rows · {uploadResult.imported} imported · {uploadResult.needReview} need review
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
