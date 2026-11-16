"use client";

import React from "react";

export interface PageReadyProps {
  when: boolean;
  state?: "success" | "empty" | "error";
  dataLength?: number;
}

export function PageReady({ when, state = "success", dataLength }: PageReadyProps) {
  if (!when) return null;

  const finalState =
    state === "error"
      ? "error"
      : dataLength !== undefined && dataLength === 0
      ? "empty"
      : state;

  return (
    <span
      data-testid="page-ready"
      data-state={finalState}
      style={{ display: "none" }}
      aria-hidden="true"
    />
  );
}
