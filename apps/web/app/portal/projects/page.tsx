"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban, CheckCircle2, Clock, Eye } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function PortalProjectsPage() {
  const { data: projects, isLoading } = useQuery<any>({
    queryKey: ["portal-projects"],
    queryFn: () => api.get<any>("/projects?page_size=50"),
  });

  return (
    <>
      <Header
        title="Project Workspaces"
        subtitle="Review progress, deliverables, and milestones for your contracted services"
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading && (
            <div className="col-span-2 text-center py-12 text-[#77738A] text-xs">
              Loading your projects...
            </div>
          )}

          {projects?.items?.map((proj: any) => (
            <Card key={proj.id}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#77738A]">{proj.code}</span>
                    <h3 className="text-base font-bold text-[#1D1930] mt-0.5">{proj.name}</h3>
                  </div>
                  <Badge variant="default">{proj.status.replace("_", " ").toUpperCase()}</Badge>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-[#77738A] mb-1">
                    <span>Delivery Progress</span>
                    <span className="font-semibold text-[#1D1930]">{proj.progress_percent}%</span>
                  </div>
                  <div className="w-full bg-[#F3F1F8] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#6C3BDB] h-2 rounded-full"
                      style={{ width: `${proj.progress_percent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E9E5F0] flex items-center justify-between text-xs text-[#77738A]">
                  <span>Target Date: {proj.due_date ? formatDate(proj.due_date) : "TBD"}</span>
                  <span className="font-medium text-[#1D1930]">Lead: {proj.manager_name || "Lead Engineer"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}

