"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push(user.home_route || "/internal/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8F8FC]">
      <div className="flex flex-col items-center space-y-3">
        <div className="h-8 w-8 rounded-full border-2 border-[#6C3BDB] border-t-transparent animate-spin" />
        <span className="text-xs text-[#77738A]">Digital Footprint OS</span>
      </div>
    </div>
  );
}
