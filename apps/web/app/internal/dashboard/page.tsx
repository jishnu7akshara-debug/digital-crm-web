"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";

const MONTHLY_CLOSED_WON = [
  { month: "May", amount: 160000 },
  { month: "Jun", amount: 220000 },
  { month: "Jul", amount: 190000 },
  { month: "Aug", amount: 280000 },
  { month: "Sep", amount: 340000 },
  { month: "Oct", amount: 420000 },
];

const LEADS_BY_STATUS = [
  { status: "New", count: 8, max: 10 },
  { status: "Contacted", count: 6, max: 10 },
  { status: "Qualified", count: 4, max: 10 },
  { status: "Proposal", count: 3, max: 10 },
  { status: "Negotiation", count: 2, max: 10 },
];

const RECENT_RECORDS = [
  { name: "Peak Fitness", type: "Account", href: "/internal/clients" },
  { name: "Website redesign", type: "Project", href: "/internal/projects" },
  { name: "Nova Learning", type: "Lead", href: "/internal/leads" },
  { name: "DF-2026-0002", type: "Invoice", href: "/internal/invoices" },
];

const INITIAL_TASKS = [
  { id: "t-1", title: "Call Sri Venkata Traders", due: "Today", done: false },
  { id: "t-2", title: "Send proposal to Bloom Dental", due: "Today", done: false },
  { id: "t-3", title: "Review Peak Fitness deliverable", due: "Tomorrow", done: false },
];

export default function SalesforceHomePage() {
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <div className="space-y-3">
      {/* Top Row: Quarterly Performance + Today's Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left: Quarterly Performance (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#DDDBDA] rounded-[4px] p-4 shadow-none">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#DDDBDA]">
            <h2 className="text-[14px] font-bold text-[#181818]">Quarterly performance</h2>
            <span className="text-[11px] text-[#0176D3] hover:underline cursor-pointer">
              Sample data
            </span>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-1">
            {/* Closed won */}
            <div>
              <span className="text-[12px] text-[#5C5C5C] font-normal block">Closed won</span>
              <span className="text-[20px] font-bold text-[#181818] tracking-tight block mt-1">
                ₹4,20,000
              </span>
              <div className="w-full bg-[#E5E5E5] h-2 rounded-[2px] mt-3 overflow-hidden">
                <div className="bg-[#0176D3] h-2 rounded-[2px]" style={{ width: "52.5%" }} />
              </div>
            </div>

            {/* Open pipeline */}
            <div>
              <span className="text-[12px] text-[#5C5C5C] font-normal block">Open pipeline</span>
              <span className="text-[20px] font-bold text-[#181818] tracking-tight block mt-1">
                ₹5,90,000
              </span>
              <div className="w-full bg-[#E5E5E5] h-2 rounded-[2px] mt-3 overflow-hidden">
                <div className="bg-[#0176D3] h-2 rounded-[2px]" style={{ width: "73.7%" }} />
              </div>
            </div>

            {/* Goal */}
            <div>
              <span className="text-[12px] text-[#5C5C5C] font-normal block">Goal</span>
              <span className="text-[20px] font-bold text-[#181818] tracking-tight block mt-1">
                ₹8,00,000
              </span>
              <div className="w-full bg-[#E5E5E5] h-2 rounded-[2px] mt-3 overflow-hidden">
                <div className="bg-[#0176D3] h-2 rounded-[2px]" style={{ width: "100%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Today's tasks (1 col) */}
        <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-4 shadow-none flex flex-col justify-between">
          <div>
            <div className="pb-3 mb-2 border-b border-[#DDDBDA]">
              <h2 className="text-[14px] font-bold text-[#181818]">Today&apos;s tasks</h2>
            </div>

            <div className="space-y-3 pt-1">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="flex items-center justify-between text-[13px] cursor-pointer group select-none"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <div
                      className={`h-4 w-4 rounded-[2px] border flex items-center justify-center transition-colors flex-shrink-0 ${
                        task.done
                          ? "bg-[#0176D3] border-[#0176D3] text-white"
                          : "border-[#DDDBDA] bg-white group-hover:border-[#0176D3]"
                      }`}
                    >
                      {task.done && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span
                      className={`truncate ${
                        task.done ? "line-through text-[#706E6B]" : "text-[#181818]"
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <span className="text-[12px] text-[#5C5C5C] flex-shrink-0 pl-2">
                    {task.due}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: 3 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Closed won by month Bar Chart */}
        <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-4 shadow-none">
          <div className="pb-3 mb-2 border-b border-[#DDDBDA]">
            <h2 className="text-[14px] font-bold text-[#181818]">Closed won by month</h2>
          </div>

          <div className="h-52 w-full pt-2">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_CLOSED_WON} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F3F3" />
                  <XAxis dataKey="month" stroke="#706E6B" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#706E6B"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Closed won"]}
                    contentStyle={{ borderRadius: "4px", border: "1px solid #DDDBDA", fontSize: "12px" }}
                  />
                  <Bar dataKey="amount" fill="#0176D3" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-[#F3F3F3] animate-pulse rounded-[4px]" />
            )}
          </div>
        </div>

        {/* Leads by status Horizontal Bars */}
        <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-4 shadow-none flex flex-col justify-between">
          <div>
            <div className="pb-3 mb-3 border-b border-[#DDDBDA]">
              <h2 className="text-[14px] font-bold text-[#181818]">Leads by status</h2>
            </div>

            <div className="space-y-3 pt-1">
              {LEADS_BY_STATUS.map((item) => (
                <div key={item.status} className="flex items-center text-[12px]">
                  <span className="w-24 text-[#5C5C5C] truncate">{item.status}</span>
                  <div className="flex-1 bg-[#F3F3F3] h-4 rounded-[2px] overflow-hidden mr-3">
                    <div
                      className="bg-[#0176D3] h-4 rounded-[2px]"
                      style={{ width: `${(item.count / item.max) * 100}%` }}
                    />
                  </div>
                  <span className="w-4 text-right font-bold text-[#181818]">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent records */}
        <div className="bg-white border border-[#DDDBDA] rounded-[4px] p-4 shadow-none flex flex-col justify-between">
          <div>
            <div className="pb-3 mb-2 border-b border-[#DDDBDA]">
              <h2 className="text-[14px] font-bold text-[#181818]">Recent records</h2>
            </div>

            <div className="divide-y divide-[#F3F3F3] pt-1">
              {RECENT_RECORDS.map((rec, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-[13px]">
                  <Link
                    href={rec.href}
                    className="text-[#0176D3] hover:underline font-normal truncate"
                  >
                    {rec.name}
                  </Link>
                  <span className="text-[12px] text-[#5C5C5C]">{rec.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
