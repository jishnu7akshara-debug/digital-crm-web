"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { PageReady } from "@/components/page-ready";

export default function InternalLoginPage() {
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
      await login(email, password, "internal");
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
          {/* Brand Stylized Logo */}
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#7340F5] to-[#5524D4] flex items-center justify-center shadow-lg shadow-purple-900/30 mb-3">
            <svg
              className="h-6 w-6 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4 4h7a8 8 0 0 1 8 8 8 8 0 0 1-8 8H4V4zm7 12a4 4 0 0 0 4-4 4 4 0 0 0-4-4H8v8h3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-[#1D1930] tracking-tight">Digital Footprint OS</h1>
          <p className="text-xs text-[#77738A] mt-1 text-center font-medium">
            Staff & Leadership Console
          </p>
        </div>

        <div className="bg-white border border-[#E9E5F0] rounded-2xl p-8 shadow-sm">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-xs">
              <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1D1930] mb-1.5">Staff Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-[#77738A]" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@digitalfootprint.in"
                  className="pl-10 text-xs bg-[#F8F8FC] border-[#E9E5F0] rounded-xl h-10"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#1D1930]">Password</label>
                <span className="text-[11px] text-[#6437EA] hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-[#77738A]" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="pl-10 text-xs bg-[#F8F8FC] border-[#E9E5F0] rounded-xl h-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-3 font-semibold text-xs h-10 rounded-xl bg-[#6437EA] hover:bg-[#5528DA] text-white shadow-md shadow-purple-900/20"
              isLoading={isLoading}
            >
              Sign In to Console <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#ECE9F4] text-xs text-[#77738A] text-center">
            Client representative?{" "}
            <Link href="/portal/login" className="text-[#6437EA] font-semibold hover:underline">
              Switch to Client Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

