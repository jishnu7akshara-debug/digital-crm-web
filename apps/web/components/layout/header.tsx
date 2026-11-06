"use client";

import React from "react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

/**
 * Legacy Header component: In v3 Salesforce Lightning UI,
 * navigation is centralized in SalesforceHeader and PortalHeader in the shell layouts.
 */
export function Header({ title, subtitle }: HeaderProps) {
  return null;
}
