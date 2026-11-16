"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Users,
  ShieldCheck,
  FileText,
  KeyRound,
  Save,
  UserPlus,
  RefreshCw,
  LogOut,
  Check,
  Copy,
  AlertCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { PageReady } from "@/components/page-ready";

// --- Types ---
interface AgencySettings {
  company_name: string;
  company_gstin: string;
  company_address: string;
  support_email: string;
  support_phone: string;
  invoice_prefix: string;
  currency: string;
  working_hours_start: string;
  working_hours_end: string;
  late_threshold_minutes: number;
  holidays: string[];
}

interface StaffUser {
  id: string;
  email: string;
  full_name: string;
  user_type: string;
  is_active: boolean;
  phone?: string;
  created_at: string;
  last_login_at?: string;
  roles: string[];
}

interface RoleItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_system: boolean;
  role_type: string;
  user_count: number;
  permissions: Array<{
    id: string;
    code: string;
    module: string;
    name: string;
    scope: string;
  }>;
}

interface AuditLogItem {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  created_at: string;
  payload?: any;
}

interface UserSessionItem {
  id: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  expires_at: string;
  is_current: boolean;
}

export default function SettingsHubPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"org" | "users" | "roles" | "audit" | "account">("org");

  // --- Queries ---
  const { data: settingsData, isLoading: settingsLoading } = useQuery<AgencySettings>({
    queryKey: ["agency-settings"],
    queryFn: () => api.get<AgencySettings>("/settings"),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery<{ items: StaffUser[]; total: number }>({
    queryKey: ["staff-users"],
    queryFn: () => api.get<{ items: StaffUser[]; total: number }>("/users?page_size=50"),
  });

  const { data: rolesData, isLoading: rolesLoading } = useQuery<RoleItem[]>({
    queryKey: ["roles-list"],
    queryFn: () => api.get<RoleItem[]>("/roles"),
  });

  const { data: auditData, isLoading: auditLoading } = useQuery<{ items: AuditLogItem[]; total: number }>({
    queryKey: ["audit-logs"],
    queryFn: () => api.get<{ items: AuditLogItem[]; total: number }>("/audit-logs?page_size=30"),
  });

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery<UserSessionItem[]>({
    queryKey: ["user-sessions"],
    queryFn: () => api.get<UserSessionItem[]>("/auth/sessions"),
  });

  // --- Tab 1: Organisation State & Mutation ---
  const [orgForm, setOrgForm] = useState<Partial<AgencySettings>>({});
  React.useEffect(() => {
    if (settingsData) {
      setOrgForm(settingsData);
    }
  }, [settingsData]);

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: Partial<AgencySettings>) => api.patch("/settings", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-settings"] });
      toast.success("Agency settings saved successfully");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update settings");
    },
  });

  // --- Tab 2: Users State & Mutations ---
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role_code: "sales_executive",
  });
  const [inviteResult, setInviteResult] = useState<{ invite_url?: string; temp_password?: string } | null>(null);

  const inviteUserMutation = useMutation({
    mutationFn: (payload: typeof inviteForm) => api.post<{ invite_url: string; temp_password: string }>("/users/invite", payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["staff-users"] });
      setInviteResult(data);
      toast.success("User invited successfully");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to invite user");
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ userId, deactivate }: { userId: string; deactivate: boolean }) =>
      api.post(`/users/${userId}/${deactivate ? "deactivate" : "reactivate"}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-users"] });
      toast.success("User status updated");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update user status");
    },
  });

  // --- Tab 3: Roles Matrix State ---
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [permissionDraft, setPermissionDraft] = useState<Record<string, string>>({});
  const activeRole = rolesData?.find((r) => r.id === (selectedRoleId || rolesData?.[0]?.id));

  React.useEffect(() => {
    if (activeRole) {
      const map: Record<string, string> = {};
      activeRole.permissions.forEach((p) => {
        map[p.code] = p.scope;
      });
      setPermissionDraft(map);
    }
  }, [activeRole]);

  const updateRoleMutation = useMutation({
    mutationFn: async () => {
      if (!activeRole) return;
      return api.put(`/roles/${activeRole.id}`, { permissions: permissionDraft });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles-list"] });
      toast.success("Role permissions updated successfully");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update role permissions");
    },
  });

  // --- Tab 5: Account Password & Session Mutations ---
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: { current_password: string; new_password: string }) =>
      api.post("/auth/change-password", payload),
    onSuccess: () => {
      toast.success("Password changed successfully. Other sessions revoked.");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to change password");
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/auth/sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
      toast.success("Session revoked");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to revoke session");
    },
  });

  const isPageReady = !settingsLoading && !usersLoading && !rolesLoading;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <PageReady when={isPageReady} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage agency configuration, team access, permission matrices, and security audit logs.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-1">
        <button
          onClick={() => setActiveTab("org")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "org"
              ? "border-primary text-primary"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Organisation
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "users"
              ? "border-primary text-primary"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" />
          Users & Team
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "roles"
              ? "border-primary text-primary"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Roles & Permissions
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "audit"
              ? "border-primary text-primary"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          Audit Logs
        </button>
        <button
          onClick={() => setActiveTab("account")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "account"
              ? "border-primary text-primary"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          My Account
        </button>
      </div>

      {/* --- TAB 1: ORGANISATION --- */}
      {activeTab === "org" && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Organisation Profile & Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Company Name</label>
                <Input
                  value={orgForm.company_name || ""}
                  onChange={(e) => setOrgForm({ ...orgForm, company_name: e.target.value })}
                  placeholder="Digital Footprint LLP"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">GSTIN / Tax ID</label>
                <Input
                  value={orgForm.company_gstin || ""}
                  onChange={(e) => setOrgForm({ ...orgForm, company_gstin: e.target.value })}
                  placeholder="27ABCDE1234F1Z5"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Registered Office Address</label>
                <Input
                  value={orgForm.company_address || ""}
                  onChange={(e) => setOrgForm({ ...orgForm, company_address: e.target.value })}
                  placeholder="123 Tech Hub, Nariman Point, Mumbai"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Official Support Email</label>
                <Input
                  value={orgForm.support_email || ""}
                  onChange={(e) => setOrgForm({ ...orgForm, support_email: e.target.value })}
                  placeholder="ops@digitalfootprint.in"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Support Phone</label>
                <Input
                  value={orgForm.support_phone || ""}
                  onChange={(e) => setOrgForm({ ...orgForm, support_phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Invoice Series Prefix</label>
                <Input
                  value={orgForm.invoice_prefix || ""}
                  onChange={(e) => setOrgForm({ ...orgForm, invoice_prefix: e.target.value })}
                  placeholder="DF"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Currency</label>
                <Input value={orgForm.currency || "INR"} disabled className="mt-1 bg-slate-50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Standard Work Shift Start</label>
                <Input
                  type="time"
                  value={orgForm.working_hours_start || "09:30"}
                  onChange={(e) => setOrgForm({ ...orgForm, working_hours_start: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Standard Work Shift End</label>
                <Input
                  type="time"
                  value={orgForm.working_hours_end || "18:30"}
                  onChange={(e) => setOrgForm({ ...orgForm, working_hours_end: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Late Attendance Grace Window (Minutes)</label>
                <Input
                  type="number"
                  value={orgForm.late_threshold_minutes || 15}
                  onChange={(e) => setOrgForm({ ...orgForm, late_threshold_minutes: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                onClick={() => updateSettingsMutation.mutate(orgForm)}
                disabled={updateSettingsMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {updateSettingsMutation.isPending ? "Saving..." : "Save Organisation Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- TAB 2: USERS & TEAM --- */}
      {activeTab === "users" && (
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Staff Users & Credentials</CardTitle>
            <Button
              onClick={() => {
                setInviteResult(null);
                setInviteModalOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Invite Team Member
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Roles</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joined Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersData?.items?.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{u.full_name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles?.map((r) => (
                            <Badge key={r} variant="outline" className="text-xs font-mono">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_active ? (
                          <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-rose-50 text-rose-700 border-rose-200">
                            Deactivated
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleUserStatusMutation.mutate({ userId: u.id, deactivate: u.is_active })}
                          className={`text-xs ${u.is_active ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"}`}
                        >
                          {u.is_active ? "Deactivate" : "Reactivate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- TAB 3: ROLES & PERMISSIONS --- */}
      {activeTab === "roles" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Configured Roles</h3>
            {rolesData?.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  (activeRole?.id === role.id)
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{role.name}</span>
                  {role.is_system && (
                    <Badge variant="outline" className="text-[10px]">
                      System
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1 font-mono">{role.code}</div>
              </button>
            ))}
          </div>

          <div className="md:col-span-3">
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg">{activeRole?.name} Permission Matrix</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">{activeRole?.description || "Role access scoping"}</p>
                </div>
                <Button
                  onClick={() => updateRoleMutation.mutate()}
                  disabled={updateRoleMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Matrix
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase">
                      <tr>
                        <th className="px-4 py-2.5">Module / Action</th>
                        <th className="px-4 py-2.5 text-center">None</th>
                        <th className="px-4 py-2.5 text-center">Own</th>
                        <th className="px-4 py-2.5 text-center">Assigned</th>
                        <th className="px-4 py-2.5 text-center">All</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeRole?.permissions.map((perm) => {
                        const currentScope = permissionDraft[perm.code] || perm.scope;
                        return (
                          <tr key={perm.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5">
                              <div className="font-medium text-slate-900">{perm.name}</div>
                              <div className="text-xs text-slate-400 font-mono">{perm.code}</div>
                            </td>
                            {["none", "own", "assigned", "all"].map((scope) => (
                              <td key={scope} className="px-4 py-2.5 text-center">
                                <input
                                  type="radio"
                                  name={`perm-${perm.code}`}
                                  checked={currentScope === scope}
                                  onChange={() =>
                                    setPermissionDraft({
                                      ...permissionDraft,
                                      [perm.code]: scope,
                                    })
                                  }
                                  className="h-4 w-4 text-primary focus:ring-primary border-slate-300"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* --- TAB 4: AUDIT LOGS --- */}
      {activeTab === "audit" && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Security & Operational Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Resource</th>
                    <th className="px-4 py-3">Actor / User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {auditData?.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{item.action}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.resource_type} {item.resource_id ? `(${item.resource_id.slice(0, 8)}...)` : ""}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{item.user_email || item.user_id || "system"}</td>
                    </tr>
                  ))}
                  {(!auditData?.items || auditData.items.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- TAB 5: MY ACCOUNT --- */}
      {activeTab === "account" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Current Password</label>
                <Input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">New Password</label>
                <Input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Confirm New Password</label>
                <Input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={() => {
                  if (passwordForm.new_password !== passwordForm.confirm_password) {
                    toast.error("Passwords do not match");
                    return;
                  }
                  if (passwordForm.new_password.length < 8) {
                    toast.error("New password must be at least 8 characters");
                    return;
                  }
                  changePasswordMutation.mutate({
                    current_password: passwordForm.current_password,
                    new_password: passwordForm.new_password,
                  });
                }}
                disabled={changePasswordMutation.isPending}
                className="w-full"
              >
                {changePasswordMutation.isPending ? "Updating Password..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Active Browser Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessionsData?.map((session) => (
                <div
                  key={session.id}
                  className="p-3 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      {session.ip_address || "127.0.0.1"}
                      {session.is_current && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Current Device
                        </Badge>
                      )}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5 max-w-xs truncate">
                      {session.user_agent || "Browser Client"}
                    </div>
                  </div>
                  {!session.is_current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeSessionMutation.mutate(session.id)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs"
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- Invite Modal --- */}
      <Modal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Invite New Team Member">
        {inviteResult ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-sm">
              User invited successfully! Share the credentials or invitation link below:
            </div>
            {inviteResult.temp_password && (
              <div>
                <label className="text-xs font-semibold text-slate-600">Temporary Password</label>
                <div className="flex gap-2 mt-1">
                  <Input value={inviteResult.temp_password} readOnly className="font-mono text-sm bg-slate-50" />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteResult.temp_password || "");
                      toast.success("Password copied");
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            {inviteResult.invite_url && (
              <div>
                <label className="text-xs font-semibold text-slate-600">Invitation URL</label>
                <div className="flex gap-2 mt-1">
                  <Input value={inviteResult.invite_url} readOnly className="font-mono text-xs bg-slate-50" />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteResult.invite_url || "");
                      toast.success("URL copied");
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            <Button onClick={() => setInviteModalOpen(false)} className="w-full mt-4">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Full Name</label>
              <Input
                value={inviteForm.full_name}
                onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                placeholder="Rohan Sharma"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="rohan@digitalfootprint.in"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Phone (Optional)</label>
              <Input
                value={inviteForm.phone}
                onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Assign Role</label>
              <select
                value={inviteForm.role_code}
                onChange={(e) => setInviteForm({ ...inviteForm, role_code: e.target.value })}
                className="w-full mt-1 border border-slate-300 rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="sales_executive">Sales Executive</option>
                <option value="sales_lead">Sales Lead</option>
                <option value="pm">Project Manager</option>
                <option value="developer">Developer</option>
                <option value="designer">Designer</option>
                <option value="qa">QA Engineer</option>
                <option value="hr_admin">HR Admin</option>
                <option value="accountant">Accountant</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setInviteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => inviteUserMutation.mutate(inviteForm)}
                disabled={inviteUserMutation.isPending || !inviteForm.email || !inviteForm.full_name}
              >
                {inviteUserMutation.isPending ? "Inviting..." : "Send Invite"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
