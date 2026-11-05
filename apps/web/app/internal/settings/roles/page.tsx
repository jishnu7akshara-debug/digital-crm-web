"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  Users,
  ShieldAlert,
  Save,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface PermissionItem {
  id: string;
  code: string;
  module: string;
  name: string;
  description?: string;
  scope: string; // "all", "assigned", "own", "none"
}

interface RoleDetail {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_system: boolean;
  role_type: string;
  user_count: number;
  permissions: PermissionItem[];
}

export default function RolesManagementPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleCode, setNewRoleCode] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [permissionDraft, setPermissionDraft] = useState<Record<string, string>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const { data: roles, isLoading, error } = useQuery<RoleDetail[]>({
    queryKey: ["roles-list"],
    queryFn: () => api.get<RoleDetail[]>("/roles"),
  });

  // Selected active role
  const activeRole = roles?.find((r) => r.id === (selectedRoleId || roles?.[0]?.id));

  // Initialize draft when role changes
  React.useEffect(() => {
    if (activeRole) {
      const map: Record<string, string> = {};
      activeRole.permissions.forEach((p) => {
        map[p.code] = p.scope;
      });
      setPermissionDraft(map);
      setSaveSuccessMsg(null);
    }
  }, [activeRole]);

  // Group permissions by module
  const groupedPermissions: Record<string, PermissionItem[]> = {};
  if (activeRole) {
    activeRole.permissions.forEach((p) => {
      if (!groupedPermissions[p.module]) {
        groupedPermissions[p.module] = [];
      }
      groupedPermissions[p.module].push(p);
    });
  }

  // Update Role Mutation
  const updateRoleMutation = useMutation({
    mutationFn: async () => {
      if (!activeRole) return;
      return api.put(`/roles/${activeRole.id}`, {
        permissions: permissionDraft,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-list"] });
      setSaveSuccessMsg("Permission matrix updated and enforced on server.");
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      alert(err.message || "Failed to save permissions.");
    },
  });

  // Create Role Mutation
  const createRoleMutation = useMutation({
    mutationFn: async () => {
      return api.post("/roles", {
        name: newRoleName,
        code: newRoleCode,
        description: newRoleDesc,
        permissions: {},
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["roles-list"] });
      setIsCreateModalOpen(false);
      setNewRoleName("");
      setNewRoleCode("");
      setNewRoleDesc("");
      setSelectedRoleId(data.id);
    },
    onError: (err: any) => {
      alert(err.message || "Failed to create role.");
    },
  });

  // Delete Role Mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      return api.delete(`/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-list"] });
      setSelectedRoleId(null);
    },
    onError: (err: any) => {
      alert(err.message || "Failed to delete role.");
    },
  });

  const handleScopeChange = (permCode: string, newScope: string) => {
    setPermissionDraft((prev) => ({
      ...prev,
      [permCode]: newScope,
    }));
  };

  return (
    <>
      <Header
        title="Role-Based Access Control (RBAC)"
        subtitle="Configure system permissions, record scoping (All / Assigned / Own), and custom roles"
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Top Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1D1930]">Security Roles & Permission Matrix</h2>
            <p className="text-xs text-[#77738A]">
              FastAPI server-enforced policies. Hiding UI is never authorization.
            </p>
          </div>
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Create Custom Role
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">Only Super Admins can access and modify the permission matrix.</span>
          </div>
        )}

        {saveSuccessMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Roles Selector Sidebar */}
          <Card className="md:col-span-1">
            <CardHeader className="p-4 border-b border-[#E9E5F0]">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#77738A]">
                Roles ({roles?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {isLoading && <div className="p-4 text-xs text-[#77738A]">Loading roles...</div>}
              {roles?.map((r) => {
                const isSelected = activeRole?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`w-full text-left p-3 rounded-md transition-all flex items-center justify-between group ${
                      isSelected
                        ? "bg-[#F5F1FF] text-[#6C3BDB] font-semibold border border-[#E9E5F0]"
                        : "hover:bg-[#F8F8FC] text-[#1D1930]"
                    }`}
                  >
                    <div>
                      <div className="text-xs flex items-center space-x-1.5">
                        <span>{r.name}</span>
                        {r.is_system && (
                          <span className="text-[9px] font-mono px-1 py-0.2 bg-[#F3F1F8] text-[#77738A] rounded">
                            SYSTEM
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#77738A] font-mono mt-0.5">{r.code}</div>
                    </div>
                    <Badge variant={isSelected ? "default" : "secondary"} className="text-[10px]">
                      {r.user_count} {r.user_count === 1 ? "user" : "users"}
                    </Badge>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Permission Matrix Editor */}
          <Card className="md:col-span-3">
            {activeRole ? (
              <>
                <CardHeader className="p-5 border-b border-[#E9E5F0] flex flex-row items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-[#1D1930]">{activeRole.name}</h3>
                      <Badge variant={activeRole.is_system ? "default" : "outline"}>
                        {activeRole.is_system ? "System Protected" : "Custom Role"}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#77738A] mt-1">{activeRole.description || "No description set."}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!activeRole.is_system && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete role '${activeRole.name}'?`)) {
                            deleteRoleMutation.mutate(activeRole.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Role
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => updateRoleMutation.mutate()}
                      isLoading={updateRoleMutation.isPending}
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" /> Save Changes
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-5 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E9E5F0] text-[#77738A] font-medium">
                        <th className="pb-3 w-1/3">Permission Atom</th>
                        <th className="pb-3 w-1/4">Module</th>
                        <th className="pb-3 text-center">None (—)</th>
                        <th className="pb-3 text-center">Own (O)</th>
                        <th className="pb-3 text-center">Assigned/Team (T)</th>
                        <th className="pb-3 text-center">All Records (F)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9E5F0]">
                      {activeRole.permissions.map((perm) => {
                        const currentScope = permissionDraft[perm.code] || perm.scope || "none";
                        const isSuperAdminRole = activeRole.code === "super_admin";

                        return (
                          <tr key={perm.id} className="hover:bg-[#F8F8FC]">
                            <td className="py-2.5 font-medium text-[#1D1930]">
                              <div>{perm.name}</div>
                              <span className="text-[10px] text-[#77738A] font-mono">{perm.code}</span>
                            </td>
                            <td className="py-2.5 text-[#77738A] uppercase font-mono text-[10px]">
                              {perm.module}
                            </td>
                            {/* Scope Radio / Toggles */}
                            <td className="py-2.5 text-center">
                              <input
                                type="radio"
                                name={`perm_${perm.id}`}
                                disabled={isSuperAdminRole}
                                checked={currentScope === "none"}
                                onChange={() => handleScopeChange(perm.code, "none")}
                                className="h-3.5 w-3.5 text-[#6C3BDB] focus:ring-[#6C3BDB]"
                              />
                            </td>
                            <td className="py-2.5 text-center">
                              <input
                                type="radio"
                                name={`perm_${perm.id}`}
                                disabled={isSuperAdminRole}
                                checked={currentScope === "own"}
                                onChange={() => handleScopeChange(perm.code, "own")}
                                className="h-3.5 w-3.5 text-[#6C3BDB] focus:ring-[#6C3BDB]"
                              />
                            </td>
                            <td className="py-2.5 text-center">
                              <input
                                type="radio"
                                name={`perm_${perm.id}`}
                                disabled={isSuperAdminRole}
                                checked={currentScope === "assigned"}
                                onChange={() => handleScopeChange(perm.code, "assigned")}
                                className="h-3.5 w-3.5 text-[#6C3BDB] focus:ring-[#6C3BDB]"
                              />
                            </td>
                            <td className="py-2.5 text-center">
                              <input
                                type="radio"
                                name={`perm_${perm.id}`}
                                disabled={isSuperAdminRole}
                                checked={currentScope === "all"}
                                onChange={() => handleScopeChange(perm.code, "all")}
                                className="h-3.5 w-3.5 text-[#6C3BDB] focus:ring-[#6C3BDB]"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </>
            ) : (
              <div className="p-8 text-center text-xs text-[#77738A]">Select a role to inspect permissions.</div>
            )}
          </Card>
        </div>

        {/* Create Role Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Custom Role"
          description="Define a new role with specific permissions and scopes."
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">Role Name</label>
              <Input
                placeholder="e.g. Senior Account Strategist"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">System Code (Unique identifier)</label>
              <Input
                placeholder="e.g. senior_account_strategist"
                value={newRoleCode}
                onChange={(e) => setNewRoleCode(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1">Description</label>
              <Input
                placeholder="Responsibility and scope of role"
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createRoleMutation.mutate()}
                isLoading={createRoleMutation.isPending}
                disabled={!newRoleName.trim() || !newRoleCode.trim()}
              >
                Create Role
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </>
  );
}

