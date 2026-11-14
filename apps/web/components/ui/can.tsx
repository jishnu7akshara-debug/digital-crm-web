"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";

interface CanProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Declarative RBAC Permission Guard Component (F-12).
 * Conditionally renders children if the authenticated user has the specified permission.
 */
export function Can({ permission, children, fallback = null }: CanProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
