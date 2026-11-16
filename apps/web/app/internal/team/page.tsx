"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Shield,
  ArrowRight,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PageSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { PageReady } from "@/components/page-ready";

interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string | null;
  designation: string;
  employee_code: string;
  joining_date: string | null;
  is_active: boolean;
}

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New staff form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");

  // Fetch real team members from FastAPI
  const { data: members, isLoading, error, refetch } = useQuery<TeamMember[]>({
    queryKey: ["team-members-list"],
    queryFn: async () => {
      return await api.get<TeamMember[]>("/team");
    },
  });

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !designation.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/team", {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        designation: designation.trim(),
      });

      toast.success(`Team member ${firstName} ${lastName} added.`);
      setIsAddModalOpen(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setDesignation("");
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add team member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState message={(error as any)?.message || "Failed to load team"} onRetry={() => refetch()} />;

  const teamList = members || [];
  const filteredMembers = teamList.filter((m) => {
    const matchesSearch =
      !searchTerm.trim() ||
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.designation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === "all" || m.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(teamList.map((m) => m.department)));

  return (
    <div className="space-y-6 pb-12">
      <PageReady
        when={!isLoading}
        state={error ? "error" : filteredMembers.length === 0 ? "empty" : "success"}
        dataLength={filteredMembers.length}
      />
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              HUMAN RESOURCES & TALENT
            </span>
            <span className="text-[11px] text-[#94A3B8]">·</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#5B4BDB] text-xs font-semibold">
              {teamList.length} Active Team Members
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Team Directory</h1>
          <p className="text-[14px] text-[#64748B] mt-0.5">
            Internal organization roster, staff assignments, designations, and department directory.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="h-10 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-soft flex items-center space-x-1.5"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#E5E7EB] shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search by name, email, or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8F9FB] border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#5B4BDB]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setSelectedDept("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedDept === "all"
                ? "bg-[#5B4BDB] text-white shadow-soft"
                : "bg-[#F8F9FB] text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            All Departments
          </button>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedDept === dept
                  ? "bg-[#5B4BDB] text-white shadow-soft"
                  : "bg-[#F8F9FB] text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Team Grid Cards */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          title="No Team Members Found"
          description={searchTerm ? "No staff members matched your search criteria." : "Get started by adding staff to the roster."}
          actionLabel="Add Member"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((m) => {
            const initials = m.name
              .split(" ")
              .map((w) => w[0])
              .filter(Boolean)
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-card hover:border-[#5B4BDB] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-11 w-11 rounded-xl bg-[#EEF2FF] border border-[#CBD5E1] text-[#5B4BDB] font-bold text-sm flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#0F172A]">{m.name}</h3>
                        <span className="text-[11px] text-[#64748B]">{m.designation}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {m.employee_code}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#64748B] pt-3 border-t border-[#E5E7EB]">
                    <div className="flex items-center space-x-2">
                      <Building className="h-3.5 w-3.5 text-[#94A3B8]" />
                      <span>{m.department}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3.5 w-3.5 text-[#94A3B8]" />
                      <span className="truncate">{m.email}</span>
                    </div>
                    {m.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3.5 w-3.5 text-[#94A3B8]" />
                        <span>{m.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#5B4BDB]">{m.role}</span>
                  <span className="flex items-center space-x-1 text-emerald-600 font-medium text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Active</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for adding team member */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
              <h2 className="text-base font-bold text-[#0F172A]">Add Team Member</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Ananya"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Iyer"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ananya@digitalfootprint.in"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Designation / Role Title *
                </label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Senior Full-Stack Engineer"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#5B4BDB] hover:bg-[#4C3EBE] disabled:opacity-50 text-white text-xs font-semibold rounded-xl"
                >
                  {isSubmitting ? "Saving..." : "Add to Roster"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
