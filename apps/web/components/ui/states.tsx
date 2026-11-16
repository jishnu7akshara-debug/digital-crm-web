"use client";

import React from "react";
import { AlertCircle, RefreshCw, FolderSearch } from "lucide-react";
import { Button } from "./button";
import { PageReady } from "@/components/page-ready";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-[#E2E8F0] ${className}`}
    >
      <PageReady when={true} state="empty" dataLength={0} />
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#F8FAFC] text-[#64748B] mb-4">
        {icon || <FolderSearch className="w-6 h-6" />}
      </div>
      <h3 className="text-[15px] font-semibold text-[#0F172A] mb-1">{title}</h3>
      <p className="text-[13px] text-[#64748B] max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Failed to load data",
  message = "An error occurred while fetching information from the server.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-red-50/50 rounded-2xl border border-red-200 ${className}`}
    >
      <PageReady when={true} state="error" />
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 text-red-600 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-[15px] font-semibold text-red-900 mb-1">{title}</h3>
      <p className="text-[13px] text-red-600 max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="border-red-300 text-red-700 hover:bg-red-100 flex items-center space-x-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try again</span>
        </Button>
      )}
    </div>
  );
}

export function PageSkeleton({
  cardsCount = 4,
  rowsCount = 5,
}: {
  cardsCount?: number;
  rowsCount?: number;
}) {
  return (
    <div className="space-y-6 animate-pulse" data-testid="skeleton">
      {/* Top Banner Skeleton */}
      <div className="h-24 bg-slate-200/60 rounded-2xl border border-slate-200" />

      {/* KPI Cards Skeleton */}
      {cardsCount > 0 && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cardsCount} gap-5`}>
          {Array.from({ length: cardsCount }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-slate-200/50 rounded-2xl border border-slate-200 p-5 space-y-3"
            >
              <div className="h-4 w-24 bg-slate-300/60 rounded" />
              <div className="h-7 w-32 bg-slate-300/80 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Data Table / Content Area Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200/80 rounded" />
        <div className="space-y-3 pt-2">
          {Array.from({ length: rowsCount }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ServiceUnavailable({ onRetry }: { onRetry: () => void }) {
  const [secondsLeft, setSecondsLeft] = React.useState(15);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          onRetry();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onRetry]);

  return (
    <div
      data-testid="service-unavailable"
      className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6 text-center select-none"
    >
      <div className="bg-white border border-[#E5E7EB] rounded-3xl p-8 max-w-md w-full shadow-xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#FFF1F2] border border-[#FFE4E6] text-[#E11D48] flex items-center justify-center mx-auto shadow-inner">
          <AlertCircle className="w-7 h-7 stroke-[2.2]" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
            We can&apos;t reach the server
          </h2>
          <p className="text-[13px] text-[#64748B] mt-1.5 leading-relaxed">
            The Digital Footprint OS backend is currently unreachable. Please check your network connection or verify that the API server is running.
          </p>
        </div>

        <div className="pt-2 pb-1 text-xs text-[#94A3B8] font-medium">
          Auto-retrying in <span className="font-bold text-[#5B4BDB]">{secondsLeft}s</span>
        </div>

        <button
          onClick={() => {
            setSecondsLeft(15);
            onRetry();
          }}
          className="w-full h-11 bg-[#5B4BDB] hover:bg-[#4C3DC7] text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection Now</span>
        </button>
      </div>
    </div>
  );
}

