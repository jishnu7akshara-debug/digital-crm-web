"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldAlert, Building, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";

export default function UnifiedLoginPage() {
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
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F8F8FC] px-4 select-none">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-[#6C3BDB] flex items-center justify-center font-bold text-white text-xl shadow-md mb-3">
            DF
          </div>
          <h1 className="text-2xl font-bold text-[#1D1930] tracking-tight">Digital Footprint OS</h1>
          <p className="text-xs text-[#77738A] mt-1 text-center">
            Unified single sign-on for Staff Console and Client Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#E9E5F0] rounded-xl p-8 shadow-sm">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-xs">
              <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#1D1930] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#77738A]" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@digitalfootprint.in"
                  className="pl-9 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#1D1930]">Password</label>
                <span className="text-[11px] text-[#6C3BDB] hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
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
              Sign In <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>

          {/* Quick Pre-fill Credentials for Pair Programming / Review */}
          <div className="mt-6 pt-5 border-t border-[#E9E5F0] text-xs text-[#77738A]">
            <p className="font-semibold text-[#1D1930] mb-2 flex items-center">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-[#6C3BDB]" /> Seeded Demo Credentials:
            </p>
            <div className="bg-[#F5F1FF] p-2.5 rounded-md font-mono text-[11px] text-[#25124D] space-y-1">
              <div>Email: admin@digitalfootprint.in</div>
              <div>Pass: Admin@123456!</div>
            </div>
          </div>
        </div>

        {/* Dedicated Portal Links */}
        <div className="flex items-center justify-center space-x-6 mt-6 text-xs text-[#77738A]">
          <Link href="/internal/login" className="hover:text-[#6C3BDB] flex items-center">
            <ShieldCheck className="h-3 w-3 mr-1" /> Staff Portal
          </Link>
          <span>•</span>
          <Link href="/portal/login" className="hover:text-[#6C3BDB] flex items-center">
            <Building className="h-3 w-3 mr-1" /> Client Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

