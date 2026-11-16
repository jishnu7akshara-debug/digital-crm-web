"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldAlert, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { PageReady } from "@/components/page-ready";

export default function PortalLoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password, "portal");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F8F8FC] px-4 select-none">
      <PageReady when={true} />
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-[#6C3BDB] flex items-center justify-center font-bold text-white text-xl shadow-md mb-3">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#1D1930] tracking-tight">Customer Portal</h1>
          <p className="text-xs text-[#77738A] mt-1 text-center">
            Access your services, deliverables, invoices, and support
          </p>
        </div>

        <div className="bg-white border border-[#E9E5F0] rounded-xl p-8 shadow-sm">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-xs">
              <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1.5">Business Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#77738A]" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="pl-9 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#77738A]" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="pl-9 text-sm"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2 font-medium" isLoading={isLoading}>
              Sign In to Portal <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E9E5F0] text-xs text-[#77738A] text-center">
            Digital Footprint team member?{" "}
            <Link href="/internal/login" className="text-[#6C3BDB] font-medium hover:underline">
              Staff Console
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

