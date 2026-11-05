"use client";

import React, { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  status: "in_office" | "remote" | "on_leave";
  joined_date: string;
}

const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: "tm-1",
    name: "Sai Varshith",
    role: "Admin & Executive",
    department: "Leadership",
    email: "admin@digitalfootprint.in",
    phone: "+91 98765 43210",
    status: "in_office",
    joined_date: "Jan 2024",
  },
  {
    id: "tm-2",
    name: "Priya Sharma",
    role: "Senior Project Manager",
    department: "Project Delivery",
    email: "priya@digitalfootprint.in",
    phone: "+91 98765 43211",
    status: "in_office",
    joined_date: "Mar 2024",
  },
  {
    id: "tm-3",
    name: "Rahul Verma",
    role: "Growth & Marketing Lead",
    department: "Digital Marketing",
    email: "rahul@digitalfootprint.in",
    phone: "+91 98765 43212",
    status: "in_office",
    joined_date: "Apr 2024",
  },
  {
    id: "tm-4",
    name: "Ananya Iyer",
    role: "Principal Full-Stack Engineer",
    department: "Engineering",
    email: "ananya@digitalfootprint.in",
    phone: "+91 98765 43213",
    status: "remote",
    joined_date: "Jun 2024",
  },
  {
    id: "tm-5",
    name: "Vikram Rao",
    role: "Lead UI/UX & Brand Designer",
    department: "Design & Media",
    email: "vikram@digitalfootprint.in",
    phone: "+91 98765 43214",
    status: "in_office",
    joined_date: "Jul 2024",
  },
  {
    id: "tm-6",
    name: "Sneha Patel",
    role: "HR & Operations Specialist",
    department: "HR & People",
    email: "sneha@digitalfootprint.in",
    phone: "+91 98765 43215",
    status: "in_office",
    joined_date: "Aug 2024",
  },
  {
    id: "tm-7",
    name: "Amit Gupta",
    role: "Finance & Accounts Lead",
    department: "Finance",
    email: "finance@digitalfootprint.in",
    phone: "+91 98765 43216",
    status: "in_office",
    joined_date: "Sep 2024",
  },
  {
    id: "tm-8",
    name: "Neha Reddy",
    role: "SEO & Content Strategist",
    department: "Digital Marketing",
    email: "neha@digitalfootprint.in",
    phone: "+91 98765 43217",
    status: "on_leave",
    joined_date: "Nov 2024",
  },
];

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    role: "",
    department: "Engineering",
    email: "",
    phone: "+91 ",
  });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) return;

    const tm: TeamMember = {
      id: `tm-${Date.now()}`,
      name: newMember.name,
      role: newMember.role || "Specialist",
      department: newMember.department,
      email: newMember.email,
      phone: newMember.phone,
      status: "in_office",
      joined_date: "Nov 2026",
    };

    setMembers([...members, tm]);
    setIsModalOpen(false);
    setNewMember({
      name: "",
      role: "",
      department: "Engineering",
      email: "",
      phone: "+91 ",
    });
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === "all" || m.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F8FC]">
      <Header />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Title & Quick Link to Attendance */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-[#77738A] mb-1">
              <Link href="/internal/dashboard" className="hover:text-[#6437EA]">Dashboard</Link>
              <span>/</span>
              <span className="text-[#1D1930] font-medium">Team</span>
            </div>
            <h1 className="text-2xl font-black text-[#1D1930] tracking-tight flex items-center space-x-3">
              <span>Team Directory</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EFEBFC] text-[#6437EA]">
                {members.length} Members
              </span>
            </h1>
            <p className="text-xs text-[#77738A] mt-1">
              Manage employees, departments, roles, and view daily attendance status.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/internal/attendance">
              <Button
                variant="outline"
                className="text-xs px-4 py-2.5 rounded-xl border-[#EBE8F3] text-[#6437EA] hover:bg-[#EFEBFC] flex items-center space-x-2"
              >
                <Clock className="h-4 w-4" />
                <span>Attendance & Timesheets</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#6437EA] hover:bg-[#5528DA] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Member</span>
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#EBE8F3] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#9D95B5]" />
            <input
              type="text"
              placeholder="Search team members by name or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl pl-10 pr-4 py-2 text-xs text-[#1D1930] placeholder:text-[#9D95B5] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs overflow-x-auto pb-1 sm:pb-0">
            {["all", "Leadership", "Engineering", "Digital Marketing", "Design & Media", "Finance", "HR & People"].map(
              (dept) => (
                <button
                  key={dept}
                  onClick={() => setDeptFilter(dept)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    deptFilter === dept
                      ? "bg-[#6437EA] text-white"
                      : "bg-[#F6F5FA] text-[#77738A] hover:text-[#1D1930]"
                  }`}
                >
                  {dept === "all" ? "All Departments" : dept}
                </button>
              )
            )}
          </div>
        </div>

        {/* Member Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredMembers.map((m) => {
            const initials = m.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2);

            return (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-[#EBE8F3] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#7340F5] to-[#C1A5FF] flex items-center justify-center text-white font-black text-sm shadow-sm">
                      {initials}
                    </div>
                    {m.status === "in_office" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        In Office
                      </span>
                    ) : m.status === "remote" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                        Remote
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                        On Leave
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[#1D1930] mt-3">{m.name}</h3>
                  <p className="text-xs font-semibold text-[#6437EA]">{m.role}</p>
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F6F5FA] text-[#77738A] mt-2">
                    {m.department}
                  </span>
                </div>

                <div className="space-y-2 pt-4 mt-4 border-t border-[#F0EDF7] text-[11px] text-[#77738A]">
                  <div className="flex items-center space-x-2 truncate">
                    <Mail className="h-3.5 w-3.5 text-[#9D95B5] flex-shrink-0" />
                    <span className="truncate">{m.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3.5 w-3.5 text-[#9D95B5] flex-shrink-0" />
                    <span>{m.phone}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Add Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#EBE8F3]">
            <h3 className="text-base font-bold text-[#1D1930] mb-1">Add Team Member</h3>
            <p className="text-xs text-[#77738A] mb-4">Invite a new employee or staff member.</p>

            <form onSubmit={handleAddMember} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#1D1930] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl px-3.5 py-2 text-xs text-[#1D1930] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1D1930] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="john@digitalfootprint.in"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl px-3.5 py-2 text-xs text-[#1D1930] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#1D1930] mb-1">Role / Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Frontend Engineer"
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl px-3 py-2 text-xs text-[#1D1930] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1D1930] mb-1">Department</label>
                  <select
                    value={newMember.department}
                    onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}
                    className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl px-3 py-2 text-xs text-[#1D1930] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="Design & Media">Design & Media</option>
                    <option value="Project Delivery">Project Delivery</option>
                    <option value="Finance">Finance</option>
                    <option value="HR & People">HR & People</option>
                    <option value="Leadership">Leadership</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1D1930] mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 00000"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  className="w-full bg-[#F6F5FA] border border-[#ECE9F4] rounded-xl px-3.5 py-2 text-xs text-[#1D1930] focus:outline-none focus:ring-1 focus:ring-[#6437EA]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-[#F0EDF7]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs px-4 py-2 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#6437EA] hover:bg-[#5528DA] text-white text-xs font-semibold px-4 py-2 rounded-xl"
                >
                  Save Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
