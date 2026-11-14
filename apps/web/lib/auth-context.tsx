"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "unavailable";

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  user_type: "internal" | "client";
  is_super_admin: boolean;
  roles: string[];
  permissions: string[];
  client_id?: string | null;
  home_route: string;
}

interface AuthContextType {
  user: UserProfile | null;
  status: AuthStatus;
  isLoading: boolean;
  login: (email: string, password: string, portalType?: "internal" | "portal") => Promise<UserProfile>;
  logout: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<UserProfile>("/auth/me");
      setUser(data);
      setStatus("authenticated");
    } catch (err: any) {
      setUser(null);
      if (err instanceof ApiError && err.status === 401) {
        setStatus("unauthenticated");
      } else {
        setStatus("unavailable");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string, portalType?: "internal" | "portal") => {
    setIsLoading(true);
    try {
      const profile = await api.post<UserProfile>("/auth/login", {
        email,
        password,
        portal_type: portalType,
      });
      setUser(profile);
      setStatus("authenticated");
      router.push(profile.home_route);
      return profile;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      setStatus("unauthenticated");
      router.push("/login");
    }
  };

  const hasPermission = (permissionCode: string) => {
    if (!user) return false;
    if (user.is_super_admin) return true;
    return user.permissions.includes(permissionCode);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isLoading,
        login,
        logout,
        hasPermission,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

